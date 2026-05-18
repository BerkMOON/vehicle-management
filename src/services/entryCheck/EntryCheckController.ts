import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  EntryCollisionReportDetail,
  EntryCollisionReportDetailParams,
  EntryCollisionReportListParams,
  EntryCollisionReportListResponse,
} from './typings';

const API_PREFIX = '/api/admin/device/entry-collision-report';

/** 后台 - 入场检测碰撞线索查询 */
export const EntryCheckAPI = {
  /**
   * GET /api/admin/device/entry-collision-report/list
   * 可选 query：company_id、store_id（亦支持 companyId、storeId；不传则查全部）
   */
  listCollisionReports: (params: EntryCollisionReportListParams) =>
    request<ResponseInfoType<EntryCollisionReportListResponse>>(
      `${API_PREFIX}/list`,
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
      `${API_PREFIX}/detail`,
      {
        method: 'GET',
        params,
      },
    ),
};
