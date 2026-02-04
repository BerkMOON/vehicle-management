import EquipmentAPI from '@/services/equipment/EquipmentCotroller';
import { GetDeviceVersion } from '@/services/equipment/typings';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  message,
  Result,
  Space,
  Spin,
} from 'antd';
import React, { useState } from 'react';

const DeviceVersionQuery: React.FC = () => {
  const { isLogin, equipmentManage } = useAccess();
  const [form] = Form.useForm<{ sn: string }>();
  const [loading, setLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<GetDeviceVersion | null>(null);
  const [lastQueriedSn, setLastQueriedSn] = useState('');

  const handleSubmit = async ({ sn }: { sn: string }) => {
    const trimmedSn = sn.trim();
    setLoading(true);
    try {
      const { data } = await EquipmentAPI.getDeviceVersion({ sn: trimmedSn });
      setVersionInfo(data);
      setLastQueriedSn(trimmedSn);
      if (!data || Object.values(data).every((value) => !value)) {
        message.warning('未查询到设备版本信息');
      }
    } catch (error) {
      message.error('查询失败，请稍后重试');
      setVersionInfo(null);
      setLastQueriedSn(trimmedSn);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setVersionInfo(null);
    setLastQueriedSn('');
  };

  const renderResult = () => {
    if (!versionInfo) {
      return (
        <Empty
          description={
            lastQueriedSn ? '未查询到相关记录' : '请输入设备SN并点击查询'
          }
        />
      );
    }

    const displayValue = (value?: string) => value || '-';

    return (
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="设备SN">
          {displayValue(versionInfo.sn)}
        </Descriptions.Item>
        <Descriptions.Item label="设备ID">
          {displayValue(versionInfo.device_id)}
        </Descriptions.Item>
        <Descriptions.Item label="当前版本">
          {displayValue(versionInfo.cur_version)}
        </Descriptions.Item>
        <Descriptions.Item label="算法版本">
          {displayValue(versionInfo.alg_version)}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {displayValue(versionInfo.create_time)}
        </Descriptions.Item>
        <Descriptions.Item label="修改时间">
          {displayValue(versionInfo.modify_time)}
        </Descriptions.Item>
      </Descriptions>
    );
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!equipmentManage) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <PageContainer title="设备版本查询">
      <Card>
        <Form layout="inline" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="sn"
            label="设备SN"
            rules={[{ required: true, message: '请输入设备SN' }]}
          >
            <Input placeholder="请输入设备SN" allowClear maxLength={50} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="查询结果" style={{ marginTop: 24 }}>
        <Spin spinning={loading}>{renderResult()}</Spin>
      </Card>
    </PageContainer>
  );
};

export default DeviceVersionQuery;
