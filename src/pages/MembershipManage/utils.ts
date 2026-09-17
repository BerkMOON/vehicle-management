import {
  getMembershipErrorMessage,
  MembershipBizCode,
} from '@/services/membership/error';
import type { ResponseInfoType } from '@/types/common';
import { message } from 'antd';
import dayjs from 'dayjs';

export const MEMBERSHIP_FIELD_WIDTH = { width: 194 };
export { getMembershipErrorMessage, MembershipBizCode };

export function formatDateTime(value?: string | null): string {
  if (value === null || value === undefined || value === '') return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return String(value);
  // 历史哨兵值（1970）按未发生处理
  if (parsed.year() <= 1970) return '-';
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
  const code = res?.response_status?.code;
  if (code === MembershipBizCode.SUCCESS) {
    message.success(successMsg);
    return res.data;
  }
  const errMsg = getMembershipErrorMessage(code, res?.response_status?.msg);
  message.error(errMsg);
  throw new Error(errMsg);
}

/** 编辑提交：只带上有变更的字段，避免数字 0 被误当成「归零」 */
export function pickChangedFields<T extends Record<string, any>>(
  original: T,
  values: Partial<T>,
  keys: (keyof T)[],
): Partial<T> {
  const payload: Partial<T> = {};
  keys.forEach((key) => {
    if (!(key in values)) return;
    const next = values[key];
    const prev = original[key];
    if (next !== prev) {
      payload[key] = next as T[keyof T];
    }
  });
  return payload;
}

export function assertValidJsonString(text?: string, fieldLabel = 'JSON') {
  const raw = (text ?? '').trim();
  if (!raw) return '';
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    throw new Error(`${fieldLabel} 不是合法 JSON`);
  }
}

/** 建价 effective_start：后端 JSON 只吃 RFC3339 */
export function toRfc3339(value: string | number | Date | dayjs.Dayjs): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ssZ');
}
