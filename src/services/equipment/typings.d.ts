import { BaseListInfo, PageInfoParams, StatusInfo } from '@/types/common';

export interface EquipmentRecordItem {
  id: number;
  device_id: string;
  model: string;
  username: string;
  secret: string;
  status: {
    code: number;
    name: string;
  };
  create_time: string;
  modify_time: string;
}

export interface EquipmentRecordList extends BaseListInfo {
  record_list: EquipmentRecordItem[];
}

export interface EquipmentRecordParams extends PageInfoParams {
  device_id?: string;
  model?: string;
  status?: string;
}

export interface CreateEquipmentRecordParams {
  sn: string;
  model: string;
  username: string;
  secret: string;
  ext: string;
}

export interface UpdateEquipmentRecordStatusParams {
  record_id: number;
  device_id: string;
  status: string;
}

export interface UpdateEquipmentRecordParams {
  record_id: number;
  model: string;
  username: string;
  secret: string;
  ext: string;
}

export interface EquipmentRelationParams extends PageInfoParams {
  /**
   * 公司id
   */
  company_id?: number;
  /**
   * 设备号
   */
  device_id?: string;
  /**
   * 用户openid
   */
  open_id?: string;
  /**
   * 用户手机号
   */
  phone?: string;
  /**
   * 状态，active生效，deleted失效
   */
  status?: string;
  /**
   * 门店id
   */
  store_id?: number;
}

export interface EquipmentRelationList extends BaseListInfo {
  relation_list: EquipmentRelationItem[];
}

export interface EquipmentRelationItem {
  id: number;
  device_id: string;
  open_id: string;
  phone: string;
  company_name: string;
  store_name: string;
  b_status: StatusInfo;
  c_status: StatusInfo;
  vin: string;
  create_time: string;
  modify_time: string;
}

export interface CreateEquipmentRelationParams {
  sn: string;
  open_id: string;
  phone: string;
  company_id: number;
  store_id: number;
}

export interface UpdateEquipmentRelationParams {
  relation_id: number;
  open_id: string;
  phone: string;
  company_id: number;
  store_id: number;
}

export interface UpdateEquipmentRelationStatusParams {
  relation_id: number;
  status: string;
}

export enum EquipmentCStatus {
  init = 'init',
  binded = 'binded',
  deleted = 'deleted',
}

export interface GetDeviceVersion {
  alg_version?: string;
  create_time?: string;
  cur_version?: string;
  device_id?: string;
  modify_time?: string;
  sn?: string;
}
