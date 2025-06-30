/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！
import { AUDIT_RESULT } from '@/constants';
import { PageInfoParams, ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import {
  AuditClueList,
  AuditClueListParams,
  AuditHandlerList,
  AuditInfo,
  AuditTagList,
  AuditTaskDetail,
  AuditTaskDetailParams,
  AuditTaskList,
  AuditTaskListParams,
  AuditTaskParams,
  BlackListResponse,
  BusinessTaskParams,
} from './typings';

const API_PREFIX = '/api/admin/audit';
const BLACK_API_PREFIX = `${API_PREFIX}/blacklist/device`;
export const AuditAPI = {
  /**
   * 任务获取
   * GET /api/admin/audit/getTask
   * 接口ID：215831673
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-215831673
   */
  getAuditInfo: () =>
    request<ResponseInfoType<AuditInfo>>(`${API_PREFIX}/getTask`, {
      method: 'GET',
    }),

  /**
   * 任务详情
   * GET /api/admin/audit/getTaskDetail
   * 接口ID：249888792
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-249888792
   */
  getAuditTaskDetail: (params: AuditTaskDetailParams) =>
    request<ResponseInfoType<AuditTaskDetail>>(`${API_PREFIX}/getTaskDetail`, {
      method: 'GET',
      params,
    }),

  /**
   * 任务处理
   * POST /api/admin/audit/processTask
   * 接口ID：215831712
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-215831712
   */
  auditTask: (params: AuditTaskParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/processTask`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 审核标签列表
   * GET /api/admin/audit/getAuditTagList
   * 接口ID：249893898
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-249893898
   */
  getAuditTag: (group_type: AUDIT_RESULT) =>
    request<ResponseInfoType<AuditTagList>>(`${API_PREFIX}/getAuditTagList`, {
      method: 'GET',
      params: {
        group_type,
      },
    }),

  /**
   * 任务列表
   * GET /api/admin/audit/getTaskList
   * 接口ID：249884508
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-249884508
   */
  getTaskList: (params: AuditTaskListParams) =>
    request<ResponseInfoType<AuditTaskList>>(`${API_PREFIX}/getTaskList`, {
      method: 'GET',
      params,
    }),

  /**
   * 线索列表
   * GET /api/admin/audit/getClueList
   * 接口ID：249891720
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-249891720
   */
  getClueList: (params: AuditClueListParams) =>
    request<ResponseInfoType<AuditClueList>>(`${API_PREFIX}/getClueList`, {
      method: 'GET',
      params,
    }),

  /**
   * 处理人列表
   * GET /api/admin/audit/getHandlerList
   * 接口ID：249893314
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-249893314
   */
  getHandlerList: (params: PageInfoParams) =>
    request<ResponseInfoType<AuditHandlerList>>(
      `${API_PREFIX}/getHandlerList`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
  b端任务列表
  GET /api/admin/audit/getBusinessTaskList
  接口ID：281425117
  接口地址：https://app.apifox.com/link/project/5084807/apis/api-281425117
  */
  getBTaskList: (params: BusinessTaskParams) =>
    request<ResponseInfoType<AuditTaskList>>(
      `${API_PREFIX}/getBusinessTaskList`,
      {
        method: 'GET',
        params,
      },
    ),

  getAbnormalClueList: (params: AuditClueListParams) =>
    request<ResponseInfoType<AuditClueList>>(
      `${API_PREFIX}/getAbnormalClueList`,
      {
        method: 'GET',
        params,
      },
    ),

  /**
   * 查询设备黑名单
   * GET /api/admin/audit/blacklist/device/list
   * 接口ID：311405675
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-311405675
   */
  getBlackList: () =>
    request<ResponseInfoType<BlackListResponse>>(`${BLACK_API_PREFIX}/list`, {
      method: 'GET',
    }),

  addBlackDevice: (params: { device_id: string }) =>
    request<ResponseInfoType<null>>(`${BLACK_API_PREFIX}/add`, {
      method: 'POST',
      data: params,
    }),

  deleteBlackDevice: (params: { device_id: string }) =>
    request<ResponseInfoType<null>>(`${BLACK_API_PREFIX}/delete`, {
      method: 'POST',
      data: params,
    }),
};
