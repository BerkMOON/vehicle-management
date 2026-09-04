import {
  CLOSE_TASK_STATUS,
  ENTITLEMENT_STATUS,
  MEM_STATUS,
  PAY_STATUS,
  PRODUCT_STATUS,
  REFUND_STATUS,
} from '@/services/membership/constants';
import { Tag } from 'antd';

function renderStatusTag(
  value: number | string | undefined | null,
  labelMap: Record<number, string>,
  colorMap: Record<number, string>,
) {
  if (value === undefined || value === null || value === '') {
    return <Tag>-</Tag>;
  }
  const num = typeof value === 'number' ? value : Number(value);
  const label = labelMap[num] ?? String(value);
  const color = colorMap[num] ?? 'default';
  return <Tag color={color}>{label}</Tag>;
}

const PRODUCT_STATUS_COLOR: Record<number, string> = {
  1: 'green',
  2: 'red',
  3: 'blue',
};

const PAY_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
  3: 'red',
  4: 'default',
  5: 'orange',
  6: 'purple',
};

const MEM_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
  3: 'default',
  4: 'purple',
};

const ENTITLEMENT_STATUS_COLOR: Record<number, string> = {
  1: 'green',
  2: 'default',
  3: 'red',
};

const REFUND_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
  3: 'orange',
};

const CLOSE_TASK_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
};

const INBOX_PROCESS_STATUS: Record<number, string> = {
  1: '待处理',
  3: '已处理',
  4: '重试中',
};

const INBOX_PROCESS_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  3: 'green',
  4: 'orange',
};

const INBOX_VERIFY_STATUS: Record<number, string> = {
  1: '待验签',
  2: '验签成功',
  3: '验签失败',
};

const INBOX_VERIFY_STATUS_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
  3: 'red',
};

const IDEMPOTENCY_STATE: Record<number, string> = {
  1: '处理中',
  2: '已完成',
};

const IDEMPOTENCY_STATE_COLOR: Record<number, string> = {
  1: 'gold',
  2: 'green',
};

export function renderProductStatusTag(value?: number | null) {
  return renderStatusTag(value, PRODUCT_STATUS, PRODUCT_STATUS_COLOR);
}

export function renderPayStatusTag(value?: number | null) {
  return renderStatusTag(value, PAY_STATUS, PAY_STATUS_COLOR);
}

export function renderMemStatusTag(value?: number | null) {
  return renderStatusTag(value, MEM_STATUS, MEM_STATUS_COLOR);
}

export function renderEntitlementStatusTag(value?: number | null) {
  return renderStatusTag(value, ENTITLEMENT_STATUS, ENTITLEMENT_STATUS_COLOR);
}

export function renderRefundStatusTag(value?: number | null) {
  return renderStatusTag(value, REFUND_STATUS, REFUND_STATUS_COLOR);
}

export function renderCloseTaskStatusTag(value?: number | null) {
  return renderStatusTag(value, CLOSE_TASK_STATUS, CLOSE_TASK_STATUS_COLOR);
}

export function renderInboxProcessStatusTag(value?: number | null) {
  return renderStatusTag(
    value,
    INBOX_PROCESS_STATUS,
    INBOX_PROCESS_STATUS_COLOR,
  );
}

export function renderInboxVerifyStatusTag(value?: number | null) {
  return renderStatusTag(value, INBOX_VERIFY_STATUS, INBOX_VERIFY_STATUS_COLOR);
}

export function renderIdempotencyStateTag(value?: number | null) {
  return renderStatusTag(value, IDEMPOTENCY_STATE, IDEMPOTENCY_STATE_COLOR);
}

export function renderOrderTypeTag(value?: string | null) {
  if (!value) return <Tag>-</Tag>;
  if (value === 'GRANT') {
    return <Tag color="blue">赠送</Tag>;
  }
  if (value === 'PURCHASE') {
    return <Tag color="cyan">购买</Tag>;
  }
  return <Tag>{value}</Tag>;
}

export function renderSellableTag(value?: number | null) {
  if (value === 1) return <Tag color="green">可售</Tag>;
  if (value === 0) return <Tag>不可售</Tag>;
  return <Tag>-</Tag>;
}
