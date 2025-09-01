import { BaseListInfo, PageInfoParams, StatusInfo } from '@/types/common';

export interface DeviceResponse extends BaseListInfo {
  device_list: DeviceList[];
}

export interface DeviceList {
  createTime: string;
  mileage: number;
  onsetTime: string;
  phone: string;
  sn: string;
  status: StatusInfo;
  vin: string;
}

export interface DeviceRequest extends PageInfoParams {
  report_status?: 'reported' | 'unreported';
  endTime?: string;
  phone?: string;
  sn?: string;
  startTime?: string;
  onset_start_time?: string;
  onset_end_time?: string;
  store_id?: number | string;
  /**
   * 状态，init未绑定，bound已绑定
   */
  status?: string;
  vin?: string;
}

export interface LossRequest extends PageInfoParams {
  company_id?: number;
  device_id?: string;
  end_time?: string;
  sn?: string;
  start_time?: string;
  store_id?: number;
}

export interface NearbyPoint {
  address: string;
  city: string;
  distance: number | number;
  district: string;
  name: string;
}
export interface LossInfo {
  device_id: string;
  company_name: string;
  store_name: string;
  sn: string;
  trigger_time: string;
  location: string;
  nearby_points: NearbyPoint;
}
export interface LossResponse extends BaseListInfo {
  record_list: LossInfo[];
}
