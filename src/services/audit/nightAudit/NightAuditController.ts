import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import {
  NightAuditDisabled,
  NightAuditStatus,
  NightAuditWindowRules,
  NightAuditWindowRulesPayload,
} from './typings';

const API_PREFIX = '/api/admin/audit/nightAudit';

export const NightAuditAPI = {
  getWindowRules: () =>
    request<ResponseInfoType<NightAuditWindowRules>>(
      `${API_PREFIX}/windowRules`,
      { method: 'GET' },
    ),

  setWindowRules: (data: NightAuditWindowRulesPayload) =>
    request<ResponseInfoType<NightAuditWindowRules>>(
      `${API_PREFIX}/setWindowRules`,
      { method: 'POST', data },
    ),

  getStatus: () =>
    request<ResponseInfoType<NightAuditStatus>>(`${API_PREFIX}/status`, {
      method: 'GET',
    }),

  getDisabled: () =>
    request<ResponseInfoType<NightAuditDisabled>>(`${API_PREFIX}/disabled`, {
      method: 'GET',
    }),

  setDisabled: (data: NightAuditDisabled) =>
    request<ResponseInfoType<NightAuditDisabled>>(`${API_PREFIX}/setDisabled`, {
      method: 'POST',
      data,
    }),
};
