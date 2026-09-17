import type { BaseListInfo, PageInfoParams } from '@/types/common';

export interface MembershipListData<T> extends BaseListInfo {
  list: T[];
}

export interface MembershipProduct {
  id: number;
  product_code: string;
  product_name: string;
  description: string;
  level_rank: number;
  is_sellable: number;
  status: number;
  sort_no: number;
  ctime: string;
  mtime: string;
}

export interface MembershipSku {
  id: number;
  product_code: string;
  sku_code: string;
  sku_name: string;
  billing_mode: string;
  period_unit: string;
  period_count: number;
  base_amount_minor: number;
  status: number;
  ctime: string;
  mtime: string;
}

export interface PaymentPrice {
  id: number;
  sku_code: string;
  client_platform: string;
  provider_product_id: string;
  amount_minor: number;
  currency: string;
  status: number;
  effective_start: string;
  effective_end: string;
  extra_config: string;
  ctime: string;
  mtime: string;
}

export interface MembershipBenefit {
  id: number;
  product_code: string;
  benefit_code: string;
  benefit_config: string;
  status: number;
  ctime: string;
  mtime: string;
}

export interface MembershipOrder {
  id: number;
  membership_order_no: string;
  user_id: number;
  user_phone: string;
  checkout_session_id: string;
  client_platform: string;
  product_code: string;
  product_name: string;
  sku_code: string;
  sku_name: string;
  order_type: string;
  purchase_mode: string;
  period_unit: string;
  period_count: number;
  amount_minor: number;
  currency: string;
  status: number;
  expire_at: string;
  close_reason: string;
  effective_start?: string;
  effective_end?: string;
  grant_reason: string;
  paid_at?: string;
  fulfilled_payment_order_no: string;
  ctime: string;
  mtime: string;
}

export interface PaymentOrder {
  id: number;
  order_no: string;
  business_type: string;
  business_order_no: string;
  user_id: number;
  user_phone: string;
  provider: string;
  client_platform: string;
  amount_minor: number;
  currency: string;
  status: number;
  client_idempotency_key: string;
  provider_transaction_no: string;
  expires_at: string;
  paid_at?: string;
  closed_at?: string;
  last_query_at?: string;
  ctime: string;
  mtime: string;
}

export interface MembershipEntitlement {
  id: number;
  user_id: number;
  user_phone: string;
  product_code: string;
  valid_from: string;
  valid_until: string;
  status: number;
  ctime: string;
  mtime: string;
}

export interface PaymentRefund {
  id: number;
  refund_no: string;
  payment_order_no: string;
  user_id: number;
  user_phone: string;
  provider: string;
  provider_refund_no: string;
  amount_minor: number;
  currency: string;
  refund_type: string;
  status: number;
  reason: string;
  requested_at?: string;
  completed_at?: string;
  /** 仅详情返回；列表无此字段 */
  provider_response?: string;
  ctime: string;
  mtime: string;
}

export interface PaymentEventInbox {
  id: number;
  user_id: number;
  provider: string;
  event_id: string;
  event_type: string;
  order_no: string;
  provider_transaction_no: string;
  verify_status: number;
  process_status: number;
  retry_count: number;
  next_retry_at?: string;
  last_error: string;
  processed_at?: string;
  ctime: string;
  mtime: string;
}

export interface ApplePaymentBinding {
  id: number;
  user_id: number;
  order_no: string;
  app_account_token: string;
  transaction_id: string;
  product_id: string;
  bundle_id: string;
  environment: string;
  ctime: string;
  mtime: string;
}

export interface PaymentCloseTask {
  id: number;
  payment_order_no: string;
  provider: string;
  status: number;
  ctime: string;
  mtime: string;
}

export interface PaymentIdempotency {
  id: number;
  user_id: number;
  idempotency_key: string;
  operation: string;
  state: number;
  result_code: number;
  request_fingerprint?: string;
  lease_until?: string;
  ctime: string;
  mtime: string;
}

/** 报表毛收入行 */
export interface SalesGrossRow {
  provider: string;
  client_platform: string;
  currency: string;
  order_count: number;
  amount_minor: number;
}

/** 报表退款行 */
export interface SalesRefundRow {
  provider: string;
  client_platform: string;
  currency: string;
  refund_count: number;
  refund_amount_minor: number;
}

/** GET /reports/sales-summary 的 data；净额 = gross − refund，前端自算 */
export interface SalesSummaryReport {
  gross: SalesGrossRow[];
  refund: SalesRefundRow[];
}

/** @deprecated 使用 SalesGrossRow / SalesSummaryReport */
export interface SalesSummaryRow {
  provider: string;
  client_platform: string;
  currency?: string;
  order_count: number;
  amount_minor: number;
}

export interface UserMembershipStatus {
  user_id: number;
  phone: string;
  active_level: string;
  entitlements: MembershipEntitlement[];
}

export interface MembershipOrderDetail {
  order: MembershipOrder;
  payments: PaymentOrder[];
}

export interface PaymentOrderDetail {
  order: PaymentOrder;
  membership?: MembershipOrder;
  refunds: PaymentRefund[];
}

export interface InboxEventDetail {
  event: PaymentEventInbox;
  /** 原始回调报文在响应顶层，不在 event 内；可能被截断并以 ...(truncated) 结尾 */
  raw_body?: string;
}

export type PageQuery = PageInfoParams & Record<string, unknown>;

export interface UpsertProductParams {
  product_code: string;
  product_name?: string;
  description?: string;
  level_rank?: number;
  is_sellable?: number;
  status?: number;
  sort_no?: number;
}

export interface UpsertSkuParams {
  product_code?: string;
  sku_code: string;
  sku_name?: string;
  billing_mode?: string;
  period_unit?: string;
  period_count?: number;
  base_amount_minor?: number;
  status?: number;
}

export interface CreatePriceParams {
  sku_code: string;
  client_platform: string;
  provider_product_id?: string;
  amount_minor: number;
  currency?: string;
  effective_start?: string;
  extra_config?: string;
}

export interface UpsertBenefitParams {
  product_code: string;
  benefit_code: string;
  benefit_config?: string;
  status?: number;
}
