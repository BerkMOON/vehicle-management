import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  formatAmountMinor,
  INBOX_PROCESS_STATUS_OPTIONS,
  PROVIDER_OPTIONS,
} from '@/services/membership/constants';
import {
  getMembershipErrorMessage,
  MembershipBizCode,
} from '@/services/membership/error';
import type { PaymentEventInbox } from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Result,
  Select,
  Spin,
  Table,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  renderCloseTaskStatusTag,
  renderIdempotencyStateTag,
  renderInboxProcessStatusTag,
  renderInboxVerifyStatusTag,
} from '../statusTags';
import {
  formatDateTime,
  MEMBERSHIP_FIELD_WIDTH,
  renderDateTime,
} from '../utils';

const tabContentStyle = { padding: '0 40px' };

const InboxTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventDetail, setEventDetail] = useState<PaymentEventInbox | null>(
    null,
  );
  const [rawBody, setRawBody] = useState('');
  const [notFound, setNotFound] = useState(false);

  const openDetail = async (record: PaymentEventInbox) => {
    setDrawerOpen(true);
    setLoading(true);
    setEventDetail(null);
    setRawBody('');
    setNotFound(false);
    try {
      const res = await MembershipAPI.getInboxEventDetail(record.id);
      const code = res?.response_status?.code;
      if (code === MembershipBizCode.SUCCESS && res.data?.event) {
        setEventDetail(res.data.event);
        // raw_body 在响应顶层，不在 event 内
        setRawBody(res.data.raw_body ?? '');
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

  const rawBodyTruncated = rawBody.endsWith('...(truncated)');

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
              <Form.Item name="event_type" label="事件类型">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入事件类型"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="process_status" label="处理状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择处理状态"
                  options={INBOX_PROCESS_STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="order_no" label="PAY 单号">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入 PAY 单号"
                />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '渠道', dataIndex: 'provider', width: 90 },
          { title: '事件类型', dataIndex: 'event_type' },
          { title: 'PAY 单号', dataIndex: 'order_no' },
          {
            title: '验签',
            dataIndex: 'verify_status',
            width: 90,
            render: renderInboxVerifyStatusTag,
          },
          {
            title: '处理状态',
            dataIndex: 'process_status',
            width: 90,
            render: renderInboxProcessStatusTag,
          },
          { title: '重试次数', dataIndex: 'retry_count', width: 90 },
          { title: '最后错误', dataIndex: 'last_error', ellipsis: true },
          { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
          {
            title: '操作',
            render: (_: unknown, record: PaymentEventInbox) => (
              <a onClick={() => openDetail(record)}>详情</a>
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
          {notFound && <Alert type="warning" showIcon message="事件不存在" />}
          {eventDetail && (
            <>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="event_id">
                  {eventDetail.event_id}
                </Descriptions.Item>
                <Descriptions.Item label="verify_status">
                  {renderInboxVerifyStatusTag(eventDetail.verify_status)}
                </Descriptions.Item>
                <Descriptions.Item label="process_status">
                  {renderInboxProcessStatusTag(eventDetail.process_status)}
                </Descriptions.Item>
                <Descriptions.Item label="next_retry_at">
                  {formatDateTime(eventDetail.next_retry_at)}
                </Descriptions.Item>
                <Descriptions.Item label="processed_at">
                  {formatDateTime(eventDetail.processed_at)}
                </Descriptions.Item>
                <Descriptions.Item label="last_error">
                  {eventDetail.last_error || '-'}
                </Descriptions.Item>
              </Descriptions>
              <h4 style={{ marginTop: 16 }}>raw_body</h4>
              {rawBodyTruncated && (
                <Alert
                  style={{ marginBottom: 8 }}
                  type="info"
                  showIcon
                  message="原始报文已截断（超过 512 字节）"
                />
              )}
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
          <Form.Item name="transaction_id" label="Transaction ID">
            <Input
              allowClear
              style={MEMBERSHIP_FIELD_WIDTH}
              placeholder="请输入 Transaction ID"
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="app_account_token" label="App Account Token">
            <Input
              allowClear
              style={MEMBERSHIP_FIELD_WIDTH}
              placeholder="请输入 Token"
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="user_id" label="用户 ID">
            <Input
              allowClear
              style={MEMBERSHIP_FIELD_WIDTH}
              placeholder="请输入用户 ID"
            />
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
      { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
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
      <Col>
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            style={MEMBERSHIP_FIELD_WIDTH}
            placeholder="请选择状态"
            options={[
              { label: '待关', value: 1 },
              { label: '已处理', value: 2 },
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
        render: (v: number) => renderCloseTaskStatusTag(v),
      },
      { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
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
        <Col>
          <Form.Item name="user_id" label="用户 ID">
            <Input
              allowClear
              style={MEMBERSHIP_FIELD_WIDTH}
              placeholder="请输入用户 ID"
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="idempotency_key" label="幂等键">
            <Input
              allowClear
              style={{ width: 260 }}
              placeholder="请输入幂等键"
            />
          </Form.Item>
        </Col>
      </>
    }
    columns={[
      { title: '用户 ID', dataIndex: 'user_id' },
      { title: '幂等键', dataIndex: 'idempotency_key', ellipsis: true },
      { title: '操作', dataIndex: 'operation' },
      { title: '状态', dataIndex: 'state', render: renderIdempotencyStateTag },
      { title: '结果码', dataIndex: 'result_code' },
      { title: '创建时间', dataIndex: 'ctime', render: renderDateTime },
    ]}
  />
);

const SalesSummaryTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<
    {
      key: string;
      provider: string;
      client_platform: string;
      currency: string;
      order_count: number;
      amount_minor: number;
      refund_count: number;
      refund_amount_minor: number;
      net_amount_minor: number;
    }[]
  >([]);

  const query = async () => {
    const values = await form.validateFields();
    const start = dayjs(values.range[0]);
    const end = dayjs(values.range[1]);
    if (end.diff(start, 'day') > 366) {
      message.warning('查询跨度不能超过 366 天');
      return;
    }
    setLoading(true);
    try {
      // end_time 传纯日期时后端会扩展到当天 23:59:59
      const res = await MembershipAPI.salesSummary({
        start_time: start.format('YYYY-MM-DD'),
        end_time: end.format('YYYY-MM-DD'),
      });
      const code = res?.response_status?.code;
      if (code === MembershipBizCode.SUCCESS) {
        const report = res.data ?? { gross: [], refund: [] };
        const map = new Map<
          string,
          {
            key: string;
            provider: string;
            client_platform: string;
            currency: string;
            order_count: number;
            amount_minor: number;
            refund_count: number;
            refund_amount_minor: number;
            net_amount_minor: number;
          }
        >();
        const dimKey = (p: string, plat: string, cur: string) =>
          `${p}|${plat}|${cur}`;

        for (const g of report.gross ?? []) {
          const key = dimKey(
            g.provider,
            g.client_platform,
            g.currency || 'CNY',
          );
          map.set(key, {
            key,
            provider: g.provider,
            client_platform: g.client_platform,
            currency: g.currency || 'CNY',
            order_count: g.order_count || 0,
            amount_minor: g.amount_minor || 0,
            refund_count: 0,
            refund_amount_minor: 0,
            net_amount_minor: g.amount_minor || 0,
          });
        }
        for (const r of report.refund ?? []) {
          const currency = r.currency || 'CNY';
          const key = dimKey(r.provider, r.client_platform, currency);
          const row = map.get(key) ?? {
            key,
            provider: r.provider,
            client_platform: r.client_platform,
            currency,
            order_count: 0,
            amount_minor: 0,
            refund_count: 0,
            refund_amount_minor: 0,
            net_amount_minor: 0,
          };
          row.refund_count = r.refund_count || 0;
          row.refund_amount_minor = r.refund_amount_minor || 0;
          row.net_amount_minor = row.amount_minor - row.refund_amount_minor;
          map.set(key, row);
        }
        setRows(Array.from(map.values()));
      } else {
        message.error(
          getMembershipErrorMessage(code, res?.response_status?.msg),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={tabContentStyle}>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="口径说明"
        description="毛收入按当前仍为成功的支付单 paid_at；退款后 PAY 变为已退款时该笔会从毛收入消失。退款按退款单 completed_at。净额 = 毛收入 − 退款（前端计算）。"
      />
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="range"
          label="统计区间"
          rules={[{ required: true, message: '请选择时间范围' }]}
        >
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={query} loading={loading}>
            查询汇总
          </Button>
        </Form.Item>
      </Form>
      <Table
        rowKey="key"
        loading={loading}
        dataSource={rows}
        pagination={false}
        columns={[
          { title: '渠道', dataIndex: 'provider' },
          { title: '平台', dataIndex: 'client_platform' },
          { title: '币种', dataIndex: 'currency', width: 80 },
          { title: '成交笔数', dataIndex: 'order_count' },
          {
            title: '毛收入',
            dataIndex: 'amount_minor',
            render: (v: number, r) => formatAmountMinor(v, r.currency),
          },
          { title: '退款笔数', dataIndex: 'refund_count' },
          {
            title: '退款额',
            dataIndex: 'refund_amount_minor',
            render: (v: number, r) => formatAmountMinor(v, r.currency),
          },
          {
            title: '净额',
            dataIndex: 'net_amount_minor',
            render: (v: number, r) => formatAmountMinor(v, r.currency),
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
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const items = [
    { key: 'inbox', label: '回调 Inbox', children: <InboxTab /> },
    { key: 'apple', label: 'Apple 绑定', children: <AppleBindingTab /> },
    { key: 'close', label: '关单任务', children: <CloseTaskTab /> },
    { key: 'idempotency', label: '幂等记录', children: <IdempotencyTab /> },
    {
      key: 'report',
      label: '销售汇总',
      children: <SalesSummaryTab />,
    },
  ];

  return (
    <Tabs
      defaultActiveKey="inbox"
      items={items}
      tabBarStyle={{ padding: '0 40px' }}
    />
  );
};

export default MembershipOpsPage;
