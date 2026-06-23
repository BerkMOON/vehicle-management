import { CompetitionDashboardAPI } from '@/services/competitionDashboard';
import { TableType, VehicleRow } from '../types';
import { assertApiSuccess } from './apiAdapter';
import { dedupeVehicleRows } from './excelParser';

export function buildRowKey(businessDate: string, vin: string): string {
  return `${businessDate}|${vin}`;
}

/** 拉取该门店在文件涉及日期范围内，后端已入库的 business_date|vin */
export async function fetchExistingRowKeys(params: {
  tableType: TableType;
  backendStoreId: number;
  businessDates: string[];
}): Promise<Set<string>> {
  const keys = new Set<string>();
  if (params.businessDates.length === 0) return keys;

  const sorted = [...params.businessDates].sort();
  const startDate = sorted[0];
  const endDate = sorted[sorted.length - 1];
  let page = 1;
  let totalPage = 1;

  while (page <= totalPage) {
    const listParams = {
      store_id: params.backendStoreId,
      start_date: startDate,
      end_date: endDate,
      page,
      limit: 200,
    };
    const res =
      params.tableType === 'new_car'
        ? await CompetitionDashboardAPI.getNewCarRows(listParams)
        : await CompetitionDashboardAPI.getAfterSalesRows(listParams);
    const data = assertApiSuccess(res, '查询已有数据失败');
    totalPage = data.meta?.total_page || 1;
    (data.list || []).forEach((item) => {
      keys.add(buildRowKey(item.business_date, item.vin));
    });
    page += 1;
  }

  return keys;
}

export function filterRowsAgainstBackend(
  rows: VehicleRow[],
  existingKeys: Set<string>,
): { toUpload: VehicleRow[]; skippedExistingCount: number } {
  const toUpload: VehicleRow[] = [];
  let skippedExistingCount = 0;

  rows.forEach((row) => {
    if (existingKeys.has(buildRowKey(row.businessDate, row.vin))) {
      skippedExistingCount += 1;
    } else {
      toUpload.push(row);
    }
  });

  return { toUpload, skippedExistingCount };
}

export interface PrepareUploadRowsResult {
  toUpload: VehicleRow[];
  /** 解析通过的行数（去重前） */
  parsedCount: number;
  /** 多 sheet 内 business_date+vin 合并去掉的行数 */
  mergedDuplicateCount: number;
  /** 后端已存在而跳过的行数 */
  skippedExistingCount: number;
  uploadCount: number;
}

/** 合并表内重复后，过滤掉后端已入库的行 */
export async function prepareRowsForUpload(params: {
  rows: VehicleRow[];
  tableType: TableType;
  backendStoreId: number;
  businessDates: string[];
}): Promise<PrepareUploadRowsResult> {
  const merged = dedupeVehicleRows(params.rows);
  const mergedDuplicateCount = params.rows.length - merged.length;
  const existingKeys = await fetchExistingRowKeys({
    tableType: params.tableType,
    backendStoreId: params.backendStoreId,
    businessDates: params.businessDates,
  });
  const { toUpload, skippedExistingCount } = filterRowsAgainstBackend(
    merged,
    existingKeys,
  );

  return {
    toUpload,
    parsedCount: params.rows.length,
    mergedDuplicateCount,
    skippedExistingCount,
    uploadCount: toUpload.length,
  };
}
