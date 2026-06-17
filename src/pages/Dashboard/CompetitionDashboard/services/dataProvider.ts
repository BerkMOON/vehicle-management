import {
  DEFAULT_COMPETITION_CONFIG,
  MAX_PARSE_ERROR_ROWS,
  STORAGE_KEYS,
} from '../constants';
import {
  AnomalyItem,
  BackendBinding,
  BackendDetection,
  CompetitionConfig,
  ParseErrorRow,
  PendingFile,
  StoreMetrics,
  UploadRecord,
  VehicleRow,
} from '../types';
import {
  fetchAllBindings,
  fetchAllDetections,
  fetchBackendStoreLinks,
  fetchStoreBackendData,
} from '../utils/backendFetch';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** 合并 localStorage 中的用户配置与代码内最新的门店名单/别名 */
function mergeCompetitionConfig(saved: CompetitionConfig): CompetitionConfig {
  return {
    startDate: saved.startDate ?? DEFAULT_COMPETITION_CONFIG.startDate,
    endDate: saved.endDate ?? DEFAULT_COMPETITION_CONFIG.endDate,
    targets: saved.targets ?? DEFAULT_COMPETITION_CONFIG.targets,
    autoRefreshMinutes:
      saved.autoRefreshMinutes ?? DEFAULT_COMPETITION_CONFIG.autoRefreshMinutes,
    stores: DEFAULT_COMPETITION_CONFIG.stores,
  };
}

export function getConfig(): CompetitionConfig {
  const saved = readJson<CompetitionConfig | null>(STORAGE_KEYS.config, null);
  if (!saved) return DEFAULT_COMPETITION_CONFIG;
  return mergeCompetitionConfig(saved);
}

export function saveConfig(config: CompetitionConfig) {
  writeJson(STORAGE_KEYS.config, mergeCompetitionConfig(config));
}

export function getVehicleRows(): VehicleRow[] {
  return readJson<VehicleRow[]>(STORAGE_KEYS.vehicleRows, []);
}

export function saveVehicleRows(rows: VehicleRow[]) {
  writeJson(STORAGE_KEYS.vehicleRows, rows);
}

export function getUploadRecords(): UploadRecord[] {
  return readJson<UploadRecord[]>(STORAGE_KEYS.uploadRecords, []);
}

export function saveUploadRecords(records: UploadRecord[]) {
  writeJson(STORAGE_KEYS.uploadRecords, records);
}

export function getPendingFiles(): PendingFile[] {
  return readJson<PendingFile[]>(STORAGE_KEYS.pendingFiles, []);
}

export function savePendingFiles(files: PendingFile[]) {
  writeJson(STORAGE_KEYS.pendingFiles, files);
}

export function getAnomalies(): AnomalyItem[] {
  return readJson<AnomalyItem[]>(STORAGE_KEYS.anomalies, []);
}

export function saveAnomalies(items: AnomalyItem[]) {
  writeJson(STORAGE_KEYS.anomalies, items);
}

export function getMetricsSnapshot(): StoreMetrics[] {
  return readJson<StoreMetrics[]>(STORAGE_KEYS.metricsSnapshot, []);
}

export function saveMetricsSnapshot(metrics: StoreMetrics[]) {
  writeJson(STORAGE_KEYS.metricsSnapshot, metrics);
}

export function getParseErrors(): ParseErrorRow[] {
  return readJson<ParseErrorRow[]>(STORAGE_KEYS.parseErrors, []);
}

export function appendParseErrors(errors: ParseErrorRow[]) {
  if (errors.length === 0) return;
  const merged = [...errors, ...getParseErrors()].slice(
    0,
    MAX_PARSE_ERROR_ROWS,
  );
  writeJson(STORAGE_KEYS.parseErrors, merged);
}

export function clearParseErrors() {
  writeJson(STORAGE_KEYS.parseErrors, []);
}

/** 按 PRD 7.1-6：替换该门店该表类型在业务日期下的已有行 */
export function replaceRowsByBusinessDates(params: {
  storeId: string;
  tableType: string;
  businessDates: string[];
  newRows: VehicleRow[];
}): VehicleRow[] {
  const { storeId, tableType, businessDates, newRows } = params;
  const dateSet = new Set(businessDates);
  const kept = getVehicleRows().filter(
    (row) =>
      !(
        row.storeId === storeId &&
        row.tableType === tableType &&
        dateSet.has(row.businessDate)
      ),
  );
  return [...kept, ...newRows];
}

export async function fetchBackendBindings(
  config: CompetitionConfig,
): Promise<BackendBinding[]> {
  try {
    return await fetchAllBindings(config);
  } catch (error) {
    console.warn('[CompetitionDashboard] fetch bindings failed', error);
    return [];
  }
}

export async function fetchBackendDetections(
  config: CompetitionConfig,
): Promise<BackendDetection[]> {
  try {
    return await fetchAllDetections(config);
  } catch (error) {
    console.warn('[CompetitionDashboard] fetch detections failed', error);
    return [];
  }
}

export { fetchBackendStoreLinks, fetchStoreBackendData };

export function clearAllLocalData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
