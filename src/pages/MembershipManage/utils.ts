import { SuccessCode } from '@/constants';
import type { ResponseInfoType } from '@/types/common';
import { message } from 'antd';

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
