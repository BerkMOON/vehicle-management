import { SuccessCode } from '@/constants';
import type { ResponseInfoType } from '@/types/common';
import { message } from 'antd';
import dayjs from 'dayjs';

export const MEMBERSHIP_FIELD_WIDTH = { width: 194 };

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format('YYYY-MM-DD HH:mm:ss');
}

export function renderDateTime(value?: string | null) {
  return formatDateTime(value);
}

export async function postMembershipAction<T>(
  apiFn: () => Promise<ResponseInfoType<T>>,
  successMsg: string,
) {
  const res = await apiFn();
  if (res?.response_status?.code === SuccessCode.SUCCESS) {
    message.success(successMsg);
    return res.data;
  }
  throw new Error(res?.response_status?.msg || '操作失败');
}
