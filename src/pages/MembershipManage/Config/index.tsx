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
  Modal,
  Row,
  Select,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { postMembershipAction } from '../utils';

const ProductTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipProduct | null>(null);
  const [form] = Form.useForm();

  const openModal = (record?: MembershipProduct) => {
    setEditing(record ?? null);
    form.setFieldsValue(
      record ?? {
        status: 1,
        is_sellable: 1,
        level_rank: 10,
        sort_no: 1,
      },
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const api = editing
      ? MembershipAPI.updateProduct
      : MembershipAPI.createProduct;
    await postMembershipAction(
      () => api({ ...values, product_code: values.product_code }),
      editing ? '商品已更新' : '商品已创建',
    );
    setOpen(false);
    ref.current?.getData();
  };

  const changeStatus = (record: MembershipProduct, status: number) => {
    Modal.confirm({
      title: `确认将 ${record.product_name} 设为「${PRODUCT_STATUS[status]}」？`,
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
          <Col span={6}>
            <Form.Item name="status" label="状态">
              <Select allowClear options={PRODUCT_STATUS_OPTIONS} />
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
            render: (v: number) => (v === 1 ? '是' : '否'),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => PRODUCT_STATUS[v] ?? v,
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
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
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
              <Form.Item name="is_sellable" label="可售">
                <Select
                  options={[
                    { label: '是', value: 1 },
                    { label: '否', value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
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
        status: 1,
      },
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const api = editing ? MembershipAPI.updateSku : MembershipAPI.createSku;
    await postMembershipAction(
      () => api({ ...values, sku_code: values.sku_code }),
      editing ? 'SKU 已更新' : 'SKU 已创建',
    );
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
            <Col span={6}>
              <Form.Item name="product_code" label="商品编码">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select allowClear options={PRODUCT_STATUS_OPTIONS} />
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
            render: (v: number) => PRODUCT_STATUS[v] ?? v,
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
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="period_unit" label="单位">
                <Select options={[{ label: '月', value: 'MONTH' }]} />
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

  const submit = async () => {
    const values = await form.validateFields();
    await postMembershipAction(
      () =>
        MembershipAPI.createPrice({
          ...values,
          amount_minor: Number(values.amount_minor),
          effective_start: values.effective_start
            ? dayjs(values.effective_start).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
        }),
      '价格版本已创建',
    );
    setOpen(false);
    ref.current?.getData();
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
            <Col span={6}>
              <Form.Item name="sku_code" label="SKU">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="client_platform" label="平台">
                <Select allowClear options={PLATFORM_OPTIONS} />
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
          { title: '生效起', dataIndex: 'effective_start' },
          { title: '生效止', dataIndex: 'effective_end' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (v: number) => PRODUCT_STATUS[v] ?? v,
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
          <Form.Item name="provider_product_id" label="iOS Product ID">
            <Input placeholder="Android 留空" />
          </Form.Item>
          <Form.Item name="effective_start" label="生效时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const BenefitTab: React.FC = () => {
  const ref = useRef<BaseListPageRef>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    await postMembershipAction(
      () =>
        MembershipAPI.upsertBenefit({ ...values, status: values.status ?? 1 }),
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
            form.resetFields();
            form.setFieldsValue({ status: 1, benefit_config: '{}' });
            setOpen(true);
          },
        }}
        fetchData={(params) =>
          fetchMembershipList(MembershipAPI.listBenefits, params)
        }
        searchFormItems={
          <Col span={6}>
            <Form.Item name="product_code" label="商品编码">
              <Input allowClear />
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
            render: (v: number) => PRODUCT_STATUS[v] ?? v,
          },
          {
            title: '操作',
            render: (_: unknown, record: MembershipBenefit) => (
              <a
                onClick={() => {
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
        title="权益配置"
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
            <Input />
          </Form.Item>
          <Form.Item
            name="benefit_code"
            label="权益码"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="benefit_config" label="配置 JSON">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={PRODUCT_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const MembershipConfigPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>无权限访问会员配置</div>
    );
  }

  return (
    <Tabs
      items={[
        { key: 'products', label: '商品', children: <ProductTab /> },
        { key: 'skus', label: 'SKU', children: <SkuTab /> },
        { key: 'prices', label: '定价', children: <PriceTab /> },
        { key: 'benefits', label: '权益', children: <BenefitTab /> },
      ]}
    />
  );
};

export default MembershipConfigPage;
