import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import {
  DirectionalOtaConfig,
  DirectionalSetConfigParams,
  OssConfig,
  OtaCreateParams,
  OtaDeleteParams,
  OtaList,
  OtaParams,
  OtaReleaseParams,
  OtaUpdateParams,
  OtaUploadParams,
} from './typings';

const API_PREFIX = '/api/admin/ota';

export const OtaAPI = {
  /**
   * ota记录列表
   * GET /api/admin/ota/record/getAllOTARecords
   */
  getOtaUpdataList: (params?: OtaParams) =>
    request<ResponseInfoType<OtaList>>(
      `${API_PREFIX}/record/getAllOTARecords`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * ota记录状态修改
   * POST /api/admin/ota/record/status
   */
  deleteVersion: (params: OtaDeleteParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/record/status`, {
      method: 'POST',
      data: params,
    }),

  /**
   * ota信息更新（全量灰度）
   * POST /api/admin/ota/record/update
   */
  updateOtaStatus: (params: OtaUpdateParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/record/update`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 新建ota版本（仅全量灰度 upgrade_type=1）
   * POST /api/admin/ota/record/create
   */
  createOtaUpdate: (params: OtaCreateParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/record/create`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 灰度发布
   * POST /api/admin/ota/record/OTARelease
   */
  otaRelease: (params: OtaReleaseParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/record/OTARelease`, {
      method: 'POST',
      data: params,
    }),

  getOSSConfig: (params: OtaUploadParams) =>
    request<ResponseInfoType<OssConfig>>(`${API_PREFIX}/getOssPostSignature`, {
      method: 'GET',
      params,
    }),

  /**
   * 查看定向升级配置
   * GET /api/admin/ota/directional/getConfig
   */
  getDirectionalConfig: () =>
    request<ResponseInfoType<DirectionalOtaConfig>>(
      `${API_PREFIX}/directional/getConfig`,
      {
        method: 'GET',
      },
    ),

  /**
   * 保存定向升级配置（整份覆盖）
   * POST /api/admin/ota/directional/setConfig
   */
  setDirectionalConfig: (data: DirectionalSetConfigParams) =>
    request<ResponseInfoType<DirectionalOtaConfig>>(
      `${API_PREFIX}/directional/setConfig`,
      {
        method: 'POST',
        data,
      },
    ),
};
