import * as XLSX from 'xlsx';
import {
  CompetitionConfig,
  CompetitionStore,
  ParseErrorRow,
  TableType,
  VehicleRow,
} from '../types';
import { NormalizeDateContext, normalizeExcelDate } from './date';
import { cleanVin, isExcelNotInstalled } from './vin';

/** 上传前按 business_date + vin 去重（多 sheet 合并时常见重复） */
export function dedupeVehicleRows(rows: VehicleRow[]): VehicleRow[] {
  const order: string[] = [];
  const merged = new Map<string, VehicleRow>();

  rows.forEach((row) => {
    const key = `${row.businessDate}|${row.vin}`;
    const prev = merged.get(key);
    if (!prev) {
      order.push(key);
      merged.set(key, row);
      return;
    }
    const prevInstalled = !isExcelNotInstalled(prev.installedFlag);
    const nextInstalled = !isExcelNotInstalled(row.installedFlag);
    merged.set(key, {
      ...row,
      installedFlag: nextInstalled
        ? row.installedFlag
        : prevInstalled
        ? prev.installedFlag
        : row.installedFlag || prev.installedFlag,
      remark: row.remark || prev.remark,
    });
  });

  return order.map((key) => merged.get(key)!);
}

interface RawExcelRow {
  rowNo: number;
  businessDate: string | null;
  vinRaw: unknown;
  plateNo?: string;
  installedFlag?: string;
  repairType?: string;
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function findHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(cleanText);
    const hasVin = cells.some((cell) => /车架号|^VIN$/i.test(cell));
    const hasDate = cells.some((cell) => /日期|进店日期|业务日期/.test(cell));
    if (hasVin && hasDate) return i;
    if (hasVin) return i;
  }
  return 0;
}

function findColumnIndex(
  headers: string[],
  patterns: RegExp[],
  fallbackIndex: number,
): number {
  const idx = headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header)),
  );
  return idx >= 0 ? idx : fallbackIndex;
}

function pickCell(row: unknown[], index: number): unknown {
  if (index < 0 || index >= row.length) return '';
  return row[index] ?? '';
}

function parseSheetMatrix(
  sheet: XLSX.WorkSheet,
  dateContext: NormalizeDateContext,
  startRowNo = 2,
): RawExcelRow[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  });

  if (matrix.length === 0) return [];

  const headerRowIndex = findHeaderRowIndex(matrix);
  const headers = (matrix[headerRowIndex] || []).map(cleanText);

  const dateIdx = findColumnIndex(headers, [/日期/, /进店日期/, /业务日期/], 1);
  const vinIdx = findColumnIndex(headers, [/车架号/, /^VIN$/i], 2);
  const plateIdx = findColumnIndex(headers, [/车牌号/], -1);
  const installedIdx = findColumnIndex(
    headers,
    [/是否安装易达安记录仪/, /是否加装易达安记录仪/, /是否加装/],
    3,
  );
  const repairIdx = findColumnIndex(headers, [/维修类型/], -1);

  return matrix
    .slice(headerRowIndex + 1)
    .map((row, index) => {
      const cells = Array.isArray(row) ? row : [];
      const businessDate = normalizeExcelDate(
        pickCell(cells, dateIdx),
        dateContext,
      );
      const vinRaw = pickCell(cells, vinIdx);
      return {
        rowNo: headerRowIndex + index + startRowNo + 1,
        businessDate,
        vinRaw,
        plateNo:
          plateIdx >= 0 ? cleanText(pickCell(cells, plateIdx)) : undefined,
        installedFlag: cleanText(pickCell(cells, installedIdx)) || undefined,
        repairType:
          repairIdx >= 0 ? cleanText(pickCell(cells, repairIdx)) : undefined,
      };
    })
    .filter((row) => {
      const vinText = cleanText(row.vinRaw);
      if (!vinText || vinText === '车架号' || vinText === 'VIN') return false;
      return (
        row.businessDate ||
        vinText ||
        row.plateNo ||
        row.installedFlag ||
        row.repairType
      );
    });
}

function sheetHasVinHeader(sheet: XLSX.WorkSheet): boolean {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  });
  for (let i = 0; i < Math.min(matrix.length, 15); i += 1) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(cleanText);
    if (cells.some((cell) => /车架号|^VIN$/i.test(cell))) return true;
  }
  return false;
}

function readWorkbookRows(
  buffer: ArrayBuffer,
  dateContext: NormalizeDateContext,
): RawExcelRow[] {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellText: true,
    raw: false,
  });
  const sheetNames = workbook.SheetNames.filter((name) => name !== '说明');

  if (sheetNames.length >= 2) {
    const dataSheetNames = sheetNames.filter((name) =>
      sheetHasVinHeader(workbook.Sheets[name]),
    );
    if (dataSheetNames.length > 0) {
      return dataSheetNames.flatMap((name) =>
        parseSheetMatrix(workbook.Sheets[name], dateContext),
      );
    }
  }

  const sheetName = sheetNames[0];
  if (!sheetName) return [];
  return parseSheetMatrix(workbook.Sheets[sheetName], dateContext);
}

export interface ParseExcelResult {
  rows: VehicleRow[];
  errors: ParseErrorRow[];
  businessDates: string[];
  /** 解析通过、合并表内重复前的有效行数 */
  rawValidCount: number;
  /** 多 sheet 内同 business_date+vin 合并去掉的行数 */
  mergedDuplicateCount: number;
}

export function parseExcelFile(params: {
  buffer: ArrayBuffer;
  fileName: string;
  tableType: TableType;
  store: CompetitionStore;
  uploadRecordId: string;
  reportDate?: string | null;
  competitionConfig?: Pick<CompetitionConfig, 'startDate' | 'endDate'>;
}): ParseExcelResult {
  const {
    buffer,
    fileName,
    tableType,
    store,
    uploadRecordId,
    reportDate,
    competitionConfig,
  } = params;
  const dateContext: NormalizeDateContext = { competitionConfig, reportDate };
  const rawRows = readWorkbookRows(buffer, dateContext);
  const rows: VehicleRow[] = [];
  const errors: ParseErrorRow[] = [];

  rawRows.forEach((raw) => {
    const vinResult = cleanVin(raw.vinRaw);
    const businessDate = raw.businessDate || reportDate || null;

    if (!businessDate) {
      errors.push({
        id: `${uploadRecordId}-${raw.rowNo}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        fileName,
        rowNo: raw.rowNo,
        reason: '业务日期无效',
        rawVin: vinResult.vin,
      });
      return;
    }
    if (!vinResult.valid) {
      errors.push({
        id: `${uploadRecordId}-${raw.rowNo}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        fileName,
        rowNo: raw.rowNo,
        reason: vinResult.reason || '车架号无效',
        rawVin: vinResult.vin,
      });
      return;
    }

    rows.push({
      id: `${uploadRecordId}-${raw.rowNo}`,
      storeId: store.id,
      storeName: store.name,
      tableType,
      vin: vinResult.vin,
      plateNo: raw.plateNo || undefined,
      businessDate,
      installedFlag: raw.installedFlag || undefined,
      repairType: raw.repairType || undefined,
      uploadRecordId,
      sourceFileName: fileName,
      rowNo: raw.rowNo,
    });
  });

  const dedupedRows = dedupeVehicleRows(rows);

  return {
    rows: dedupedRows,
    errors,
    businessDates: Array.from(
      new Set(dedupedRows.map((row) => row.businessDate)),
    ),
    rawValidCount: rows.length,
    mergedDuplicateCount: rows.length - dedupedRows.length,
  };
}

export async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function base64ToBuffer(base64: string): Promise<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
