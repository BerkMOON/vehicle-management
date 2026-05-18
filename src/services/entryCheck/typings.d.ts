import type { MetaInfo } from '@/types/common';

export interface EntryCollisionReportListParams {
  page?: number;
  limit?: number;
  company_id?: number | string;
  store_id?: number | string;
  vin?: string;
  sn?: string;
}

export interface EntryCollisionReportListItem {
  id: number;
  vin: string;
  sn: string;
  device_id: string;
  accident_time: string;
  engineer_name: string;
  is_invalid_device: boolean;
  accident_photo_url: string;
  ctime: string;
}

export interface EntryCollisionReportListResponse {
  meta: MetaInfo;
  item_list: EntryCollisionReportListItem[];
}

export interface EntryCollisionReportDetail
  extends EntryCollisionReportListItem {
  mtime: string;
}

export interface EntryCollisionReportDetailParams {
  id: number;
  company_id?: number | string;
  store_id?: number | string;
}
