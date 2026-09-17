/** 业务错误码（与后台约定一致） */
export const MembershipBizCode = {
  SUCCESS: 200,
  INVALID: 100001,
  SERVER_ERROR: 100002,
  UNAUTHORIZED: 100004,
  FORBIDDEN: 100005,
} as const;

export function getMembershipErrorMessage(code?: number, msg?: string): string {
  if (code === MembershipBizCode.SERVER_ERROR) {
    return '服务出错，请稍后重试';
  }
  if (code === MembershipBizCode.FORBIDDEN) {
    return '权限不足';
  }
  return msg || '操作失败';
}
