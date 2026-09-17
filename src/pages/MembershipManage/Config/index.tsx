import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import {
  fetchMembershipList,
  MembershipAPI,
} from '@/services/membership/MembershipController';
import {
  formatAmountMinor,
  PLATFORM_OPTIONS,
  PRICE_STATUS_OPTIONS,
  PRODUCT_STATUS,
  PRODUCT_STATUS_OPTIONS,
} from '@/services/membership/constants';
import type {
  MembershipBenefit,
  MembershipProduct,
  MembershipSku,
  PaymentPrice,
} from '@/services/membership/typings';
import { Navigate, useAccess } from '@umijs/max';
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Row,
  Select,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  renderPriceStatusTag,
  renderProductStatusTag,
  renderSellableTag,
} from '../statusTags';
import {
  assertValidJsonString,
  MEMBERSHIP_FIELD_WIDTH,
  pickChangedFields,
  postMembershipAction,
  renderDateTime,
  toRfc3339,
} from '../utils';

const ProductTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipProduct | null>(null);
  const [form] = Form.useForm();

  const openModal = (record?: MembershipProduct) => {
    setEditing(record ?? null);
    form.setFieldsValue(
      record ?? {
        // 新建默认草稿、不对外可售（与后端缺省一致）
        status: 3,
        is_sellable: 0,
        level_rank: 10,
        sort_no: 1,
      },
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      const changed = pickChangedFields(editing, values, [
        'product_name',
        'description',
        'level_rank',
        'sort_no',
        'is_sellable',
        'status',
      ]);
      // description 传 "" 会清空说明，保留在 payload 中
      if (Object.keys(changed).length === 0) {
        message.info('未修改任何字段');
        return;
      }
      await postMembershipAction(
        () =>
          MembershipAPI.updateProduct({
            product_code: editing.product_code,
            ...changed,
          }),
        '商品已更新',
      );
    } else {
      await postMembershipAction(
        () =>
          MembershipAPI.createProduct({
            ...values,
            status: values.status ?? 3,
            is_sellable: values.is_sellable ?? 0,
          }),
        '商品已创建',
      );
    }
    setOpen(false);
    ref.current?.getData();
  };

  const changeStatus = (record: MembershipProduct, status: number) => {
    const willDisablePrices = status === 2 || status === 3;
    Modal.confirm({
      title: `确认将 ${record.product_name} 设为「${PRODUCT_STATUS[status]}」？`,
      content: willDisablePrices
        ? '停用/草稿会停掉该商品下所有启用价格；仅关闭「可售」不会停价。设为启用且对外可售前需有启用 SKU 与当前有效价。'
        : '设为启用且对外可售前，需至少 1 条启用 SKU（C 端组合合法）及当前有效启用价。',
      onOk: async () => {
        await postMembershipAction(
          () =>
            MembershipAPI.updateProductStatus({
              product_code: record.product_code,
              status,
            }),
          '状态已更新',
        );
        ref.current?.getData();
      },
    });
  };

  return (
    <>
      <BaseListPage
        ref={ref}
        title="会员商品"
        createButton={{ text: '新建商品', onClick: () => openModal() }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listProducts, params)
        }
        searchFormItems={
          <Col>
            <Form.Item name="status" label="状态">
              <Select
                allowClear
                style={MEMBERSHIP_FIELD_WIDTH}
                placeholder="请选择状态"
                options={PRODUCT_STATUS_OPTIONS}
              />
            </Form.Item>
          </Col>
        }
        columns={[
          { title: '商品编码', dataIndex: 'product_code' },
          { title: '名称', dataIndex: 'product_name' },
          { title: '等级', dataIndex: 'level_rank', width: 80 },
          {
            title: '可售',
            dataIndex: 'is_sellable',
            width: 80,
            render: (v: number) => renderSellableTag(v),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderProductStatusTag(v),
          },
          { title: '排序', dataIndex: 'sort_no', width: 80 },
          {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: MembershipProduct) => (
              <>
                <a onClick={() => openModal(record)}>编辑</a>
                {' · '}
                <a onClick={() => changeStatus(record, 1)}>启用</a>
                {' · '}
                <a onClick={() => changeStatus(record, 2)}>停用</a>
              </>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? '编辑商品' : '新建商品'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_code"
            label="商品编码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="product_name"
            label="名称"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="说明"
            extra="编辑时提交空内容会清空已有说明"
          >
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="level_rank" label="等级排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_no" label="展示排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="is_sellable"
                label="对外可售"
                extra="与状态独立；可「启用但不对外卖」"
              >
                <Select
                  options={[
                    { label: '是', value: 1 },
                    { label: '否', value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                extra="启用+可售需有启用 SKU 与当前价"
              >
                <Select options={PRODUCT_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

const SkuTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipSku | null>(null);
  const [form] = Form.useForm();

  const openModal = (record?: MembershipSku) => {
    setEditing(record ?? null);
    form.setFieldsValue(
      record ?? {
        billing_mode: 'FIXED_TERM',
        period_unit: 'MONTH',
        period_count: 12,
        status: 3,
      },
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      const changed = pickChangedFields(editing, values, [
        'sku_name',
        'period_count',
        'base_amount_minor',
        'status',
      ]);
      if (changed.sku_name === '') {
        delete changed.sku_name;
      }
      if (Object.keys(changed).length === 0) {
        message.info('未修改任何字段');
        return;
      }
      await postMembershipAction(
        () =>
          MembershipAPI.updateSku({
            sku_code: editing.sku_code,
            ...changed,
          }),
        'SKU 已更新',
      );
    } else {
      await postMembershipAction(
        () =>
          MembershipAPI.createSku({
            ...values,
            billing_mode: values.billing_mode || 'FIXED_TERM',
            period_unit: values.period_unit || 'MONTH',
            status: values.status ?? 3,
          }),
        'SKU 已创建',
      );
    }
    setOpen(false);
    ref.current?.getData();
  };

  return (
    <>
      <BaseListPage
        ref={ref}
        title="会员 SKU"
        createButton={{ text: '新建 SKU', onClick: () => openModal() }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listSkus, params)
        }
        searchFormItems={
          <>
            <Col>
              <Form.Item name="product_code" label="商品编码">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入商品编码"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择状态"
                  options={PRODUCT_STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          { title: 'SKU 编码', dataIndex: 'sku_code' },
          { title: '名称', dataIndex: 'sku_name' },
          { title: '商品', dataIndex: 'product_code' },
          {
            title: '周期',
            render: (_: unknown, r: MembershipSku) =>
              `${r.period_count}${
                r.period_unit === 'MONTH' ? '月' : r.period_unit
              }`,
          },
          {
            title: '基准价',
            dataIndex: 'base_amount_minor',
            render: (v: number) => formatAmountMinor(v),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderProductStatusTag(v),
          },
          {
            title: '操作',
            render: (_: unknown, record: MembershipSku) => (
              <a onClick={() => openModal(record)}>编辑</a>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? '编辑 SKU' : '新建 SKU'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_code"
            label="商品编码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="sku_code"
            label="SKU 编码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="sku_name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="period_count" label="时长">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="period_unit" label="单位">
                <Select
                  options={[
                    { label: '月', value: 'MONTH' },
                    { label: '天', value: 'DAY' },
                  ]}
                  disabled={!!editing}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select options={PRODUCT_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="base_amount_minor" label="基准价（分）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const PriceTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const platform = Form.useWatch('client_platform', form);

  const submit = async () => {
    const values = await form.validateFields();
    let extraConfig: string | undefined;
    try {
      extraConfig = assertValidJsonString(values.extra_config, 'extra_config');
    } catch (e: any) {
      message.error(e.message || 'JSON 校验失败');
      return;
    }
    const isAndroid = values.client_platform === 'ANDROID';
    if (!isAndroid && !(values.provider_product_id || '').trim()) {
      message.error('iOS 必须填写 App Store Product ID');
      return;
    }
    Modal.confirm({
      title: '确认新增价格版本？',
      content:
        '改价即切换：同 SKU+平台上更晚的启用价会被停用，当前启用段会在新生效点截断。同一生效起点再提交会覆盖该版本。iOS Product ID 不可被其它 SKU 占用。',
      onOk: async () => {
        await postMembershipAction(
          () =>
            MembershipAPI.createPrice({
              sku_code: values.sku_code,
              client_platform: values.client_platform,
              provider_product_id: isAndroid
                ? ''
                : String(values.provider_product_id || '').trim(),
              amount_minor: Number(values.amount_minor),
              currency: values.currency || 'CNY',
              effective_start: values.effective_start
                ? toRfc3339(values.effective_start)
                : undefined,
              extra_config: extraConfig || undefined,
            }),
          '价格版本已创建',
        );
        setOpen(false);
        ref.current?.getData();
      },
    });
  };

  const changeStatus = (record: PaymentPrice, status: number) => {
    Modal.confirm({
      title: status === 1 ? '确认启用该价格？' : '确认停用该价格？',
      content:
        status === 1
          ? '若同 SKU+平台已有启用价格或该价格已过期，将启用失败。'
          : undefined,
      onOk: async () => {
        await postMembershipAction(
          () => MembershipAPI.updatePriceStatus({ id: record.id, status }),
          '价格状态已更新',
        );
        ref.current?.getData();
      },
    });
  };

  return (
    <>
      <BaseListPage
        ref={ref}
        title="分平台定价"
        createButton={{
          text: '新增价格版本',
          onClick: () => {
            form.resetFields();
            form.setFieldsValue({
              client_platform: 'ANDROID',
              currency: 'CNY',
              effective_start: dayjs(),
            });
            setOpen(true);
          },
        }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listPrices, params)
        }
        searchFormItems={
          <>
            <Col>
              <Form.Item name="sku_code" label="SKU">
                <Input
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请输入 SKU 编码"
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
            <Col>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  style={MEMBERSHIP_FIELD_WIDTH}
                  placeholder="请选择状态"
                  options={PRICE_STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>
          </>
        }
        columns={[
          { title: 'SKU', dataIndex: 'sku_code' },
          { title: '平台', dataIndex: 'client_platform', width: 90 },
          {
            title: '售价',
            dataIndex: 'amount_minor',
            render: (v: number, r: PaymentPrice) =>
              formatAmountMinor(v, r.currency),
          },
          { title: 'iOS Product ID', dataIndex: 'provider_product_id' },
          {
            title: '生效起',
            dataIndex: 'effective_start',
            render: renderDateTime,
          },
          {
            title: '生效止',
            dataIndex: 'effective_end',
            render: renderDateTime,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderPriceStatusTag(v),
          },
          {
            title: '操作',
            render: (_: unknown, record: PaymentPrice) => (
              <>
                <a onClick={() => changeStatus(record, 1)}>启用</a>
                {' · '}
                <a onClick={() => changeStatus(record, 2)}>停用</a>
              </>
            ),
          },
        ]}
      />
      <Modal
        title="新增价格版本"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sku_code"
            label="SKU 编码"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="client_platform"
            label="平台"
            rules={[{ required: true }]}
          >
            <Select options={PLATFORM_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="amount_minor"
            label="售价（分）"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="provider_product_id"
            label="iOS Product ID"
            extra={
              platform === 'ANDROID'
                ? 'Android 必须留空'
                : '必填；不可与其它 SKU 的 Product ID 重复'
            }
            rules={
              platform === 'IOS'
                ? [{ required: true, message: '请填写 Product ID' }]
                : undefined
            }
          >
            <Input
              placeholder="Android 留空"
              disabled={platform === 'ANDROID'}
            />
          </Form.Item>
          <Form.Item
            name="effective_start"
            label="生效时间"
            extra="按 RFC3339 提交；不填则用当前时间，不可早于现在超过 60 秒"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="extra_config"
            label="extra_config（JSON）"
            extra="可空；非空时须为合法 JSON"
          >
            <Input.TextArea rows={3} placeholder='例如 {"key":"value"}' />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const BenefitTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipBenefit | null>(null);
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    let benefitConfig = '';
    try {
      benefitConfig = assertValidJsonString(
        values.benefit_config,
        'benefit_config',
      );
    } catch (e: any) {
      message.error(e.message || 'JSON 校验失败');
      return;
    }

    const payload: {
      product_code: string;
      benefit_code: string;
      benefit_config?: string;
      status?: number;
    } = {
      product_code: values.product_code,
      benefit_code: values.benefit_code,
    };

    if (editing) {
      // 已存在：传 "" 会写成 "{}"；status>0 才改
      payload.benefit_config = benefitConfig;
      if (values.status > 0) payload.status = values.status;
    } else {
      payload.benefit_config = benefitConfig || '{}';
      payload.status = values.status || 1;
    }

    await postMembershipAction(
      () => MembershipAPI.upsertBenefit(payload),
      '权益已保存',
    );
    setOpen(false);
    ref.current?.getData();
  };

  return (
    <>
      <BaseListPage
        ref={ref}
        title="商品权益"
        createButton={{
          text: '配置权益',
          onClick: () => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ status: 1, benefit_config: '{}' });
            setOpen(true);
          },
        }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listBenefits, params)
        }
        searchFormItems={
          <Col>
            <Form.Item name="product_code" label="商品编码">
              <Input
                allowClear
                style={MEMBERSHIP_FIELD_WIDTH}
                placeholder="请输入商品编码"
              />
            </Form.Item>
          </Col>
        }
        columns={[
          { title: '商品', dataIndex: 'product_code' },
          { title: '权益码', dataIndex: 'benefit_code' },
          { title: '配置 JSON', dataIndex: 'benefit_config', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => renderPriceStatusTag(v),
          },
          {
            title: '操作',
            render: (_: unknown, record: MembershipBenefit) => (
              <a
                onClick={() => {
                  setEditing(record);
                  form.setFieldsValue(record);
                  setOpen(true);
                }}
              >
                编辑
              </a>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? '编辑权益' : '新建权益'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_code"
            label="商品编码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="benefit_code"
            label="权益码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="benefit_config"
            label="配置 JSON"
            extra={
              editing ? '传空串会写成 "{}"；非空须为合法 JSON' : '可空，默认 {}'
            }
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={PRICE_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const MembershipConfigPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!membershipManage()) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const items = [
    { key: 'products', label: '商品', children: <ProductTab /> },
    { key: 'skus', label: 'SKU', children: <SkuTab /> },
    { key: 'prices', label: '定价', children: <PriceTab /> },
    { key: 'benefits', label: '权益', children: <BenefitTab /> },
  ];

  return (
    <Tabs
      defaultActiveKey="products"
      items={items}
      tabBarStyle={{ padding: '0 40px' }}
    />
  );
};

export default MembershipConfigPage;
