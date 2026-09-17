import { SuccessCode } from '@/constants';
import { MembershipAPI } from '@/services/membership/MembershipController';
import {
  getMembershipErrorMessage,
  MembershipBizCode,
} from '@/services/membership/error';
import type { UserMembershipStatus } from '@/services/membership/typings';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Result,
  Space,
  Table,
  Tag,
} from 'antd';
import React, { useState } from 'react';
import { renderEntitlementStatusTag } from '../statusTags';
import { renderDateTime } from '../utils';

const pageContentStyle = { padding: '0 40px' };

const UserMembershipPage: React.FC = () => {
  const { isLogin, membershipManage } = useAccess();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<UserMembershipStatus | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    const values = await searchForm.validateFields();
    const userId = values.user_id ? Number(values.user_id) : undefined;
    const userPhone = (values.user_phone || '').trim() || undefined;
    if (!userId && !userPhone) {
      message.warning('请填写 user_id 或完整手机号');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      // 有有效 user_id 时只按 ID 查，不会再用手机号兜底；旧参数 phone 已失效
      const res = await MembershipAPI.getUserMembershipStatus({
        user_id: userId && userId > 0 ? userId : undefined,
        user_phone: userId && userId > 0 ? undefined : userPhone,
      });
      const code = res?.response_status?.code;
      if (code === MembershipBizCode.SUCCESS || code === SuccessCode.SUCCESS) {
        const data = res.data ?? null;
        if (data) {
          data.entitlements = data.entitlements ?? [];
        }
        setStatus(data);
        return;
      }
      setStatus(null);
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
    <PageContainer title="用户会员查询">
      <div style={pageContentStyle}>
        <Card>
          <Form form={searchForm} layout="inline" onFinish={search}>
            <Form.Item name="user_id" label="用户 ID">
              <Input placeholder="user_id" style={{ width: 194 }} />
            </Form.Item>
            <Form.Item name="user_phone" label="手机号">
              <Input placeholder="完整明文手机号" style={{ width: 194 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  查询
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
              <Descriptions.Item label="手机号">
                {status.phone}
              </Descriptions.Item>
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
              dataSource={status.entitlements ?? []}
              pagination={false}
              columns={[
                { title: '档位', dataIndex: 'product_code' },
                {
                  title: '生效起',
                  dataIndex: 'valid_from',
                  render: renderDateTime,
                },
                {
                  title: '生效止',
                  dataIndex: 'valid_until',
                  render: renderDateTime,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: renderEntitlementStatusTag,
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
            message={
              searched
                ? '未查询到用户会员信息'
                : '输入 user_id 或完整手机号查询（筛选用明文；有 user_id 时不以手机号兜底）'
            }
          />
        )}
      </div>
    </PageContainer>
  );
};

export default UserMembershipPage;
