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
  sn: string;
  status: StatusInfo;
  device_type: string;
  out_time: string;
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
   * 状态，in在库，out已出库
   */
  status?: StorageStatus;
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
}

export interface ReturnItem {
  company_name?: string;
  create_time?: string;
  id?: number;
  modify_time?: string;
  remark?: string;
  sn?: string;
  store_name?: string;
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
