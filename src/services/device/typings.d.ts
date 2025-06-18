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
  /**
   * 状态，init未绑定，bound已绑定
   */
  status?: string;
  vin?: string;
}
