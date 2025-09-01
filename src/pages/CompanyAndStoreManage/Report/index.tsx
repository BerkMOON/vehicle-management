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

  // 获取默认时间范围（上周）
  const getDefaultDateRange = () => {
    const startDate = dayjs()
      .startOf('isoWeek')
      .subtract(7, 'day')
      .format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs()
      .endOf('isoWeek')
      .subtract(7, 'day')
      .format('YYYY-MM-DD HH:mm:ss');
    return { startDate, endDate };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const fetchDeviceStats = async (params: any = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dateRange, ...apiParams } = params;
    setLoading(true);
    try {
      const [reportedDevices, reportedUnboundDevices] = await Promise.all([
        DeviceAPI.getDeviceList({
          ...apiParams,
          limit: 1,
          page: 1,
          report_status: 'reported',
          onset_end_time: dateRange?.endDate,
        }),
        DeviceAPI.getDeviceList({
          ...apiParams,
          limit: 100,
          page: 1,
          status: 'init',
          report_status: 'reported',
          onset_end_time: dateRange?.endDate,
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
    const { dateRange, ...apiParams } = params;
    const weekParams = {
      ...apiParams,
      onset_start_time: dateRange?.startDate,
      onset_end_time: dateRange?.endDate,
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
      const { dateRange, ...apiParams } = params;
      const { data } = await AuditAPI.getBTaskList({
        page: 1,
        limit: 100,
        store_id: apiParams.store_id || 0,
        start_time: dateRange.startDate,
        end_time: dateRange.endDate,
      });

      setWeeklyTasks(data.task_list);
    } catch (error) {
      message.error('获取本周工单数据失败');
    }
  };

  const fetchLossData = async (params: any) => {
    const { dateRange, ...apiParams } = params;
    const { data } = await DeviceAPI.getLossNotifications({
      ...apiParams,
      start_time: dateRange.startDate,
      end_time: dateRange.endDate,
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
    // 更新时间范围
    let newDateRange: any = {};
    if (values.dateRange && values.dateRange.length === 2) {
      newDateRange = {
        startDate: values.dateRange[0]
          .startOf('day')
          .format('YYYY-MM-DD HH:mm:ss'),
        endDate: values.dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      };
      setDateRange(newDateRange);
    }

    // 从请求参数中移除 dateRange，只保留API需要的参数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dateRange, ...apiParams } = values;

    // 使用 setTimeout 确保 dateRange 状态已更新
    setTimeout(() => {
      fetchData({
        dateRange: newDateRange,
        ...apiParams,
      });
    }, 0);
  };

  const handleReset = () => {
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    form.resetFields();
    setTimeout(() => {
      fetchData({ dateRange: getDefaultDateRange() });
    }, 0);
  };

  useEffect(() => {
    fetchData({ dateRange: getDefaultDateRange() });
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
            {` 您好，贵店在（${dayjs(dateRange.startDate).format(
              'M月D日',
            )}-${dayjs(dateRange.endDate).format(
              'M月D日',
            )}）新增安装易达安设备${weeklyDeviceStats.reported}台，累计安装${
              deviceStats.reported
            }台，其中已安装未绑定${deviceStats.reportedUnbound}台；`}
          </div>
          <div>
            {` 易达安在此期间推送事故线索${weeklyTasks.length}条，认领${
              weeklyTasks.filter((task) => task.status.name !== '待认领').length
            }条；`}
          </div>
          <div>{`易达安在此期间推送流失提醒${lossList.length}台设备。`}</div>
          <div>以上详情请登录易达安售后小程序查看。</div>
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default Report;
