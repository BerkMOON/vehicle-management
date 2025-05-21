/* eslint-disable */
import { CreatorList, PageInfoParams, ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  CacheList,
  InboundCreateRequest,
  InboundCreateStageRequest,
  InboundProductResponse,
  InboundRecordItem,
  InboundRecordParams,
  InboundResponse,
} from './typings';

const API_PREFIX = '/api/admin/warehouse/inbound';
const API_PREFIX_BATCH = '/api/admin/warehouse/inbound/batch';
const API_PREFIX_STAGE = '/api/admin/warehouse/inbound/staging';

export const InboundAPI = {
  /**
   * 入库批次列表
   * GET /api/admin/warehouse/inbound/batch/list
   * 接口ID：284997923
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-284997923
   */

  getInboundRecords: (params?: InboundRecordParams) =>
    request<ResponseInfoType<InboundResponse>>(`${API_PREFIX_BATCH}/list`, {
      method: 'GET',
      params,
    }),

  /**
   * 创建入库批次
   * POST /api/admin/warehouse/inbound/batch/create
   * 接口ID：285002044
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285002044
   *
   */
  createInboundRecord: (data: InboundCreateRequest) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/create`, {
      method: 'POST',
      data,
    }),

  /**
   * 更新批次信息
   * POST /api/admin/warehouse/inbound/batch/update
   * 接口ID：285480705
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285480705
   */
  updateInboundRecord: (data: InboundCreateRequest) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/update`, {
      method: 'POST',
      data,
    }),

  /**
   * 插入暂存区
   * POST /api/admin/warehouse/inbound/staging/create
   * 接口ID：285622357
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285622357
   */
  createStagingRecord: (data: InboundCreateStageRequest) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_STAGE}/create`, {
      method: 'POST',
      data,
    }),

  /**
   * 清空暂存区
   * POST /api/admin/warehouse/inbound/staging/clear
   * 接口ID：285624696
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285624696
   */
  clearStagingRecord: (data: { batch_id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_STAGE}/clear`, {
      method: 'POST',
      data,
    }),

  /**
   * 暂存区列表
   * GET /api/admin/warehouse/inbound/staging/list
   * 接口ID：285625272
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285625272
   */
  getStagingRecord: (params: {
    batch_id: number;
    page?: number;
    limit?: number;
  }) =>
    request<ResponseInfoType<CacheList>>(`${API_PREFIX_STAGE}/list`, {
      method: 'GET',
      params,
    }),

  /**
   * 暂存区提交
   * POST /api/admin/warehouse/inbound/staging/commit
   * 接口ID：286143993
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-286143993
   */
  commitStagingRecord: (data: {
    batch_id: number;
    result_excel_path: string;
  }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_STAGE}/commit`, {
      method: 'POST',
      data,
    }),

  /**
   * 正式入库列表
   * GET /api/admin/warehouse/inbound/formal/list
   * 接口ID：286146659
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-286146659
   */
  getFormalRecord: (params: {
    batch_id: number;
    page?: number;
    limit?: number;
  }) =>
    request<ResponseInfoType<InboundProductResponse>>(
      `${API_PREFIX}/formal/list`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 批次详情
   * GET /api/admin/warehouse/inbound/batch/detail
   * 接口ID：286210404
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-286210404
   */
  getInboundDetail: (params: { batch_id: number }) =>
    request<ResponseInfoType<InboundRecordItem>>(`${API_PREFIX_BATCH}/detail`, {
      method: 'GET',
      params,
    }),

  /**
   * 出库创建人列表
   * GET /api/admin/warehouse/outbound/batch/getCreatorList
   * 接口ID：288095538
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-288095538
   */
  getCreatorList: (params: PageInfoParams) =>
    request<ResponseInfoType<CreatorList>>(
      `${API_PREFIX_BATCH}/getCreatorList`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 删除批次
   * POST /api/admin/warehouse/inbound/batch/delete
   * 接口ID：286267103
   *接口地址：https://app.apifox.com/link/project/5084807/apis/api-286267103
   */
  deleteRecord: (data: { batch_id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/delete`, {
      method: 'POST',
      data,
    }),
};
