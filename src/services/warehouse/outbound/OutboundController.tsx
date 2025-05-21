/* eslint-disable */
import { CreatorList, PageInfoParams, ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  OutboundCreateRequest,
  OutboundCreateStageRequest,
  OutboundRecordItem,
  OutboundRecordParams,
  OutboundResponse,
} from './typings';

const API_PREFIX = '/api/admin/warehouse/outbound';
const API_PREFIX_BATCH = '/api/admin/warehouse/outbound/batch';
const API_PREFIX_STAGE = '/api/admin/warehouse/outbound/staging';

export const OutboundAPI = {
  /**
   *出库列表
   *GET /api/admin/warehouse/outbound/batch/list
   *接口ID：287638955
   *接口地址：https://app.apifox.com/link/project/5084807/apis/api-287638955
   */

  getOutboundRecords: (params?: OutboundRecordParams) =>
    request<ResponseInfoType<OutboundResponse>>(`${API_PREFIX_BATCH}/list`, {
      method: 'GET',
      params,
    }),

  /**
   * 创建出库批次
   * POST /api/admin/warehouse/outbound/batch/create
   * 接口ID：287642209
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-287642209
   *
   */
  createOutboundRecord: (data: OutboundCreateRequest) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/create`, {
      method: 'POST',
      data,
    }),

  /**
   * 更新出库批次信息
   * POST /api/admin/warehouse/outbound/batch/update
   * 接口ID：287643643
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-287643643
   */
  updateOutboundRecord: (data: OutboundCreateRequest) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/update`, {
      method: 'POST',
      data,
    }),

  /**
   * 出库批次详情
   * GET /api/admin/warehouse/outbound/batch/detail
   * 接口ID：287644326
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-287644326
   */
  getOutboundDetail: (params: { batch_id: number }) =>
    request<ResponseInfoType<OutboundRecordItem>>(
      `${API_PREFIX_BATCH}/detail`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 插入暂存区
   * POST /api/admin/warehouse/inbound/staging/create
   * 接口ID：285622357
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285622357
   */
  createStagingRecord: (data: OutboundCreateStageRequest) =>
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
   * GET /api/admin/warehouse/outbound/staging/list
   * 接口ID：285625272
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-285625272
   */
  getStagingRecord: (params: {
    batch_id: number;
    page?: number;
    limit?: number;
  }) =>
    request<ResponseInfoType<{ record_list: string[] }>>(
      `${API_PREFIX_STAGE}/list`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 暂存区提交
   * POST /api/admin/warehouse/inbound/staging/commit
   * 接口ID：286143993
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-286143993
   */
  commitStagingRecord: (data: { batch_id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_STAGE}/commit`, {
      method: 'POST',
      data,
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
   * 删除出库批次
   * POST /api/admin/warehouse/outbound/batch/delete
   * 接口ID：287644525
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-287644525
   */
  deleteRecord: (data: { batch_id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_BATCH}/delete`, {
      method: 'POST',
      data,
    }),
};
