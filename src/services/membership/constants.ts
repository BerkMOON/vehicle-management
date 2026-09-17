export const PRODUCT_STATUS: Record<number, string> = {
  1: '启用',
  2: '停用',
  3: '草稿',
};

/** 价格 / 权益配置 status：0 未设置 / 1 启用 / 2 停用 */
export const PRICE_STATUS: Record<number, string> = {
  0: '未设置',
  1: '启用',
  2: '停用',
};

export const PAY_STATUS: Record<number, string> = {
  1: '待支付',
  2: '成功',
  3: '失败',
  4: '关闭',
  5: '退款中',
  6: '已退款',
};

export const MEM_STATUS: Record<number, string> = {
  1: '已创建',
  2: '已履约',
  3: '已取消',
  4: '已退款',
};

export const ENTITLEMENT_STATUS: Record<number, string> = {
  0: '未设置',
  1: '有效',
  2: '过期',
  3: '撤销',
};

export const REFUND_STATUS: Record<number, string> = {
  1: '待退款',
  2: '已退款',
  3: '需人工',
};

export const CLOSE_TASK_STATUS: Record<number, string> = {
  1: '待关',
  2: '已处理',
};

export const INBOX_VERIFY_STATUS: Record<number, string> = {
  0: '未验签',
  1: '已验签',
};

export const INBOX_PROCESS_STATUS: Record<number, string> = {
  0: '未设置',
  1: '待处理',
  2: '已处理',
};

export const IDEMPOTENCY_STATE: Record<number, string> = {
  1: '处理中',
  2: '已完成',
};

export const PLATFORM_OPTIONS = [
  { label: 'Android', value: 'ANDROID' },
  { label: 'iOS', value: 'IOS' },
];

export const PROVIDER_OPTIONS = [
  { label: '支付宝', value: 'ALIPAY' },
  { label: '微信', value: 'WECHAT' },
  { label: 'Apple', value: 'APPLE' },
];

export const PRODUCT_STATUS_OPTIONS = Object.entries(PRODUCT_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const PRICE_STATUS_OPTIONS = Object.entries(PRICE_STATUS)
  .filter(([value]) => Number(value) > 0)
  .map(([value, label]) => ({ label, value: Number(value) }));

export const PAY_STATUS_OPTIONS = Object.entries(PAY_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const MEM_STATUS_OPTIONS = Object.entries(MEM_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const REFUND_STATUS_OPTIONS = Object.entries(REFUND_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const INBOX_PROCESS_STATUS_OPTIONS = Object.entries(
  INBOX_PROCESS_STATUS,
).map(([value, label]) => ({ label, value: Number(value) }));

export const formatAmountMinor = (minor?: number, currency = 'CNY') => {
  if (minor === undefined || minor === null) return '-';
  const yuan = (Number(minor) / 100).toFixed(2);
  return currency === 'CNY' ? `¥${yuan}` : `${yuan} ${currency}`;
};
