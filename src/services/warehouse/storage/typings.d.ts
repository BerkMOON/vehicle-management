import { BaseListInfo, PageInfoParams, StatusInfo } from '@/types/common';

export interface StorageItem {
  id: number;
  sn: string;
  device_id: string;
  icc_id: string;
  device_model: string;
  customer: string;
  batch_name: string;
  create_time: string;
  inbound_batch_id: number;
  model: string;
  modify_time: string;
  outbound_batch_id: number;
  scan_date: string;
  status: StatusInfo;
  device_type: string;
  out_time: string;
  inbound_time?: string;
  outbound_time?: string;
}

export interface StorageParams extends PageInfoParams {
  icc_id?: string;
  /**
   * 入库批次id
   */
  inbound_batch_id?: number;
  /**
   * 出库批次id
   */
  outbound_batch_id?: number;
  sn?: string;
  /**
   * 设备型号，如 HY10-EDA
   */
  model?: string;
  /**
   * 状态，in在库，out已出库
   */
  status?: StorageStatus;
  device_type?: number | string;
}

export interface StorageListResponse extends BaseListInfo {
  record_list: StorageItem[];
}

export enum StorageStatus {
  IN = 'in',
  OUT = 'out',
  RETURNED = 'returned',
}

export interface ReturnParams extends PageInfoParams {
  company_id?: number;
  end_time?: string;
  id?: number;
  remark?: string;
  sn?: string;
  start_time?: string;
  store_id?: number;
  /** 处理状态，含 0 */
  process_status?: number;
}

/** 0待处理 1已退厂 2已重新入库 3历史单 */
export enum ReturnProcessStatus {
  PENDING = 0,
  TO_VENDOR = 1,
  RE_INBOUND = 2,
  HISTORICAL = 3,
}

export interface ReturnSnapshot {
  id?: number;
  sn?: string;
  device_id?: string;
  model?: string;
  icc_id?: string;
  scan_date?: string;
  device_model?: string;
  status?: number;
  inbound_batch?: number;
  inbound_time?: string;
  outbound_batch?: number;
  outbound_time?: string;
  device_type?: number;
  ctime?: string;
  mtime?: string;
}

export interface ReturnItem {
  company_name?: string;
  create_time?: string;
  id?: number;
  modify_time?: string;
  remark?: string;
  sn?: string;
  store_name?: string;
  process_status?: StatusInfo;
  return_time?: string;
  re_inbound_time?: string;
  snapshot?: ReturnSnapshot;
}

export interface ReturnListResponse extends BaseListInfo {
  record_list: ReturnItem[];
}

export interface DeviceType {
  type_enum?: number;
  type_name?: string;
  type_sign?: string;
}

export interface DeviceTypeResponse {
  type_list: DeviceType[];
}

export interface DeviceModel {
  model: string;
  model_name?: string;
}

export interface DeviceModelResponse {
  model_list: DeviceModel[];
}

/** 汇影（原慧颖）型号列表，与后端 huiYingModels 对齐 */
export const HUIYING_MODELS = ['HY10-EDA'] as const;

export function isHuiyingModel(model?: string) {
  return !!model && (HUIYING_MODELS as readonly string[]).includes(model);
}
