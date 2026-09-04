import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { SuccessCode } from '@/constants';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  formatAmountMinor,
  PAY_STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  PROVIDER_OPTIONS,
} from '@/services/membership/constants';
import type {
  PaymentOrder,
  PaymentOrderDetail,
} from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import {
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Result,
  Select,
  Spin,
  Table,
} from 'antd';
import React, { useRef, useState } from 'react';
import { renderPayStatusTag, renderRefundStatusTag } from '../statusTags';
import {
  formatDateTime,
  MEMBERSHIP_FIELD_WIDTH,
  renderDateTime,
} from '../utils';

const PaymentOrdersPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const ref = useRef<BaseListPageRef>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<PaymentOrderDetail | null>(null);

  const openDetail = async (record: PaymentOrder) => {
    setDrawerOpen(true);
    setLoading(true);
    setDetail(null);
    try {
      const res = await MembershipAPI.getPaymentOrderDetail(record.order_no);
      if (res?.response_status?.code === SuccessCode.SUCCESS && res.data) {
        setDetail(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={ref}
        title="支付单（PAY）"
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listPaymentOrders, params)
        }
        searchFormItems={
          <>
            <Col>
              <Form.Item name="order_no" label="PAY 单号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入 PAY 单号"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="user_phone" label="手机号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入手机号"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="provider" label="渠道">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择渠道"
                  options={PROVIDER_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择状态"
                  options={PAY_STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="client_platform" label="平台">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择平台"
                  options={PLATFORM_OPTIONS}
                />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          {
            title: 'PAY 单号',
            dataIndex: 'order_no',
            render: (text: string, record: PaymentOrder) => (
              <a onClick={() => openDetail(record)}>{text}</a>
            ),
          },
          { title: '手机号', dataIndex: 'user_phone' },
          { title: 'MEM 单号', dataIndex: 'business_order_no' },
          { title: '渠道', dataIndex: 'provider' },
          { title: '平台', dataIndex: 'client_platform', width: 90 },
          {
            title: '金额',
            dataIndex: 'amount_minor',
            render: (v: number, r: PaymentOrder) =>
              formatAmountMinor(v, r.currency),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderPayStatusTag(v),
          },
          {
            title: '渠道交易号',
            dataIndex: 'provider_transaction_no',
            ellipsis: true,
          },
          { title: '支付时间', dataIndex: 'paid_at', render: renderDateTime },
          { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
        ]}
      />
      <Drawer
        title="支付单详情"
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Spin spinning={loading}>
          {detail?.order && (
            <>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="PAY 单号" span={2}>
                  {detail.order.order_no}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {detail.order.user_phone}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {renderPayStatusTag(detail.order.status)}
                </Descriptions.Item>
                <Descriptions.Item label="金额">
                  {formatAmountMinor(
                    detail.order.amount_minor,
                    detail.order.currency,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="渠道">
                  {detail.order.provider}
                </Descriptions.Item>
                <Descriptions.Item label="渠道交易号" span={2}>
                  {detail.order.provider_transaction_no || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="幂等键" span={2}>
                  {detail.order.client_idempotency_key || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最后查单">
                  {formatDateTime(detail.order.last_query_at)}
                </Descriptions.Item>
                <Descriptions.Item label="支付时间">
                  {formatDateTime(detail.order.paid_at)}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {formatDateTime(detail.order.ctime)}
                </Descriptions.Item>
              </Descriptions>
              {detail.membership && (
                <>
                  <h4 style={{ marginTop: 24 }}>关联 MEM</h4>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="MEM 单号" span={2}>
                      {detail.membership.membership_order_no}
                    </Descriptions.Item>
                    <Descriptions.Item label="商品">
                      {detail.membership.product_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="SKU">
                      {detail.membership.sku_name}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
              <h4 style={{ marginTop: 24 }}>退款记录</h4>
              <Table
                size="small"
                rowKey="refund_no"
                pagination={false}
                dataSource={detail.refunds ?? []}
                columns={[
                  { title: '退款单号', dataIndex: 'refund_no' },
                  {
                    title: '金额',
                    dataIndex: 'amount_minor',
                    render: (v: number) => formatAmountMinor(v),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: renderRefundStatusTag,
                  },
                  { title: '原因', dataIndex: 'reason' },
                ]}
              />
            </>
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default PaymentOrdersPage;
