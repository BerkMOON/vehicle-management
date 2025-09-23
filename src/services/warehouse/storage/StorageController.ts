import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
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
  接口ID：286146659
  接口地址：https://app.apifox.com/link/project/5084807/apis/api-286146659
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
  接口ID：344351165
  接口地址：https://app.apifox.com/link/project/5084807/apis/api-344351165
  */
  getReturnList: (params: ReturnParams) =>
    request<ResponseInfoType<ReturnListResponse>>(`${API_PREFIX}/return/list`, {
      method: 'GET',
      params,
    }),

  /**
   * 退货设备提交
   * POST /api/admin/warehouse/return/commit
   * 接口ID：344348395
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-344348395
   */
  createReturnRecord: (data: any) =>
    request<ResponseInfoType<any>>(`${API_PREFIX}/return/commit`, {
      method: 'POST',
      data,
    }),

  /**
   * 获取设备类型
   * GET /api/admin/warehouse/getDeviceTypes
   * 接口ID：353750849
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-353750849
   */
  getDeviceTypes: () =>
    request<ResponseInfoType<DeviceTypeResponse>>(
      `${API_PREFIX}/getDeviceTypes`,
      {
        method: 'GET',
      },
    ),
};
