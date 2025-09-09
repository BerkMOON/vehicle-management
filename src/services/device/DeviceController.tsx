/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！
import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  DeviceRequest,
  DeviceResponse,
  LossRequest,
  LossResponse,
  MileageReminderRequest,
  MileageReminderResponse,
} from './typings';

const API_PREFIX = '/api/admin/device';

export const DeviceAPI = {
  /**
   * b端设备列表
   * GET /api/business/device/list
   * 接口ID：282433158
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-282433158
   */
  getDeviceList: (params?: DeviceRequest) =>
    request<ResponseInfoType<DeviceResponse>>(`${API_PREFIX}/business/list`, {
      method: 'GET',
      params,
      credentials: 'include',
    }),

  /**
   * 流失提醒后台
   * GET /api/admin/device/getLossNotifications
   * 接口ID：314225745
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-314225745
   */
  getLossNotifications: (params?: LossRequest) =>
    request<ResponseInfoType<LossResponse>>(
      `${API_PREFIX}/getLossNotifications`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 里程列表后台
   * GET /api/admin/device/mileage/list
   * 接口ID：345527290
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-345527290
   */
  getMileageReminder: (params?: MileageReminderRequest) =>
    request<ResponseInfoType<MileageReminderResponse>>(
      `${API_PREFIX}/mileage/list`,
      {
        method: 'GET',
        params,
      },
    ),
};
