import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  DeviceModelResponse,
  DeviceTypeResponse,
  ReturnListResponse,
  ReturnParams,
  StorageListResponse,
  StorageParams,
} from './typings';

const API_PREFIX = '/api/admin/warehouse';

export const StorageAPI = {
  /**
  正式入库列表
  GET /api/admin/warehouse/formal/list
  */
  getStorageList: (params: StorageParams) =>
    request<ResponseInfoType<StorageListResponse>>(
      `${API_PREFIX}/formal/list`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
  退货设备列表
  GET /api/admin/warehouse/return/list
  */
  getReturnList: (params: ReturnParams) =>
    request<ResponseInfoType<ReturnListResponse>>(`${API_PREFIX}/return/list`, {
      method: 'GET',
      params,
    }),

  /**
   * 退货设备提交
   * POST /api/admin/warehouse/return/commit
   */
  createReturnRecord: (data: { sn: string; remark: string }) =>
    request<ResponseInfoType<any>>(`${API_PREFIX}/return/commit`, {
      method: 'POST',
      data,
    }),

  /**
   * 退还给厂家
   * POST /api/admin/warehouse/return/toVendor
   */
  returnToVendor: (data: { id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/return/toVendor`, {
      method: 'POST',
      data,
    }),

  /**
   * 重新入库
   * POST /api/admin/warehouse/return/reInbound
   */
  returnReInbound: (data: { id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/return/reInbound`, {
      method: 'POST',
      data,
    }),

  /**
   * 获取设备型号列表
   * GET /api/admin/warehouse/getModels
   */
  getModels: () =>
    request<ResponseInfoType<DeviceModelResponse>>(`${API_PREFIX}/getModels`, {
      method: 'GET',
    }),

  /**
   * 获取设备类型
   * GET /api/admin/warehouse/getDeviceTypes?model=xxx
   */
  getDeviceTypes: (params: { model: string }) =>
    request<ResponseInfoType<DeviceTypeResponse>>(
      `${API_PREFIX}/getDeviceTypes`,
      {
        method: 'GET',
        params,
      },
    ),
};
