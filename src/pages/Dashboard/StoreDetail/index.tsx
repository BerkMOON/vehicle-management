import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import LineChart from '@/components/ChartComponents/BaseChart/LineChart';
import { SuccessCode } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import { BusinessTaskParams } from '@/services/audit/typings.d';
import { DeviceAPI } from '@/services/device/DeviceController';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Card, Col, DatePicker, Empty, Form, Row, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';

const { RangePicker } = DatePicker;

interface WeeklyData {
  week: string;
  deviceActivated: number;
  deviceBound: number;
  taskCount: number;
}

const StoreDetail: React.FC = () => {
  const { storeId: urlStoreId } = useParams<{ storeId: string }>();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string>(
    urlStoreId || '',
  );
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(4, 'weeks').startOf('week'),
    dayjs().endOf('week'),
  ]);

  // 生成周数据
  const generateWeeks = (startDate: Dayjs, endDate: Dayjs): string[] => {
    const weeks: string[] = [];
    let current = startDate.startOf('week');

    while (current.isBefore(endDate) || current.isSame(endDate, 'week')) {
      weeks.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'week');
    }

    return weeks;
  };

  // 获取设备周数据
  const fetchWeeklyDeviceData = async (
    week: string,
  ): Promise<Partial<WeeklyData>> => {
    const weekStart = dayjs(week).startOf('week');
    const weekEnd = dayjs(week).endOf('week');

    try {
      const [activatedRes, boundRes, taskRes] = await Promise.all([
        // 已激活设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          report_status: 'reported',
          onset_start_time: weekStart.format('YYYY-MM-DD HH:mm:ss'),
          onset_end_time: weekEnd.format('YYYY-MM-DD HH:mm:ss'),
          page: 1,
          limit: 1,
        }),
        // 已绑定设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          status: 'bound',
          report_status: 'reported',
          onset_start_time: weekStart.format('YYYY-MM-DD HH:mm:ss'),
          onset_end_time: weekEnd.format('YYYY-MM-DD HH:mm:ss'),
          page: 1,
          limit: 1,
        }),
        // 工单数据
        AuditAPI.getBTaskList({
          page: 1,
          limit: 1,
          status: 'all',
          store_id: Number(currentStoreId),
          start_time: weekStart.format('YYYY-MM-DD HH:mm:ss'),
          end_time: weekEnd.format('YYYY-MM-DD HH:mm:ss'),
        } as BusinessTaskParams),
      ]);

      const taskCount =
        taskRes.response_status.code === SuccessCode.SUCCESS
          ? taskRes.data.meta.total_count
          : 0;

      return {
        deviceActivated: activatedRes.data.meta.total_count,
        deviceBound: boundRes.data.meta.total_count,
        taskCount,
      };
    } catch (error) {
      console.error(`获取第${week}周设备数据失败:`, error);
      return {};
    }
  };

  // 处理表单提交
  const handleFormSubmit = (values: any) => {
    setCurrentStoreId(values.storeId);
    setDateRange(values.dateRange);

    // 更新URL
    history.replace(`/dashboard/store/${values.storeId}`);
  };

  // 获取所有周数据
  const fetchAllWeeklyData = async () => {
    if (!currentStoreId) return;

    setLoading(true);
    try {
      const weeks = generateWeeks(dateRange[0], dateRange[1]);
      const weeklyResults: WeeklyData[] = [];

      for (const week of weeks) {
        const weekData = await fetchWeeklyDeviceData(week);
        weeklyResults.push({
          week: `${dayjs(week).format('MM/DD')} - ${dayjs(week)
            .add(6, 'day')
            .format('MM/DD')}`,
          ...weekData,
        } as WeeklyData);
      }

      setWeeklyData(weeklyResults);
    } catch (error) {
      console.error('获取门店周数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    const initialValues = {
      storeId: currentStoreId,
      dateRange: [
        dayjs().subtract(4, 'weeks').startOf('week'),
        dayjs().endOf('week'),
      ],
    };
    form.setFieldsValue(initialValues);
    fetchAllWeeklyData();
  };

  useEffect(() => {
    // 初始化表单值
    form.setFieldsValue({
      storeId: currentStoreId,
      dateRange: dateRange,
    });

    fetchAllWeeklyData();
  }, []);

  useEffect(() => {
    // 当门店或时间范围变化时重新获取数据
    if (currentStoreId) {
      fetchAllWeeklyData();
    }
  }, [currentStoreId, dateRange]);

  // 准备图表数据 - 将数据转换为适合折线图的格式
  const chartData = weeklyData.flatMap((item) => [
    {
      week: item.week,
      type: '已安装',
      value: item.deviceActivated,
    },
    {
      week: item.week,
      type: '已绑定',
      value: item.deviceBound,
    },
    {
      week: item.week,
      type: '工单数',
      value: item.taskCount,
    },
  ]);

  return (
    <PageContainer>
      <Card style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleFormSubmit}
          initialValues={{
            storeId: currentStoreId,
            dateRange: dateRange,
          }}
        >
          <Form.Item
            label="选择门店"
            name="storeId"
            rules={[{ required: true, message: '请选择门店' }]}
          >
            <StoreSelect style={{ width: 200 }} />
          </Form.Item>

          <Form.Item
            label="时间范围"
            name="dateRange"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker
              picker="week"
              placeholder={['开始周', '结束周']}
              format="YYYY年第WW周"
              style={{ width: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              查询数据
            </Button>
          </Form.Item>

          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="门店设备数据趋势" style={{ marginBottom: '24px' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
            }}
          >
            <Spin size="large" />
          </div>
        ) : chartData.length > 0 ? (
          <div style={{ height: '400px' }}>
            <LineChart
              data={chartData}
              xField="week"
              yField="value"
              seriesField="type"
            />
          </div>
        ) : (
          <Empty description="暂无数据" style={{ height: '400px' }} />
        )}
      </Card>

      <Row gutter={16}>
        {weeklyData.map((item, index) => (
          <Col
            xs={24}
            sm={12}
            md={8}
            lg={6}
            key={index}
            style={{ marginBottom: '16px' }}
          >
            <Card size="small" title={item.week}>
              <Row gutter={8}>
                <Col span={8}>
                  <div>
                    已安装:{' '}
                    <span style={{ color: '#52c41a' }}>
                      {item.deviceActivated}
                    </span>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    已绑定:{' '}
                    <span style={{ color: '#1890ff' }}>{item.deviceBound}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    工单数:{' '}
                    <span style={{ color: '#f5222d' }}>{item.taskCount}</span>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default StoreDetail;
