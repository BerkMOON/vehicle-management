import { BaseListInfo, PageInfoParams } from '@/types/common';

export interface InboundResponse extends BaseListInfo {
  batch_list: InboundRecordItem[];
}

export interface InboundProductResponse extends BaseListInfo {
  record_list: InboundCreateStageRequest[];
}

export interface InboundRecordItem {
  create_time: string;
  creator_name: string;
  excel_file_url: string;
  result_excel_url: string;
  extra: string;
  id: number;
  modify_time: string;
  name: string;
  receivable_quantity: number;
  received_quantity: number;
  device_type: string;
  status: {
    code: INBOUND_STATUS_CODE;
    name: string;
  };
}

export interface InboundProductItem {
  id: string;
  sn: string;
  inbound_record_id: string;
}

export interface InboundRecordParams extends PageInfoParams {
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

export interface InboundCreateRequest {
  name: string;
  excel_file_path: string;
  extra: string;
  receivable_quantity: number;
}

export interface InboundCreateStageRequest {
  batch_id: number;
  device_id: string;
  device_model?: string;
  icc_id: string;
  scan_date?: string;
  sn: string;
  // SG30-EDA 非云卡
  // SG30K-EDA 云卡
  model: string;
}

/** SG30-EDA 非云卡；SG30K-EDA 云卡 */
export const INBOUND_DEVICE_MODEL = {
  NON_CLOUD: 'SG30-EDA',
  CLOUD: 'SG30K-EDA',
} as const;

export const INBOUND_DEVICE_MODEL_OPTIONS = [
  { label: 'SG30-EDA（非云卡）', value: INBOUND_DEVICE_MODEL.NON_CLOUD },
  { label: 'SG30K-EDA（云卡）', value: INBOUND_DEVICE_MODEL.CLOUD },
];

export interface TableItem {
  key: string;
  sn: string;
  imei: string;
  iccid: string;
  scan_date?: string;
  device_model?: string;
  model?: string;
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

export interface CacheList extends BaseListInfo {
  record_list: string[];
}
