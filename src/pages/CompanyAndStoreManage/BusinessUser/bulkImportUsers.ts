import { SuccessCode } from '@/constants';
import { BusinessUserAPI } from '@/services/businessUser';
import { BusinessUserRoleItem } from '@/services/businessUser/typings';
import { CompanyAPI } from '@/services/company/CompanyController';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import { ResponseInfoType } from '@/types/common';
import * as XLSX from 'xlsx';

const EXISTED_BUSINESS_USERNAME = 700005;

const STORE_ALIAS: Record<string, string[]> = {
  北京奥迪一: ['北京奥迪', '北京奥迪1', '北京奥迪1店'],
  北京奥迪二: ['北京国门', '北京国门奥迪'],
  石家庄奥迪: ['河北奥迪'],
  北京林肯一: ['北京林肯1', '北京林肯1店'],
  北京林肯二: ['北京林肯2', '北京林肯2店'],
  郑州林肯一: ['郑州林肯1', '郑州林肯1店'],
  郑州林肯二: ['郑州林肯2', '郑州林肯2店'],
  石家庄林肯: ['河北林肯'],
  石家庄路虎: ['河北路虎'],
};

const VALID_ROLES = new Set([
  'customer_service_manager',
  'sales_director',
  'sales_install_executor',
  'support_install_executor',
  'support_director',
  'support',
  'device_engineer',
]);

export interface ImportRow {
  rowNo: number;
  storeName: string;
  name: string;
  phone: string;
  role: string;
}

export interface AggregatedUser {
  phone: string;
  name: string;
  roles: Array<{
    storeName: string;
    companyId: number;
    storeId: number;
    role: string;
    sourceRows: number[];
  }>;
}

export interface ImportFailure {
  phone: string;
  name: string;
  reason: string;
  detail?: string;
}

export interface ImportResult {
  totalUsers: number;
  successCount: number;
  failCount: number;
  failures: ImportFailure[];
}

interface StoreLookupItem extends StoreItem {
  companyIdNum: number;
  storeIdNum: number;
}

interface ParsedStoreRole {
  store: string;
  role: string;
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cleanPhone(value: unknown): string {
  let s = cleanText(value);
  if (!s || s.toLowerCase() === 'nan') return '';
  s = s.replace(/\s+/g, '');
  if (s.endsWith('.0')) s = s.slice(0, -2);
  if (/e\+?/i.test(s)) {
    const num = Number(s);
    if (!Number.isNaN(num)) s = String(Math.trunc(num));
  }
  return s;
}

function normalizeStoreName(name: string): string {
  return name.replace(/\s+/g, '').replace(/店$/g, '');
}

function parseStoreRolesJson(raw: string): ParsedStoreRole[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        store: cleanText(item?.store),
        role: cleanText(item?.role),
      }))
      .filter((item) => item.store && item.role);
  } catch {
    return [];
  }
}

async function fetchAllStores(): Promise<StoreLookupItem[]> {
  const companiesRes = await CompanyAPI.getAllCompanies({
    page: 1,
    limit: 100,
  });
  const companies = companiesRes.data?.company_list || [];
  const allStores: StoreLookupItem[] = [];

  for (const company of companies) {
    let page = 1;
    let totalPage = 1;
    while (page <= totalPage) {
      const res = await StoreAPI.getAllStores({
        page,
        limit: 100,
        company_id: company.id,
      });
      const list = res.data?.store_list || [];
      totalPage = res.data?.meta?.total_page || 1;
      list.forEach((store) => {
        if (store.id === ':storeId') return;
        allStores.push({
          ...store,
          companyIdNum: Number(company.id),
          storeIdNum: Number(store.id),
        });
      });
      page += 1;
    }
  }
  return allStores;
}

function resolveStore(
  excelStoreName: string,
  stores: StoreLookupItem[],
): StoreLookupItem | null {
  const raw = cleanText(excelStoreName);
  if (!raw) return null;

  const candidates = new Set<string>([
    raw,
    normalizeStoreName(raw),
    ...(STORE_ALIAS[raw] || []),
    ...(STORE_ALIAS[raw] || []).map(normalizeStoreName),
  ]);

  for (const c of candidates) {
    const hit = stores.find(
      (s) => s.name === c || normalizeStoreName(s.name) === c,
    );
    if (hit) return hit;
  }

  for (const c of candidates) {
    const hit = stores.find(
      (s) =>
        s.name.includes(c) ||
        c.includes(s.name) ||
        normalizeStoreName(s.name).includes(c) ||
        c.includes(normalizeStoreName(s.name)),
    );
    if (hit) return hit;
  }

  return null;
}

function pickColumn(row: Record<string, unknown>, ...names: string[]): unknown {
  const keys = Object.keys(row);
  const key = keys.find((k) => names.some((n) => cleanText(k) === n));
  return key ? row[key] : '';
}

function parseLegacyRows(matrix: Record<string, unknown>[]): ImportRow[] {
  const rows: ImportRow[] = [];
  matrix.forEach((row, index) => {
    const storeName = cleanText(pickColumn(row, '门店'));
    const name = cleanText(pickColumn(row, '姓名'));
    const phone = cleanPhone(pickColumn(row, '电话'));
    const role = cleanText(pickColumn(row, '角色'));

    if (!storeName && !name && !phone && !role) return;

    rows.push({
      rowNo: index + 2,
      storeName,
      name,
      phone,
      role,
    });
  });
  return rows;
}

function parseMergedUsers(matrix: Record<string, unknown>[]): {
  users: AggregatedUser[];
  failures: ImportFailure[];
} {
  const failures: ImportFailure[] = [];
  const users: AggregatedUser[] = [];

  matrix.forEach((row, index) => {
    const rowNo = index + 2;
    const name = cleanText(pickColumn(row, '姓名'));
    const phone = cleanPhone(pickColumn(row, '电话'));
    const storeRolesRaw = cleanText(pickColumn(row, '门店角色'));

    if (!name && !phone && !storeRolesRaw) return;

    if (!phone) {
      failures.push({
        phone: '',
        name,
        reason: '电话为空',
        detail: `第 ${rowNo} 行`,
      });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      failures.push({
        phone,
        name,
        reason: '电话格式无效',
        detail: `第 ${rowNo} 行`,
      });
      return;
    }
    if (!name) {
      failures.push({
        phone,
        name: '',
        reason: '姓名为空',
        detail: `第 ${rowNo} 行`,
      });
      return;
    }

    const storeRoles = parseStoreRolesJson(storeRolesRaw);
    if (storeRoles.length === 0) {
      failures.push({
        phone,
        name,
        reason: '门店角色为空或格式无效',
        detail: `第 ${rowNo} 行，需为 JSON 数组，如 [{"store":"成都奥迪","role":"support"}]`,
      });
      return;
    }

    const roles: AggregatedUser['roles'] = [];
    let invalid = false;

    storeRoles.forEach((item, itemIndex) => {
      if (!item.store) {
        failures.push({
          phone,
          name,
          reason: '门店为空',
          detail: `第 ${rowNo} 行，门店角色第 ${itemIndex + 1} 项`,
        });
        invalid = true;
        return;
      }
      if (!item.role || !VALID_ROLES.has(item.role)) {
        failures.push({
          phone,
          name,
          reason: '角色无效',
          detail: `第 ${rowNo} 行，角色：${item.role || '空'}`,
        });
        invalid = true;
        return;
      }

      const roleKey = `${item.store}::${item.role}`;
      const exists = roles.some((r) => `${r.storeName}::${r.role}` === roleKey);
      if (!exists) {
        roles.push({
          storeName: item.store,
          companyId: 0,
          storeId: 0,
          role: item.role,
          sourceRows: [rowNo],
        });
      }
    });

    if (!invalid && roles.length > 0) {
      users.push({ phone, name, roles });
    }
  });

  return { users, failures };
}

export function aggregateUsers(rows: ImportRow[]): {
  users: AggregatedUser[];
  failures: ImportFailure[];
  invalidPhones: Set<string>;
} {
  const failures: ImportFailure[] = [];
  const invalidPhones = new Set<string>();
  const grouped = new Map<string, AggregatedUser>();

  const markInvalid = (phone: string, failure: ImportFailure) => {
    if (phone) invalidPhones.add(phone);
    failures.push(failure);
  };

  rows.forEach((row) => {
    if (!row.phone) {
      failures.push({
        phone: '',
        name: row.name,
        reason: '电话为空',
        detail: `第 ${row.rowNo} 行`,
      });
      return;
    }
    if (!/^1\d{10}$/.test(row.phone)) {
      markInvalid(row.phone, {
        phone: row.phone,
        name: row.name,
        reason: '电话格式无效',
        detail: `第 ${row.rowNo} 行`,
      });
      return;
    }
    if (!row.name) {
      markInvalid(row.phone, {
        phone: row.phone,
        name: '',
        reason: '姓名为空',
        detail: `第 ${row.rowNo} 行`,
      });
      return;
    }
    if (!row.storeName) {
      markInvalid(row.phone, {
        phone: row.phone,
        name: row.name,
        reason: '门店为空',
        detail: `第 ${row.rowNo} 行`,
      });
      return;
    }
    if (!row.role || !VALID_ROLES.has(row.role)) {
      markInvalid(row.phone, {
        phone: row.phone,
        name: row.name,
        reason: '角色无效',
        detail: `第 ${row.rowNo} 行，角色：${row.role || '空'}`,
      });
      return;
    }

    if (!grouped.has(row.phone)) {
      grouped.set(row.phone, { phone: row.phone, name: row.name, roles: [] });
    }

    const user = grouped.get(row.phone)!;
    if (user.name !== row.name) {
      markInvalid(row.phone, {
        phone: row.phone,
        name: row.name,
        reason: '同一手机号对应多个姓名',
        detail: `第 ${row.rowNo} 行：${row.name}，已有姓名：${user.name}`,
      });
      return;
    }

    const roleKey = `${row.storeName}::${row.role}`;
    const exists = user.roles.some(
      (r) => `${r.storeName}::${r.role}` === roleKey,
    );
    if (!exists) {
      user.roles.push({
        storeName: row.storeName,
        companyId: 0,
        storeId: 0,
        role: row.role,
        sourceRows: [row.rowNo],
      });
    } else {
      const item = user.roles.find(
        (r) => `${r.storeName}::${r.role}` === roleKey,
      )!;
      item.sourceRows.push(row.rowNo);
    }
  });

  const users = Array.from(grouped.values()).filter(
    (user) => !invalidPhones.has(user.phone) && user.roles.length > 0,
  );

  return { users, failures, invalidPhones };
}

export function parseImportWorkbook(file: ArrayBuffer): {
  users: AggregatedUser[];
  failures: ImportFailure[];
} {
  const workbook = XLSX.read(file, {
    type: 'array',
    cellText: true,
    raw: false,
  });
  const mergedSheetName = workbook.SheetNames.find((n) => n === '按手机号汇总');
  const legacySheetName = workbook.SheetNames.find((n) => n === '按人整理');
  const sheetName =
    mergedSheetName || legacySheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const hasMergedColumn = matrix.some((row) => {
    const keys = Object.keys(row);
    return keys.some((k) => cleanText(k) === '门店角色');
  });

  if (mergedSheetName || hasMergedColumn) {
    return parseMergedUsers(matrix);
  }

  const rows = parseLegacyRows(matrix);
  const { users, failures } = aggregateUsers(rows);
  return { users, failures };
}

function getApiError(res: ResponseInfoType<unknown>): string {
  return res.response_status?.msg || `错误码 ${res.response_status?.code}`;
}

async function findUserWithRoles(
  username: string,
): Promise<{ userId: number } | null> {
  const res = await BusinessUserAPI.getAllBusinessUsers({
    page: 1,
    limit: 1,
    username,
  });
  const user = res.data?.user_list?.[0];
  if (!user?.id) return null;
  return { userId: Number(user.id) };
}

function toRoleItems(user: AggregatedUser): BusinessUserRoleItem[] {
  return user.roles.map((r) => ({
    company_id: r.companyId,
    store_id: r.storeId,
    role: r.role,
  }));
}

async function assignUserRoles(
  userId: number,
  username: string,
  roleList: BusinessUserRoleItem[],
): Promise<ResponseInfoType<null>> {
  return BusinessUserAPI.updateRole({
    user_id: userId,
    username,
    role_list: roleList,
  });
}

async function upsertUserRoles(
  user: AggregatedUser,
): Promise<{ ok: true } | { ok: false; reason: string; detail?: string }> {
  const roleList = toRoleItems(user);
  const existingUser = await findUserWithRoles(user.phone);

  if (existingUser) {
    const roleRes = await assignUserRoles(
      existingUser.userId,
      user.phone,
      roleList,
    );
    if (roleRes.response_status?.code !== SuccessCode.SUCCESS) {
      return {
        ok: false,
        reason: '更新角色失败',
        detail: getApiError(roleRes),
      };
    }
    return { ok: true };
  }

  const createRes = await BusinessUserAPI.create({
    username: user.phone,
    password: user.phone,
    nickname: user.name,
    phone: user.phone,
  });

  if (createRes.response_status?.code !== SuccessCode.SUCCESS) {
    if (createRes.response_status?.code === EXISTED_BUSINESS_USERNAME) {
      const retryUser = await findUserWithRoles(user.phone);
      if (retryUser) {
        const roleRes = await assignUserRoles(
          retryUser.userId,
          user.phone,
          roleList,
        );
        if (roleRes.response_status?.code !== SuccessCode.SUCCESS) {
          return {
            ok: false,
            reason: '更新角色失败',
            detail: getApiError(roleRes),
          };
        }
        return { ok: true };
      }
    }
    return {
      ok: false,
      reason:
        createRes.response_status?.code === EXISTED_BUSINESS_USERNAME
          ? '用户名已存在'
          : '创建用户失败',
      detail: getApiError(createRes),
    };
  }

  const createdUser = await findUserWithRoles(user.phone);
  if (!createdUser?.userId) {
    return {
      ok: false,
      reason: '创建后未找到用户',
      detail: '用户可能已创建，但无法查询到 user_id',
    };
  }

  const roleRes = await assignUserRoles(
    createdUser.userId,
    user.phone,
    roleList,
  );
  if (roleRes.response_status?.code !== SuccessCode.SUCCESS) {
    return {
      ok: false,
      reason: '分配角色失败',
      detail: getApiError(roleRes),
    };
  }
  return { ok: true };
}

export async function runBulkImport(
  file: ArrayBuffer,
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  const { users, failures } = parseImportWorkbook(file);
  const stores = await fetchAllStores();

  const pendingUsers: AggregatedUser[] = [];
  users.forEach((user) => {
    let invalid = false;
    user.roles.forEach((roleItem) => {
      const store = resolveStore(roleItem.storeName, stores);
      if (!store) {
        failures.push({
          phone: user.phone,
          name: user.name,
          reason: '门店未匹配',
          detail: `门店「${
            roleItem.storeName
          }」，行号：${roleItem.sourceRows.join('、')}`,
        });
        invalid = true;
        return;
      }
      roleItem.companyId = store.companyIdNum;
      roleItem.storeId = store.storeIdNum;
    });
    if (!invalid && user.roles.length > 0) {
      pendingUsers.push(user);
    } else if (!invalid && user.roles.length === 0) {
      failures.push({
        phone: user.phone,
        name: user.name,
        reason: '无有效角色',
      });
    }
  });

  let successCount = 0;
  const total = pendingUsers.length;

  for (let i = 0; i < pendingUsers.length; i += 1) {
    const user = pendingUsers[i];
    onProgress?.(i + 1, total);

    try {
      const result = await upsertUserRoles(user);
      if (result.ok) {
        successCount += 1;
      } else {
        failures.push({
          phone: user.phone,
          name: user.name,
          reason: result.reason,
          detail: result.detail,
        });
      }
    } catch (error: any) {
      failures.push({
        phone: user.phone,
        name: user.name,
        reason: '请求异常',
        detail: error?.message || String(error),
      });
    }
  }

  return {
    totalUsers: pendingUsers.length,
    successCount,
    failCount: pendingUsers.length - successCount,
    failures,
  };
}
