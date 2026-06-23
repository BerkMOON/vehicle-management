import type { CompetitionConfig } from '@/pages/Dashboard/CompetitionDashboard/types';
import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  CompetitionAfterSalesRowList,
  CompetitionMetricsParams,
  CompetitionMetricsResult,
  CompetitionNewCarRowList,
  CompetitionReplaceRowsParams,
  CompetitionReplaceRowsResult,
  CompetitionReturnStatusResult,
  CompetitionRowListParams,
} from './typings.d';

const prefix = '/api/admin/competition';

export const CompetitionDashboardAPI = {
  getConfig: () =>
    request<ResponseInfoType<CompetitionConfig>>(`${prefix}/config`, {
      method: 'GET',
    }),

  getNewCarRows: (params: CompetitionRowListParams) =>
    request<ResponseInfoType<CompetitionNewCarRowList>>(
      `${prefix}/new-car/rows`,
      {
        method: 'GET',
        params,
      },
    ),

  getAfterSalesRows: (params: CompetitionRowListParams) =>
    request<ResponseInfoType<CompetitionAfterSalesRowList>>(
      `${prefix}/after-sales/rows`,
      {
        method: 'GET',
        params,
      },
    ),

  replaceNewCarRows: (data: CompetitionReplaceRowsParams) =>
    request<ResponseInfoType<CompetitionReplaceRowsResult>>(
      `${prefix}/new-car/rows`,
      {
        method: 'POST',
        data,
      },
    ),

  replaceAfterSalesRows: (data: CompetitionReplaceRowsParams) =>
    request<ResponseInfoType<CompetitionReplaceRowsResult>>(
      `${prefix}/after-sales/rows`,
      {
        method: 'POST',
        data,
      },
    ),

  getMetrics: (params: CompetitionMetricsParams) =>
    request<ResponseInfoType<CompetitionMetricsResult>>(`${prefix}/metrics`, {
      method: 'GET',
      params,
    }),

  getReturnStatus: (params: { date: string }) =>
    request<ResponseInfoType<CompetitionReturnStatusResult>>(
      `${prefix}/return-status`,
      {
        method: 'GET',
        params,
      },
    ),
};

export type {
  CompetitionAfterSalesRowItem,
  CompetitionAfterSalesRowList,
  CompetitionMetricsParams,
  CompetitionMetricsResult,
  CompetitionNewCarRowItem,
  CompetitionNewCarRowList,
  CompetitionReplaceRowsParams,
  CompetitionReplaceRowsResult,
  CompetitionReturnStatusItem,
  CompetitionReturnStatusResult,
  CompetitionRowInput,
  CompetitionRowListParams,
  CompetitionStoreMetricsItem,
} from './typings.d';
