import type { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  ApplePaymentBinding,
  CreateManualRefundParams,
  CreatePriceParams,
  GrantMembershipParams,
  InboxEventDetail,
  MembershipBenefit,
  MembershipListData,
  MembershipOrder,
  MembershipOrderDetail,
  MembershipProduct,
  MembershipSku,
  PageQuery,
  PaymentCloseTask,
  PaymentEventInbox,
  PaymentIdempotency,
  PaymentOrder,
  PaymentOrderDetail,
  PaymentPrice,
  PaymentRefund,
  RevokeMembershipParams,
  SalesSummaryRow,
  UpsertBenefitParams,
  UpsertProductParams,
  UpsertSkuParams,
  UserMembershipStatus,
} from './typings';

const API_PREFIX = '/api/admin/membership';

export const MembershipAPI = {
  listProducts: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<MembershipProduct>>>(
      `${API_PREFIX}/products`,
      { method: 'GET', params },
    ),

  getProduct: (product_code: string) =>
    request<ResponseInfoType<MembershipProduct>>(
      `${API_PREFIX}/products/detail`,
      { method: 'GET', params: { product_code } },
    ),

  createProduct: (data: UpsertProductParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/products/create`, {
      method: 'POST',
      data,
    }),

  updateProduct: (data: UpsertProductParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/products/update`, {
      method: 'POST',
      data,
    }),

  updateProductStatus: (data: { product_code: string; status: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/products/status`, {
      method: 'POST',
      data,
    }),

  listSkus: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<MembershipSku>>>(
      `${API_PREFIX}/skus`,
      { method: 'GET', params },
    ),

  createSku: (data: UpsertSkuParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/skus/create`, {
      method: 'POST',
      data,
    }),

  updateSku: (data: Partial<UpsertSkuParams> & { sku_code: string }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/skus/update`, {
      method: 'POST',
      data,
    }),

  updateSkuStatus: (data: { sku_code: string; status: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/skus/status`, {
      method: 'POST',
      data,
    }),

  listPrices: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentPrice>>>(
      `${API_PREFIX}/prices`,
      { method: 'GET', params },
    ),

  createPrice: (data: CreatePriceParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/prices/create`, {
      method: 'POST',
      data,
    }),

  updatePriceStatus: (data: { id: number; status: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/prices/status`, {
      method: 'POST',
      data,
    }),

  listBenefits: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<MembershipBenefit>>>(
      `${API_PREFIX}/benefits`,
      { method: 'GET', params },
    ),

  upsertBenefit: (data: UpsertBenefitParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/benefits/upsert`, {
      method: 'POST',
      data,
    }),

  listMembershipOrders: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<MembershipOrder>>>(
      `${API_PREFIX}/orders`,
      { method: 'GET', params },
    ),

  getMembershipOrderDetail: (membership_order_no: string) =>
    request<ResponseInfoType<MembershipOrderDetail>>(
      `${API_PREFIX}/orders/detail`,
      { method: 'GET', params: { membership_order_no } },
    ),

  listPaymentOrders: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentOrder>>>(
      `${API_PREFIX}/payments`,
      { method: 'GET', params },
    ),

  getPaymentOrderDetail: (order_no: string) =>
    request<ResponseInfoType<PaymentOrderDetail>>(
      `${API_PREFIX}/payments/detail`,
      { method: 'GET', params: { order_no } },
    ),

  getUserMembershipStatus: (params: { user_id?: number; phone?: string }) =>
    request<ResponseInfoType<UserMembershipStatus>>(
      `${API_PREFIX}/users/status`,
      { method: 'GET', params },
    ),

  grantMembership: (data: GrantMembershipParams) =>
    request<ResponseInfoType<{ membership_order_no: string }>>(
      `${API_PREFIX}/users/grant`,
      { method: 'POST', data },
    ),

  revokeMembership: (data: RevokeMembershipParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/users/revoke`, {
      method: 'POST',
      data,
    }),

  listRefunds: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentRefund>>>(
      `${API_PREFIX}/refunds`,
      { method: 'GET', params },
    ),

  getRefundDetail: (refund_no: string) =>
    request<ResponseInfoType<PaymentRefund>>(`${API_PREFIX}/refunds/detail`, {
      method: 'GET',
      params: { refund_no },
    }),

  createManualRefund: (data: CreateManualRefundParams) =>
    request<ResponseInfoType<{ refund_no: string }>>(
      `${API_PREFIX}/refunds/create`,
      { method: 'POST', data },
    ),

  listInboxEvents: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentEventInbox>>>(
      `${API_PREFIX}/inbox/events`,
      { method: 'GET', params },
    ),

  getInboxEventDetail: (id: number) =>
    request<ResponseInfoType<InboxEventDetail>>(
      `${API_PREFIX}/inbox/events/detail`,
      { method: 'GET', params: { id } },
    ),

  replayInboxEvent: (data: { id: number }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/inbox/events/replay`, {
      method: 'POST',
      data,
    }),

  listAppleBindings: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<ApplePaymentBinding>>>(
      `${API_PREFIX}/apple/bindings`,
      { method: 'GET', params },
    ),

  listCloseTasks: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentCloseTask>>>(
      `${API_PREFIX}/close-tasks`,
      { method: 'GET', params },
    ),

  listIdempotency: (params?: PageQuery) =>
    request<ResponseInfoType<MembershipListData<PaymentIdempotency>>>(
      `${API_PREFIX}/idempotency`,
      { method: 'GET', params },
    ),

  salesSummary: (params: { start_time: string; end_time: string }) =>
    request<ResponseInfoType<SalesSummaryRow[]>>(
      `${API_PREFIX}/reports/sales-summary`,
      { method: 'GET', params },
    ),
};

export async function fetchMembershipList<T>(
  apiFn: (
    params: PageQuery,
  ) => Promise<ResponseInfoType<MembershipListData<T>>>,
  params: Record<string, unknown>,
) {
  const { page = 1, limit = 10, ...rest } = params;
  const res = await apiFn({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    ...rest,
  });
  if (res?.response_status?.code !== 200) {
    throw new Error(res?.response_status?.msg || '查询失败');
  }
  return {
    list: res.data?.list ?? [],
    total: res.data?.meta?.total_count ?? 0,
  };
}
