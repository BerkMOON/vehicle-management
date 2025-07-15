import { AuditAPI } from '@/services/audit/AuditController';
import { AuditTaskItem } from '@/services/audit/typings';
import { DeviceAPI } from '@/services/device/DeviceController';
import { DeviceList, LossInfo } from '@/services/device/typings';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Card, Form, message, Row, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import React, { useEffect, useState } from 'react';
import { searchForm } from './searchForm';

dayjs.extend(isoWeek);

interface DeviceStats {
  total?: number;
  reported?: number;
  reportedUnbound?: number;
  list?: DeviceList[];
}

const Report: React.FC = () => {
  const { isLogin } = useAccess();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    total: 0,
    reported: 0,
    reportedUnbound: 0,
    list: [],
  });
  const [weeklyDeviceStats, setWeeklyDeviceStats] = useState<DeviceStats>({
    reported: 0,
  });
  const [weeklyTasks, setWeeklyTasks] = useState<AuditTaskItem[]>([]);
  const [lossList, setLossList] = useState<LossInfo[]>([]);

  const startDate = dayjs()
    .startOf('isoWeek')
    .subtract(7, 'day')
    .format('YYYY-MM-DD HH:mm:ss');
  const endDate = dayjs()
    .endOf('isoWeek')
    .subtract(7, 'day')
    .format('YYYY-MM-DD HH:mm:ss');

  const fetchDeviceStats = async (params: any = {}) => {
    setLoading(true);
    try {
      const [reportedDevices, reportedUnboundDevices] = await Promise.all([
        DeviceAPI.getDeviceList({
          ...params,
          limit: 1,
          page: 1,
          report_status: 'reported',
        }),
        DeviceAPI.getDeviceList({
          ...params,
          limit: 100,
          page: 1,
          status: 'init',
          report_status: 'reported',
        }),
      ]);

      setDeviceStats({
        reported: reportedDevices.data.meta.total_count,
        reportedUnbound: reportedUnboundDevices.data.meta.total_count,
        list: reportedUnboundDevices.data.device_list,
      });
    } catch (error) {
      message.error('获取设备统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekDeviceStats = async (params: any = {}) => {
    const weekParams = {
      ...params,
      onset_start_time: startDate,
      onset_end_time: endDate,
    };
    setLoading(true);
    try {
      const [reportedDevices] = await Promise.all([
        DeviceAPI.getDeviceList({
          ...weekParams,
          limit: 1,
          page: 1,
          report_status: 'reported',
        }),
      ]);

      setWeeklyDeviceStats({
        reported: reportedDevices.data.meta.total_count,
      });
    } catch (error) {
      message.error('获取设备统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyTasks = async (params: any = {}) => {
    try {
      const { data } = await AuditAPI.getBTaskList({
        page: 1,
        limit: 100,
        store_id: params.store_id || 0,
        start_time: startDate,
        end_time: endDate,
      });

      setWeeklyTasks(data.task_list);
    } catch (error) {
      message.error('获取本周工单数据失败');
    }
  };

  const fetchLossData = async (params: any) => {
    const { data } = await DeviceAPI.getLossNotifications({
      ...params,
      start_time: startDate,
      end_time: endDate,
      limit: 100,
      page: 1,
    });
    setLossList(data.record_list);
  };

  const fetchData = (params: any) => {
    fetchDeviceStats(params);
    fetchWeeklyTasks(params);
    fetchWeekDeviceStats(params);
    fetchLossData(params);
  };

  const handleSubmit = (values: any) => {
    fetchData(values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchData({});
  };

  useEffect(() => {
    fetchData({});
  }, []);

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  return (
    <PageContainer title="门店周报汇总">
      <Form form={form} layout="inline" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>{searchForm}</Row>
        <div style={{ textAlign: 'right', width: '100%', marginTop: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>
      </Form>

      <Card title="设备情况汇总" style={{ marginTop: 24 }}>
        <Spin spinning={loading}>
          <div>
            {` 您好，贵店上周（${dayjs(startDate).format('M月D日')}-${dayjs(
              endDate,
            ).format('M月D日')}）新增安装易达安设备${
              weeklyDeviceStats.reported
            }台，累计安装${deviceStats.reported}台，其中已安装未绑定${
              deviceStats.reportedUnbound
            }台；`}
          </div>
          <div>
            {` 易达安上周推送事故线索${weeklyTasks.length}条，认领${
              weeklyTasks.filter((task) => task.status.name !== '待认领').length
            }条；`}
          </div>
          <div>{`易达安上周推送流失提醒${lossList.length}台设备。`}</div>
          <div>以上详情请登录易达安售后小程序查看。</div>
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default Report;
