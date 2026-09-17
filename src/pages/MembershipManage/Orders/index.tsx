import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  formatAmountMinor,
  MEM_STATUS_OPTIONS,
} from '@/services/membership/constants';
import {
  getMembershipErrorMessage,
  MembershipBizCode,
} from '@/services/membership/error';
import type {
  MembershipOrder,
  MembershipOrderDetail,
} from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import {
  Alert,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Result,
  Select,
  Spin,
  Table,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  renderMemStatusTag,
  renderOrderTypeTag,
  renderPayStatusTag,
} from '../statusTags';
import {
  formatDateTime,
  MEMBERSHIP_FIELD_WIDTH,
  renderDateTime,
} from '../utils';

const MembershipOrdersPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const ref = useRef<BaseListPageRef>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MembershipOrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const openDetail = async (record: MembershipOrder) => {
    setDrawerOpen(true);
    setLoading(true);
    setDetail(null);
    setNotFound(false);
    try {
      const res = await MembershipAPI.getMembershipOrderDetail(
        record.membership_order_no,
      );
      const code = res?.response_status?.code;
      if (code === MembershipBizCode.SUCCESS && res.data) {
        setDetail(res.data);
        return;
      }
      if (code === MembershipBizCode.SUCCESS && !res.data) {
        setNotFound(true);
        return;
      }
      message.error(getMembershipErrorMessage(code, res?.response_status?.msg));
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
        title="会员业务单（MEM）"
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listMembershipOrders, params)
        }
        searchFormItems={
          <>
            <Col>
              <Form.Item name="user_phone" label="手机号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入完整手机号"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="membership_order_no" label="MEM 单号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入 MEM 单号"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="checkout_session_id" label="会话 ID">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="checkout_session_id"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择状态"
                  options={MEM_STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="order_type" label="类型">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择类型"
                  options={[
                    { label: '购买', value: 'PURCHASE' },
                    { label: '赠送', value: 'GRANT' },
                  ]}
                />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          {
            title: 'MEM 单号',
            dataIndex: 'membership_order_no',
            render: (text: string, record: MembershipOrder) => (
              <a onClick={() => openDetail(record)}>{text}</a>
            ),
          },
          { title: '手机号', dataIndex: 'user_phone' },
          { title: '商品', dataIndex: 'product_name' },
          { title: 'SKU', dataIndex: 'sku_name' },
          {
            title: '类型',
            dataIndex: 'order_type',
            render: (v: string) => renderOrderTypeTag(v),
          },
          {
            title: '金额',
            dataIndex: 'amount_minor',
            render: (v: number, r: MembershipOrder) =>
              formatAmountMinor(v, r.currency),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderMemStatusTag(v),
          },
          { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
        ]}
      />
      <Drawer
        title="业务单详情"
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Spin spinning={loading}>
          {notFound && <Alert type="warning" showIcon message="业务单不存在" />}
          {detail?.order && (
            <>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="MEM 单号" span={2}>
                  {detail.order.membership_order_no}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {detail.order.user_phone}
                </Descriptions.Item>
                <Descriptions.Item label="用户 ID">
                  {detail.order.user_id}
                </Descriptions.Item>
                <Descriptions.Item label="商品">
                  {detail.order.product_name} ({detail.order.product_code})
                </Descriptions.Item>
                <Descriptions.Item label="SKU">
                  {detail.order.sku_name}
                </Descriptions.Item>
                <Descriptions.Item label="类型">
                  {renderOrderTypeTag(detail.order.order_type)}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {renderMemStatusTag(detail.order.status)}
                </Descriptions.Item>
                <Descriptions.Item label="赠送原因">
                  {detail.order.grant_reason || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="履约 PAY">
                  {detail.order.fulfilled_payment_order_no || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="权益起">
                  {formatDateTime(detail.order.effective_start)}
                </Descriptions.Item>
                <Descriptions.Item label="权益止">
                  {formatDateTime(detail.order.effective_end)}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {formatDateTime(detail.order.ctime)}
                </Descriptions.Item>
              </Descriptions>
              <h4 style={{ marginTop: 24 }}>关联支付单</h4>
              <Table
                size="small"
                rowKey="order_no"
                pagination={false}
                dataSource={detail.payments ?? []}
                columns={[
                  { title: 'PAY 单号', dataIndex: 'order_no' },
                  { title: '渠道', dataIndex: 'provider' },
                  {
                    title: '金额',
                    dataIndex: 'amount_minor',
                    render: (v: number) => formatAmountMinor(v),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: renderPayStatusTag,
                  },
                  {
                    title: '支付时间',
                    dataIndex: 'paid_at',
                    render: renderDateTime,
                  },
                ]}
              />
            </>
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default MembershipOrdersPage;
