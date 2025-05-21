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
}
