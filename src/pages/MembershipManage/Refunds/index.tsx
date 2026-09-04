import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  formatAmountMinor,
  PROVIDER_OPTIONS,
  REFUND_STATUS_OPTIONS,
} from '@/services/membership/constants';
import type { PaymentRefund } from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Col, Form, Input, Modal, Result, Select } from 'antd';
import React, { useRef, useState } from 'react';
import { renderRefundStatusTag } from '../statusTags';
import {
  MEMBERSHIP_FIELD_WIDTH,
  postMembershipAction,
  renderDateTime,
} from '../utils';

const RefundsPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const submitRefund = async () => {
    const values = await form.validateFields();
    await postMembershipAction(
      () => MembershipAPI.createManualRefund(values),
      '退款单已创建，Worker 将自动处理',
    );
    setOpen(false);
    ref.current?.getData();
  };

  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={ref}
        title="退款单"
        createButton={{
          text: '人工发起退款（Android）',
          onClick: () => {
            form.resetFields();
            setOpen(true);
          },
        }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listRefunds, params)
        }
        searchFormItems={
          <>
            <Col>
              <Form.Item name="refund_no" label="退款单号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入退款单号"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="payment_order_no" label="PAY 单号">
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
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择状态"
                  options={REFUND_STATUS_OPTIONS}
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
          </>
        }
        columns={[
          { title: '退款单号', dataIndex: 'refund_no' },
          { title: 'PAY 单号', dataIndex: 'payment_order_no' },
          { title: '手机号', dataIndex: 'user_phone' },
          { title: '渠道', dataIndex: 'provider' },
          {
            title: '金额',
            dataIndex: 'amount_minor',
            render: (v: number, r: PaymentRefund) =>
              formatAmountMinor(v, r.currency),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderRefundStatusTag(v),
          },
          { title: '原因', dataIndex: 'reason', ellipsis: true },
          {
            title: '申请时间',
            dataIndex: 'requested_at',
            render: renderDateTime,
          },
          {
            title: '完成时间',
            dataIndex: 'completed_at',
            render: renderDateTime,
          },
        ]}
      />
      <Modal
        title="人工发起退款"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submitRefund}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="payment_order_no"
            label="PAY 单号"
            rules={[{ required: true }]}
          >
            <Input placeholder="仅支付宝/微信成功单" />
          </Form.Item>
          <Form.Item name="reason" label="退款原因">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RefundsPage;
