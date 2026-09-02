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
  MEM_STATUS,
  MEM_STATUS_OPTIONS,
} from '@/services/membership/constants';
import type {
  MembershipOrder,
  MembershipOrderDetail,
} from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import {
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Spin,
  Table,
  Tag,
} from 'antd';
import React, { useRef, useState } from 'react';

const MembershipOrdersPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const ref = useRef<BaseListPageRef>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MembershipOrderDetail | null>(null);

  const openDetail = async (record: MembershipOrder) => {
    setDrawerOpen(true);
    setLoading(true);
    setDetail(null);
    try {
      const res = await MembershipAPI.getMembershipOrderDetail(
        record.membership_order_no,
      );
      if (res?.response_status?.code === SuccessCode.SUCCESS && res.data) {
        setDetail(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return <div style={{ padding: 48, textAlign: 'center' }}>无权限访问</div>;
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
            <Col span={6}>
              <Form.Item name="user_phone" label="手机号">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="membership_order_no" label="MEM 单号">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select allowClear options={MEM_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="order_type" label="类型">
                <Select
                  allowClear
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
            render: (v: string) =>
              v === 'GRANT' ? <Tag color="blue">赠送</Tag> : <Tag>购买</Tag>,
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
            render: (v: number) => MEM_STATUS[v] ?? v,
          },
          { title: '创建时间', dataIndex: 'ctime' },
        ]}
      />
      <Drawer
        title="业务单详情"
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Spin spinning={loading}>
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
                  {detail.order.order_type}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {MEM_STATUS[detail.order.status]}
                </Descriptions.Item>
                <Descriptions.Item label="赠送原因">
                  {detail.order.grant_reason || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="履约 PAY">
                  {detail.order.fulfilled_payment_order_no || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="权益起">
                  {detail.order.effective_start || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="权益止">
                  {detail.order.effective_end || '-'}
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
                  { title: '状态', dataIndex: 'status' },
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
