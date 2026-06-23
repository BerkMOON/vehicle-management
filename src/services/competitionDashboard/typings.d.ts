import { BaseListInfo, PageInfoParams } from '@/types/common';

/** 行数据查询通用参数 */
export interface CompetitionRowListParams extends PageInfoParams {
  store_id?: number;
  start_date?: string;
  end_date?: string;
  business_date?: string;
  vin?: string;
}

export interface CompetitionNewCarRowItem {
  id: number;
  store_id: number;
  store_name?: string;
  business_date: string;
  vin: string;
  installed_flag?: string;
  remark?: string;
  ctime: string;
  mtime: string;
}

export interface CompetitionAfterSalesRowItem {
  id: number;
  store_id: number;
  store_name?: string;
  business_date: string;
  vin: string;
  installed_flag?: string;
  remark?: string;
  ctime: string;
  mtime: string;
}

export interface CompetitionNewCarRowList extends BaseListInfo {
  list: CompetitionNewCarRowItem[];
}

export interface CompetitionAfterSalesRowList extends BaseListInfo {
  list: CompetitionAfterSalesRowItem[];
}

/** POST 写入单行 */
export interface CompetitionRowInput {
  business_date: string;
  vin: string;
  installed_flag?: string;
  remark?: string;
}

export interface CompetitionReplaceRowsParams {
  store_id: number;
  rows: CompetitionRowInput[];
}

export interface CompetitionReplaceRowsResult {
  replaced_dates: string[];
  inserted_count: number;
}

export interface CompetitionMetricsParams {
  start_date: string;
  end_date: string;
}

export interface CompetitionStoreMetricsItem {
  store_id: number;
  store_name: string;
  new_car_sales: number;
  entry_total: number;
  entry_not_installed_excel: number;
  new_bindings: number;
  entry_new_bindings: number;
  inspected_count: number;
  comprehensive_ratio: number;
  inspection_coverage_ratio: number;
  after_sales_ratio: number;
  comprehensive_ok: boolean;
  inspection_coverage_ok: boolean;
  after_sales_ok: boolean;
}

export interface CompetitionMetricsResult {
  list: CompetitionStoreMetricsItem[];
  date_range: { start_date: string; end_date: string };
  calculated_at: string;
}

export interface CompetitionReturnStatusItem {
  store_id: number;
  store_name: string;
  new_car: { uploaded: boolean; row_count: number };
  entry_check: { uploaded: boolean; row_count: number };
  completed: boolean;
}

export interface CompetitionReturnStatusResult {
  list: CompetitionReturnStatusItem[];
}
