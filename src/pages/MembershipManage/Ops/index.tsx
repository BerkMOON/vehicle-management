import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { SuccessCode } from '@/constants';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  CLOSE_TASK_STATUS,
  formatAmountMinor,
  PROVIDER_OPTIONS,
} from '@/services/membership/constants';
import type { PaymentEventInbox } from '@/services/membership/typings';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import {
  Button,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Table,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { postMembershipAction } from '../utils';

const InboxTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventDetail, setEventDetail] = useState<PaymentEventInbox | null>(
    null,
  );
  const [rawBody, setRawBody] = useState('');

  const openDetail = async (record: PaymentEventInbox) => {
    setDrawerOpen(true);
    setLoading(true);
    try {
      const res = await MembershipAPI.getInboxEventDetail(record.id);
      if (res?.response_status?.code === SuccessCode.SUCCESS && res.data) {
        setEventDetail(res.data.event);
        setRawBody((res.data.event as { raw_body?: string }).raw_body ?? '');
      }
    } finally {
      setLoading(false);
    }
  };

  const replay = (record: PaymentEventInbox) => {
    Modal.confirm({
      title: '确认重放该事件？',
      content: `event_id: ${record.event_id}`,
      onOk: async () => {
        await postMembershipAction(
          () => MembershipAPI.replayInboxEvent({ id: record.id }),
          '已加入重试队列',
        );
        ref.current?.getData();
      },
    });
  };

  return (
    <>
      <BaseListPage
        ref={ref}
        title="回调事件箱"
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listInboxEvents, params)
        }
        searchFormItems={
          <>
            <Col span={6}>
              <Form.Item name="provider" label="渠道">
                <Select allowClear options={PROVIDER_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="event_type" label="事件类型">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="process_status" label="处理状态">
                <Input allowClear placeholder="1/3/4 等" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="order_no" label="PAY 单号">
                <Input allowClear />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '渠道', dataIndex: 'provider', width: 90 },
          { title: '事件类型', dataIndex: 'event_type' },
          { title: 'PAY 单号', dataIndex: 'order_no' },
          { title: '处理状态', dataIndex: 'process_status', width: 90 },
          { title: '重试次数', dataIndex: 'retry_count', width: 90 },
          { title: '最后错误', dataIndex: 'last_error', ellipsis: true },
          {
            title: '操作',
            render: (_: unknown, record: PaymentEventInbox) => (
              <>
                <a onClick={() => openDetail(record)}>详情</a>
                {' · '}
                <a onClick={() => replay(record)}>重放</a>
              </>
            ),
          },
        ]}
      />
      <Drawer
        title="事件详情"
        width={640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Spin spinning={loading}>
          {eventDetail && (
            <>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="event_id">
                  {eventDetail.event_id}
                </Descriptions.Item>
                <Descriptions.Item label="verify_status">
                  {eventDetail.verify_status}
                </Descriptions.Item>
                <Descriptions.Item label="process_status">
                  {eventDetail.process_status}
                </Descriptions.Item>
                <Descriptions.Item label="last_error">
                  {eventDetail.last_error || '-'}
                </Descriptions.Item>
              </Descriptions>
              <h4 style={{ marginTop: 16 }}>raw_body</h4>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  maxHeight: 360,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {rawBody || '-'}
              </pre>
            </>
          )}
        </Spin>
      </Drawer>
    </>
  );
};

const AppleBindingTab: React.FC = () => (
  <BaseListPage
    title="Apple 绑定"
    fetchData={(params) =>
      fetchMembershipList(MembershipAPI.listAppleBindings, params)
    }
    searchFormItems={
      <>
        <Col span={6}>
          <Form.Item name="order_no" label="PAY 单号">
            <Input allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="transaction_id" label="Transaction ID">
            <Input allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="app_account_token" label="App Account Token">
            <Input allowClear />
          </Form.Item>
        </Col>
      </>
    }
    columns={[
      { title: 'PAY 单号', dataIndex: 'order_no' },
      { title: 'Transaction ID', dataIndex: 'transaction_id', ellipsis: true },
      { title: 'Token', dataIndex: 'app_account_token', ellipsis: true },
      { title: 'Product ID', dataIndex: 'product_id' },
      { title: '环境', dataIndex: 'environment' },
      { title: '用户 ID', dataIndex: 'user_id' },
    ]}
  />
);

const CloseTaskTab: React.FC = () => (
  <BaseListPage
    title="关单任务"
    fetchData={(params) =>
      fetchMembershipList(MembershipAPI.listCloseTasks, params)
    }
    searchFormItems={
      <Col span={6}>
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            options={[
              { label: '待处理', value: 1 },
              { label: '已完成', value: 2 },
            ]}
          />
        </Form.Item>
      </Col>
    }
    columns={[
      { title: 'PAY 单号', dataIndex: 'payment_order_no' },
      { title: '渠道', dataIndex: 'provider' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (v: number) => CLOSE_TASK_STATUS[v] ?? v,
      },
      { title: '创建时间', dataIndex: 'ctime' },
    ]}
  />
);

const IdempotencyTab: React.FC = () => (
  <BaseListPage
    title="幂等记录"
    fetchData={(params) =>
      fetchMembershipList(MembershipAPI.listIdempotency, params)
    }
    searchFormItems={
      <>
        <Col span={6}>
          <Form.Item name="user_id" label="用户 ID">
            <Input allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="idempotency_key" label="幂等键">
            <Input allowClear />
          </Form.Item>
        </Col>
      </>
    }
    columns={[
      { title: '用户 ID', dataIndex: 'user_id' },
      { title: '幂等键', dataIndex: 'idempotency_key', ellipsis: true },
      { title: '操作', dataIndex: 'operation' },
      { title: '状态', dataIndex: 'state' },
      { title: '结果码', dataIndex: 'result_code' },
      { title: '创建时间', dataIndex: 'ctime' },
    ]}
  />
);

const SalesSummaryTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<
    {
      provider: string;
      client_platform: string;
      order_count: number;
      amount_minor: number;
    }[]
  >([]);

  const query = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const res = await MembershipAPI.salesSummary({
        start_time: dayjs(values.range[0]).format('YYYY-MM-DD HH:mm:ss'),
        end_time: dayjs(values.range[1]).format('YYYY-MM-DD HH:mm:ss'),
      });
      if (res?.response_status?.code === SuccessCode.SUCCESS) {
        setRows(res.data ?? []);
      } else {
        message.error(res?.response_status?.msg || '查询失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="range"
          label="支付时间"
          rules={[{ required: true, message: '请选择时间范围' }]}
        >
          <DatePicker.RangePicker showTime />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={query} loading={loading}>
            查询汇总
          </Button>
        </Form.Item>
      </Form>
      <Table
        rowKey={(r) => `${r.provider}-${r.client_platform}`}
        loading={loading}
        dataSource={rows}
        pagination={false}
        columns={[
          { title: '渠道', dataIndex: 'provider' },
          { title: '平台', dataIndex: 'client_platform' },
          { title: '订单数', dataIndex: 'order_count' },
          {
            title: '销售额',
            dataIndex: 'amount_minor',
            render: (v: number) => formatAmountMinor(v),
          },
        ]}
      />
    </div>
  );
};

const MembershipOpsPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return <div style={{ padding: 48, textAlign: 'center' }}>无权限访问</div>;
  }

  return (
    <PageContainer title="运维监控">
      <Tabs
        items={[
          { key: 'inbox', label: '回调 Inbox', children: <InboxTab /> },
          { key: 'apple', label: 'Apple 绑定', children: <AppleBindingTab /> },
          { key: 'close', label: '关单任务', children: <CloseTaskTab /> },
          {
            key: 'idempotency',
            label: '幂等记录',
            children: <IdempotencyTab />,
          },
          { key: 'report', label: '销售汇总', children: <SalesSummaryTab /> },
        ]}
      />
    </PageContainer>
  );
};

export default MembershipOpsPage;
