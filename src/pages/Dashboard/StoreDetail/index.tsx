import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import LineChart from '@/components/ChartComponents/BaseChart/LineChart';
import PieChart from '@/components/ChartComponents/BaseChart/PieChart';
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

interface DeviceStats {
  total: number;
  activated: number;
  unactivated: number;
  bound: number;
  unbound: number;
  unused: number;
}

const StoreDetail: React.FC = () => {
  const { storeId: urlStoreId } = useParams<{ storeId: string }>();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [deviceStatsLoading, setDeviceStatsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    total: 0,
    activated: 0,
    unactivated: 0,
    bound: 0,
    unbound: 0,
    unused: 0,
  });
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

  // 获取设备状态统计数据
  const fetchDeviceStats = async () => {
    if (!currentStoreId) return;

    setDeviceStatsLoading(true);
    try {
      const [
        allRes,
        unactivatedRes,
        activatedRes,
        boundRes,
        unboundRes,
        unusedRes,
      ] = await Promise.all([
        // 设备总数
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          page: 1,
          limit: 1,
        }),
        // 未安装设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          report_status: 'unreported',
          page: 1,
          limit: 1,
        }),
        // 已安装设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          report_status: 'reported',
          page: 1,
          limit: 1,
        }),
        // 已安装已绑定设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          status: 'bound',
          report_status: 'reported',
          page: 1,
          limit: 1,
        }),
        // 已安装未绑定设备
        DeviceAPI.getDeviceList({
          store_id: Number(currentStoreId),
          status: 'init',
          report_status: 'reported',
          page: 1,
          limit: 1,
        }),
        // 失效设备
        DeviceAPI.getUnusedDeviceList({
          store_id: String(currentStoreId),
          page: 1,
          limit: 1,
        }),
      ]);

      const stats = {
        total: allRes.data.meta.total_count,
        unactivated: unactivatedRes.data.meta.total_count,
        activated: activatedRes.data.meta.total_count,
        bound: boundRes.data.meta.total_count,
        unbound: unboundRes.data.meta.total_count,
        unused: unusedRes.data.meta.total_count,
      };

      setDeviceStats(stats);
    } catch (error) {
      console.error('获取设备统计数据失败:', error);
    } finally {
      setDeviceStatsLoading(false);
    }
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
    // 初始化表单值 - 只有当有storeId时才设置
    if (currentStoreId) {
      // 延迟设置表单值，等待StoreSelect组件加载完数据
      setTimeout(() => {
        form.setFieldsValue({
          storeId: currentStoreId,
          dateRange: dateRange,
        });
      }, 500);

      // 有storeId时才获取数据
      fetchAllWeeklyData();
      fetchDeviceStats();
    }
  }, []);

  useEffect(() => {
    // 当门店ID变化时，更新表单值
    if (currentStoreId) {
      // 延迟设置表单值，确保StoreSelect有足够时间加载选项
      setTimeout(() => {
        form.setFieldsValue({
          storeId: currentStoreId,
          dateRange: dateRange,
        });
      }, 500);
    }
  }, [currentStoreId]);

  useEffect(() => {
    // 当门店或时间范围变化时重新获取数据
    if (currentStoreId) {
      fetchAllWeeklyData();
      fetchDeviceStats();
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

  // 准备主饼图数据 - 设备安装状态分布
  const mainPieChartData = [
    {
      type: '已安装',
      value: deviceStats.activated,
      color: '#52c41a',
    },
    {
      type: '未安装',
      value: deviceStats.unactivated,
      color: '#ff4d4f',
    },
  ].filter((item) => item.value > 0);

  // 准备子饼图数据 - 已安装设备绑定状态
  const subPieChartData = [
    {
      type: '已绑定',
      value: deviceStats.bound,
      color: '#389e0d',
    },
    {
      type: '未绑定',
      value: deviceStats.unbound,
      color: '#faad14',
    },
  ].filter((item) => item.value > 0);

  // 准备失效设备饼图数据 - 已安装设备中的失效设备分布
  const unusedPieChartData = [
    {
      type: '正常使用',
      value: Math.max(0, deviceStats.activated - deviceStats.unused),
      color: '#52c41a',
    },
    {
      type: '失效设备',
      value: deviceStats.unused,
      color: '#ff4d4f',
    },
  ].filter((item) => item.value > 0);

  return (
    <PageContainer>
      <Card style={{ marginBottom: '24px' }}>
        <Form form={form} layout="inline" onFinish={handleFormSubmit}>
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

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card title="设备安装状态">
            {deviceStatsLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                }}
              >
                <Spin size="large" />
              </div>
            ) : mainPieChartData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <PieChart data={mainPieChartData} />
              </div>
            ) : (
              <Empty description="暂无设备数据" style={{ height: '300px' }} />
            )}

            {/* 设备总数统计 */}
            <div
              style={{
                marginTop: '8px',
                textAlign: 'center',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                }}
              >
                {deviceStats.total}
              </div>
              <div style={{ color: '#666', fontSize: '12px' }}>设备总数</div>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="已安装设备绑定状态">
            {deviceStatsLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                }}
              >
                <Spin size="large" />
              </div>
            ) : subPieChartData.length > 0 && deviceStats.activated > 0 ? (
              <div style={{ height: '300px' }}>
                <PieChart data={subPieChartData} />
              </div>
            ) : (
              <Empty description="暂无已安装设备" style={{ height: '300px' }} />
            )}

            {/* 绑定状态汇总 */}
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                background: '#f6ffed',
                borderRadius: '6px',
              }}
            >
              <Row gutter={8}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#389e0d',
                      }}
                    >
                      {deviceStats.bound}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      已绑定
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#faad14',
                      }}
                    >
                      {deviceStats.unbound}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      未绑定
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="已安装设备失效情况">
            {deviceStatsLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                }}
              >
                <Spin size="large" />
              </div>
            ) : unusedPieChartData.length > 0 && deviceStats.activated > 0 ? (
              <div style={{ height: '300px' }}>
                <PieChart data={unusedPieChartData} />
              </div>
            ) : (
              <Empty description="暂无已安装设备" style={{ height: '300px' }} />
            )}

            {/* 失效设备详情 */}
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                background: '#fff2e8',
                border: '1px solid #ffbb96',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#d46b08', fontWeight: 'bold' }}>
                  失效设备占比
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#d4380d',
                  }}
                >
                  {deviceStats.activated > 0
                    ? (
                        (deviceStats.unused / deviceStats.activated) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div
                style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}
              >
                {deviceStats.unused}台 / {deviceStats.activated}台已安装设备
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 设备数据趋势图 - 移到单独一行 */}
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
