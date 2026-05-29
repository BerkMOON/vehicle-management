import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  EntryCollisionReportDetail,
  EntryCollisionReportDetailParams,
  EntryCollisionReportListParams,
  EntryCollisionReportListResponse,
  EntryInspectionLogListParams,
  EntryInspectionLogListResponse,
} from './typings';

const COLLISION_API_PREFIX = '/api/admin/device/entry-collision-report';
const INSPECTION_LOG_API_PREFIX = '/api/admin/device/entry-inspection-log';

/** 后台 - 入场检测碰撞线索查询 */
export const EntryCheckAPI = {
  /**
   * GET /api/admin/device/entry-collision-report/list
   * 可选 query：company_id、store_id（亦支持 companyId、storeId；不传则查全部）
   */
  listCollisionReports: (params: EntryCollisionReportListParams) =>
    request<ResponseInfoType<EntryCollisionReportListResponse>>(
      `${COLLISION_API_PREFIX}/list`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * GET /api/admin/device/entry-collision-report/detail
   */
  getCollisionReportDetail: (params: EntryCollisionReportDetailParams) =>
    request<ResponseInfoType<EntryCollisionReportDetail>>(
      `${COLLISION_API_PREFIX}/detail`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * GET /api/admin/device/entry-inspection-log/list
   * 查询维度：company_id、store_id、vin、record_date（或 date）
   */
  listInspectionLogs: (params: EntryInspectionLogListParams) =>
    request<ResponseInfoType<EntryInspectionLogListResponse>>(
      `${INSPECTION_LOG_API_PREFIX}/list`,
      {
        method: 'GET',
        params,
      },
    ),
};
