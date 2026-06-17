import type {
  BackendBinding,
  BackendDetection,
  CompetitionConfig,
} from '@/pages/Dashboard/CompetitionDashboard/types';
import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';

const prefix = '/api/admin/competition';

/** 后端 API 契约（待 incident-detection-platform 实现） */
export const CompetitionDashboardAPI = {
  getConfig: () =>
    request<ResponseInfoType<CompetitionConfig>>(`${prefix}/config`, {
      method: 'GET',
    }),

  getBindings: (params: {
    store_id?: string;
    start_date: string;
    end_date: string;
  }) =>
    request<ResponseInfoType<{ list: BackendBinding[] }>>(
      `${prefix}/bindings`,
      {
        method: 'GET',
        params,
      },
    ),

  getDetections: (params: {
    store_id?: string;
    start_date: string;
    end_date: string;
  }) =>
    request<ResponseInfoType<{ list: BackendDetection[] }>>(
      `${prefix}/detections`,
      {
        method: 'GET',
        params,
      },
    ),

  recalculateMetrics: () =>
    request<ResponseInfoType<null>>(`${prefix}/metrics/recalculate`, {
      method: 'POST',
    }),
};
