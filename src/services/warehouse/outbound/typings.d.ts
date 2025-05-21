import { BaseListInfo, PageInfoParams } from '@/types/common';

export interface OutboundResponse extends BaseListInfo {
  batch_list: OutboundRecordItem[];
}

export interface OutboundProductResponse extends BaseListInfo {
  record_list: OutboundCreateStageRequest[];
}

export interface OutboundRecordItem {
  create_time: string;
  creator_name: string;
  excel_file_url: string;
  extra: string;
  id: number;
  modify_time: string;
  name: string;
  quantity: number;
  store_name: string;
  store_id: string;
  company_id: string;
  company_name: string;
  device_type: string;
  status: {
    code: INBOUND_STATUS_CODE;
    name: string;
  };
}

export interface OutboundProductItem {
  id: string;
  sn: string;
  inbound_record_id: string;
}

export interface OutboundRecordParams extends PageInfoParams {
  product_name?: string;
  start_time?: string;
  end_time?: string;
  status?: INBOUND_STATUS;
}

export enum INBOUND_STATUS {
  PENDING = 'processing',
  COMMITING = 'committing',
  COMPLETED = 'completed',
}

export enum INBOUND_STATUS_CODE {
  COMPLETED,
  PENDING,
}

export interface OutboundCreateRequest {
  name: string;
  excel_file_path: string;
  extra: string;
  receivable_quantity: number;
}

export interface OutboundCreateStageRequest {
  batch_id: number;
  sn: string;
}

export interface TableItem {
  key: string;
  sn: string;
  imei: string;
  iccid: string;
  scan_date?: string;
  device_model?: string;
  customer?: string;
  isChecked: boolean;
  isDuplicate?: boolean;
  [key: string]: any;
}

export const fieldMapping: Record<string, string> = {
  SN码: 'sn',
  IMEI号: 'imei',
  ICCID号: 'iccid',
  扫码日期: 'scan_date',
  设备型号: 'device_model',
  所属客户: 'customer',
};
