import { SuccessCode } from '@/constants';
import { MembershipAPI } from '@/services/membership/MembershipController';
import { ENTITLEMENT_STATUS } from '@/services/membership/constants';
import type { UserMembershipStatus } from '@/services/membership/typings';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import React, { useState } from 'react';
import { postMembershipAction } from '../utils';

const UserMembershipPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const [searchForm] = Form.useForm();
  const [grantForm] = Form.useForm();
  const [revokeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<UserMembershipStatus | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [skuOptions, setSkuOptions] = useState<
    { label: string; value: string; product_code: string }[]
  >([]);
  const selectedProduct = Form.useWatch('product_code', grantForm);

  const loadCatalog = async () => {
    const [products, skus] = await Promise.all([
      MembershipAPI.listProducts({ page: 1, limit: 100 }),
      MembershipAPI.listSkus({ page: 1, limit: 200 }),
    ]);
    if (products?.response_status?.code === SuccessCode.SUCCESS) {
      setProductOptions(
        (products.data?.list ?? []).map((p) => ({
          label: `${p.product_name} (${p.product_code})`,
          value: p.product_code,
        })),
      );
    }
    if (skus?.response_status?.code === SuccessCode.SUCCESS) {
      setSkuOptions(
        (skus.data?.list ?? []).map((s) => ({
          label: `${s.sku_name} (${s.sku_code})`,
          value: s.sku_code,
          product_code: s.product_code,
        })),
      );
    }
  };

  const search = async () => {
    const values = await searchForm.validateFields();
    if (!values.user_id && !values.phone) {
      message.warning('请填写 user_id 或手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await MembershipAPI.getUserMembershipStatus({
        user_id: values.user_id ? Number(values.user_id) : undefined,
        phone: values.phone || undefined,
      });
      if (res?.response_status?.code === SuccessCode.SUCCESS) {
        setStatus(res.data);
      } else {
        message.error(res?.response_status?.msg || '查询失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGrant = async () => {
    const values = await grantForm.validateFields();
    await postMembershipAction(
      () =>
        MembershipAPI.grantMembership({
          user_id: values.user_id ? Number(values.user_id) : undefined,
          phone: values.phone || undefined,
          product_code: values.product_code,
          sku_code: values.sku_code,
          reason: values.reason,
        }),
      '赠送成功',
    );
    setGrantOpen(false);
    search();
  };

  const submitRevoke = async () => {
    const values = await revokeForm.validateFields();
    Modal.confirm({
      title: '确认撤销该用户全部有效权益？',
      content: '此操作不可自动恢复，请确认已与用户沟通。',
      onOk: async () => {
        await postMembershipAction(
          () =>
            MembershipAPI.revokeMembership({
              user_id: values.user_id ? Number(values.user_id) : undefined,
              phone: values.phone || undefined,
              reason: values.reason,
            }),
          '权益已撤销',
        );
        setRevokeOpen(false);
        search();
      },
    });
  };

  if (!isLogin) return <Navigate to="/login" />;
  if (!membershipManage()) {
    return <div style={{ padding: 48, textAlign: 'center' }}>无权限访问</div>;
  }

  return (
    <PageContainer title="用户会员查询">
      <Card>
        <Form form={searchForm} layout="inline" onFinish={search}>
          <Form.Item name="user_id" label="用户 ID">
            <Input placeholder="user_id" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="完整手机号" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                查询
              </Button>
              <Button
                onClick={async () => {
                  grantForm.resetFields();
                  setGrantOpen(true);
                  await loadCatalog();
                }}
              >
                人工赠送
              </Button>
              <Button
                danger
                onClick={() => {
                  revokeForm.resetFields();
                  if (status) {
                    revokeForm.setFieldsValue({
                      user_id: status.user_id,
                      phone: status.phone,
                    });
                  }
                  setRevokeOpen(true);
                }}
              >
                撤销权益
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {status && (
        <Card style={{ marginTop: 16 }} title="会员状态">
          <Descriptions column={3}>
            <Descriptions.Item label="用户 ID">
              {status.user_id}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">{status.phone}</Descriptions.Item>
            <Descriptions.Item label="当前档位">
              {status.active_level ? (
                <Tag color="green">{status.active_level}</Tag>
              ) : (
                <Tag>无有效会员</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
          <Table
            style={{ marginTop: 16 }}
            rowKey="id"
            size="small"
            dataSource={status.entitlements}
            pagination={false}
            columns={[
              { title: '档位', dataIndex: 'product_code' },
              { title: '生效起', dataIndex: 'valid_from' },
              { title: '生效止', dataIndex: 'valid_until' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v: number) => ENTITLEMENT_STATUS[v] ?? v,
              },
            ]}
          />
        </Card>
      )}

      {!status && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="输入 user_id 或手机号查询用户会员状态"
        />
      )}

      <Modal
        title="人工赠送会员"
        open={grantOpen}
        onCancel={() => setGrantOpen(false)}
        onOk={submitGrant}
        destroyOnClose
      >
        <Form form={grantForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="user_id" label="用户 ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="与 user_id 二选一" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="product_code"
            label="商品"
            rules={[{ required: true }]}
          >
            <Select
              options={productOptions}
              onChange={() => grantForm.setFieldValue('sku_code', undefined)}
            />
          </Form.Item>
          <Form.Item name="sku_code" label="SKU" rules={[{ required: true }]}>
            <Select
              options={skuOptions.filter(
                (s) => !selectedProduct || s.product_code === selectedProduct,
              )}
            />
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={2} placeholder="客诉补偿等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="撤销用户权益"
        open={revokeOpen}
        onCancel={() => setRevokeOpen(false)}
        onOk={submitRevoke}
        destroyOnClose
      >
        <Form form={revokeForm} layout="vertical">
          <Form.Item name="user_id" label="用户 ID">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="原因" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserMembershipPage;
