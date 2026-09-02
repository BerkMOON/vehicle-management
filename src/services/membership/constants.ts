export const PRODUCT_STATUS: Record<number, string> = {
  1: '启用',
  2: '停用',
  3: '草稿',
};

export const PAY_STATUS: Record<number, string> = {
  1: '已创建',
  2: '待支付',
  3: '成功',
  4: '失败',
  6: '关闭',
  7: '退款中',
  8: '已退款',
};

export const MEM_STATUS: Record<number, string> = {
  1: '待支付',
  3: '已履约',
  4: '已取消',
  5: '已退款',
};

export const ENTITLEMENT_STATUS: Record<number, string> = {
  1: '有效',
  2: '过期',
  3: '撤销',
};

export const REFUND_STATUS: Record<number, string> = {
  1: '待退',
  2: '已退',
};

export const CLOSE_TASK_STATUS: Record<number, string> = {
  1: '待处理',
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

export const PAY_STATUS_OPTIONS = Object.entries(PAY_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const MEM_STATUS_OPTIONS = Object.entries(MEM_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const REFUND_STATUS_OPTIONS = Object.entries(REFUND_STATUS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const formatAmountMinor = (minor?: number, currency = 'CNY') => {
  if (minor === undefined || minor === null) return '-';
  const yuan = (minor / 100).toFixed(2);
  return currency === 'CNY' ? `¥${yuan}` : `${yuan} ${currency}`;
};
