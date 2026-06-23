export type Brand = 'audi' | 'lincoln' | 'hongqi';

export type TableType = 'new_car' | 'entry_check';

export type UploadParseStatus = 'success' | 'partial' | 'failed' | 'pending';

export interface CompetitionStore {
  id: string;
  name: string;
  brand: Brand;
  aliases: string[];
  active: boolean;
}

export interface CompetitionConfig {
  startDate: string;
  endDate: string;
  targets: {
    comprehensive: number;
    inspectionCoverage: number;
    afterSales: number;
  };
  autoRefreshMinutes: number;
  stores: CompetitionStore[];
}

/** 指标计算所选业务日期范围（Excel 业务日期 + 后台绑定/检测日期） */
export interface MetricsDateRange {
  startDate: string;
  endDate: string;
}

export interface VehicleRow {
  id: string;
  storeId: string;
  storeName: string;
  tableType: TableType;
  vin: string;
  plateNo?: string;
  businessDate: string;
  installedFlag?: string;
  repairType?: string;
  remark?: string;
  uploadRecordId: string;
  sourceFileName: string;
  rowNo: number;
}

export interface UploadRecord {
  id: string;
  storeId: string;
  storeName: string;
  tableType: TableType;
  businessDates: string[];
  /** 从文件名解析的报表日期，用于催报判定 */
  reportDate?: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy?: string;
  rowCount: number;
  validRowCount: number;
  parseStatus: UploadParseStatus;
  errorMessage?: string;
}

export interface ParseErrorRow {
  id: string;
  fileName: string;
  rowNo: number;
  reason: string;
  rawVin?: string;
  /** Excel 原始日期单元格 */
  rawBusinessDate?: string;
  businessDate?: string;
  installedFlag?: string;
  remark?: string;
  storeId?: string;
  storeName?: string;
  tableType?: TableType;
  status: 'open' | 'resolved';
  createdAt: string;
}

/** 解析阶段尚未写入 id 的失败行 */
export type ParseErrorDraft = Omit<
  ParseErrorRow,
  'id' | 'status' | 'createdAt'
>;

/** 手动修正解析失败行后提交 */
export interface ParseErrorFixInput {
  errorId: string;
  storeId: string;
  tableType: TableType;
  businessDate: string;
  vin: string;
  installedFlag?: string;
  remark?: string;
}

export interface PendingFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  reason: string;
  fileBase64?: string;
}

/** 上传确认弹窗中的单文件草稿（尚未请求后端） */
export interface UploadConfirmDraft {
  id: string;
  file: File;
  fileName: string;
  storeId: string | null;
  storeName: string | null;
  tableType: TableType | null;
  reportDate: string | null;
  /** 文件名自动识别说明 */
  matchHint: string;
}

export interface BackendBinding {
  vin: string;
  storeId: string;
  storeName: string;
  bindDate: string;
  channel?: string;
  accountRole?: string;
}

export interface BackendDetection {
  vin: string;
  storeId: string;
  storeName: string;
  detectDate: string;
  hasPhoto: boolean;
}

export interface ReturnStatusCell {
  uploaded: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  rowCount?: number;
}

export interface StoreReturnStatus {
  storeId: string;
  storeName: string;
  brand: Brand;
  newCar: ReturnStatusCell;
  entryCheck: ReturnStatusCell;
  completed: boolean;
}

export interface StoreMetrics {
  storeId: string;
  storeName: string;
  brand: Brand;
  newCarSales: number;
  entryTotal: number;
  /** 进店日前后台无绑定（旧口径，对账用） */
  entryNotInstalled: number;
  /** 售后入厂中 Excel 标记未装记录仪的 VIN 数（售后渗透率分母） */
  entryNotInstalledExcel: number;
  newBindings: number;
  entryNewBindings: number;
  inspectedCount: number;
  /** 渗透率，小数形式（如 1.333333），与排名 Excel 一致 */
  comprehensiveRatio: number;
  inspectionCoverageRatio: number;
  afterSalesRatio: number;
  comprehensiveOk: boolean;
  inspectionCoverageOk: boolean;
  afterSalesOk: boolean;
  calculatedAt: string;
}

export interface AnomalyItem {
  id: string;
  storeId: string;
  storeName: string;
  vin: string;
  type:
    | 'parse_error'
    | 'detect_without_entry'
    | 'entry_without_detect'
    | 'installed_without_bind';
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface BatchUploadResult {
  successCount: number;
  pendingCount: number;
  errorCount: number;
  records: UploadRecord[];
  parseErrors: ParseErrorRow[];
}

/** 单店后台数据拉取状态 */
export type StoreBackendRefreshStatus =
  | 'idle'
  | 'loading'
  | 'done'
  | 'error'
  | 'no_link';

export interface StoreBackendFetchResult {
  storeId: string;
  bindings: BackendBinding[];
  detections: BackendDetection[];
}

export interface RefreshMetricsProgressHandlers {
  /** Excel 分母等指标立即可用 */
  onExcelReady: (metrics: StoreMetrics[]) => void;
  onStoreStatus: (storeId: string, status: StoreBackendRefreshStatus) => void;
  onStoreMetrics: (storeId: string, metrics: StoreMetrics) => void;
  onComplete: (result: {
    metrics: StoreMetrics[];
    bindingsCount: number;
    detectionsCount: number;
    linkedStoreCount: number;
  }) => void;
}
