import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import {
  StoreCodeParams,
  StoreCreateParams,
  StoreDeleteParams,
  StoreList,
  StoreParams,
  StoreUpdateParams,
} from './typing';

const API_PREFIX = '/api/admin/external/store';
const INVITATION_PREFIX = '/api/admin/external/invitation';

export const StoreAPI = {
  /**
   * 创建门店
   * POST /api/admin/external/store/create
   * 接口ID：250550159
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-250550159
   */
  createStore: (params?: StoreCreateParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/create`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 门店列表
   * GET /api/admin/external/store/getAllStores
   * 接口ID：250558353
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-250558353
   */
  getAllStores: (params?: StoreParams) =>
    request<ResponseInfoType<StoreList>>(`${API_PREFIX}/getAllStores`, {
      method: 'GET',
      params: {
        ...params,
        status: 'active',
      },
    }),

  /**
   * 更新门店信息
   * POST /api/admin/external/store/update
   * 接口ID：250554225
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-250554225
   */
  updateStore: (params?: StoreUpdateParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/update`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 删除门店
   * POST /api/admin/external/store/status
   * 接口ID：250552141
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-250552141
   */
  deleteStore: (params?: StoreDeleteParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/status`, {
      method: 'POST',
      data: {
        ...params,
        status: 'deleted',
      },
    }),

  /**
   * 门店码
   * GET /api/admin/external/invitation/gen
   * 接口ID：252365286
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-252365286
   */
  genStoreCode: (params?: StoreCodeParams) =>
    request<ResponseInfoType<{ code: string }>>(`${INVITATION_PREFIX}/gen`, {
      method: 'GET',
      params,
    }),
};
