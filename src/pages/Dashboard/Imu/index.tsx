import { InboxOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  Upload,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { ImuRecord, parseCsvToImuRecords } from './parseCsv';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Dragger } = Upload;

async function fetchImuData(
  source: ImuRecord[],
  params: {
    deviceId: string;
    startTime: string;
    endTime: string;
  },
): Promise<ImuRecord[]> {
  const { deviceId, startTime, endTime } = params;
  const start = dayjs(startTime, 'YYYY-MM-DD HH:mm:ss');
  const end = dayjs(endTime, 'YYYY-MM-DD HH:mm:ss');

  return source.filter((item) => {
    if (item.device_id !== deviceId) return false;
    // 存储的 ts 视为 UTC，这里统一转换为东八区本地时间再做比较
    const tLocal = dayjs(item.ts).add(8, 'hour');
    return tLocal.isAfter(start) || tLocal.isSame(start)
      ? tLocal.isBefore(end) || tLocal.isSame(end)
      : false;
  });
}

const ImuDashboard: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ImuRecord[]>([]);
  /** 用户上传的 OSS 数据（CSV 解析结果），所有展示数据均来自此处 */
  const [uploadedData, setUploadedData] = useState<ImuRecord[] | null>(null);

  const dataSource = uploadedData ?? [];

  const deviceOptions = useMemo(() => {
    const ids = Array.from(new Set(dataSource.map((r) => r.device_id))).filter(
      Boolean,
    );
    if (ids.length === 0) return [{ label: '请先上传 CSV', value: '' }];
    return ids.map((id) => ({ label: id, value: id }));
  }, [dataSource]);

  const loadData = async () => {
    if (!deviceId || !dateRange) return;
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const res = await fetchImuData(dataSource, {
        deviceId,
        startTime: start.format('YYYY-MM-DD HH:mm:ss'),
        endTime: end.format('YYYY-MM-DD HH:mm:ss'),
      });
      setData(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, dateRange, uploadedData]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'ts',
      key: 'ts',
      render: (value: string) =>
        // 展示为东八区时间
        dayjs(value).add(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: 'acc_x',
      dataIndex: 'acc_x',
      key: 'acc_x',
    },
    {
      title: 'acc_y',
      dataIndex: 'acc_y',
      key: 'acc_y',
    },
    {
      title: 'acc_z',
      dataIndex: 'acc_z',
      key: 'acc_z',
    },
    {
      title: 'gyro_x',
      dataIndex: 'gyro_x',
      key: 'gyro_x',
    },
    {
      title: 'gyro_y',
      dataIndex: 'gyro_y',
      key: 'gyro_y',
    },
    {
      title: 'gyro_z',
      dataIndex: 'gyro_z',
      key: 'gyro_z',
    },
  ];

  // 按秒聚合：同一秒内多条数据取平均值，X 轴为 HH:mm:ss
  const aggregatedBySecond = useMemo(() => {
    const bucket: Record<
      string,
      {
        acc_x: number;
        acc_y: number;
        acc_z: number;
        gyro_x: number;
        gyro_y: number;
        gyro_z: number;
        count: number;
      }
    > = {};

    data.forEach((item) => {
      // 先转换为东八区本地时间，再按秒聚合
      const local = dayjs(item.ts).add(8, 'hour');
      const key = local.format('HH:mm:ss');
      if (!bucket[key]) {
        bucket[key] = {
          acc_x: 0,
          acc_y: 0,
          acc_z: 0,
          gyro_x: 0,
          gyro_y: 0,
          gyro_z: 0,
          count: 0,
        };
      }
      const b = bucket[key];
      b.acc_x += item.acc_x;
      b.acc_y += item.acc_y;
      b.acc_z += item.acc_z;
      b.gyro_x += item.gyro_x;
      b.gyro_y += item.gyro_y;
      b.gyro_z += item.gyro_z;
      b.count += 1;
    });

    return Object.entries(bucket)
      .sort(([t1], [t2]) => (t1 < t2 ? -1 : t1 > t2 ? 1 : 0))
      .map(([time, b]) => ({
        time,
        acc_x: b.acc_x / b.count,
        acc_y: b.acc_y / b.count,
        acc_z: b.acc_z / b.count,
        gyro_x: b.gyro_x / b.count,
        gyro_y: b.gyro_y / b.count,
        gyro_z: b.gyro_z / b.count,
      }));
  }, [data]);

  return (
    <PageContainer
      header={{
        title: 'IMU 数据看板',
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="数据来源">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              请上传从 OSS 下载的 IMU CSV
              文件，页面将本地读取并展示，无需走接口。
            </Text>
            {uploadedData === null ? (
              <Dragger
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = (e.target?.result as string) ?? '';
                    try {
                      const records = parseCsvToImuRecords(text);
                      setUploadedData(records);
                      if (records.length > 0) {
                        const firstId = records[0].device_id;
                        setDeviceId((prev) =>
                          records.some((r) => r.device_id === prev)
                            ? prev
                            : firstId,
                        );
                        const times = records.map((r) => dayjs(r.ts));
                        const minT = times.reduce((a, b) =>
                          a.isBefore(b) ? a : b,
                        );
                        const maxT = times.reduce((a, b) =>
                          a.isAfter(b) ? a : b,
                        );
                        setDateRange([
                          minT.add(8, 'hour').startOf('day'),
                          maxT.add(8, 'hour').endOf('day'),
                        ]);
                      }
                    } catch (err) {
                      console.error('CSV 解析失败', err);
                    }
                  };
                  reader.readAsText(file, 'UTF-8');
                  return false; // 阻止自动上传
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽 CSV 文件到此处</p>
                <p className="ant-upload-hint">
                  仅支持从 OSS 导出的 IMU CSV（表头含 ts, device_id, acc_*,
                  gyro_*）
                </p>
              </Dragger>
            ) : (
              <Space>
                <Text>
                  当前使用上传文件（{uploadedData.length.toLocaleString()} 条）
                </Text>
                <a onClick={() => setUploadedData(null)}>清除上传</a>
              </Space>
            )}
          </Space>
        </Card>

        <Card>
          <Space wrap>
            <Text strong>设备：</Text>
            <Select
              style={{ width: 260 }}
              value={deviceId}
              onChange={setDeviceId}
              options={deviceOptions}
            />
            <Text strong>时间范围：</Text>
            <RangePicker
              showTime
              value={dateRange}
              onChange={(val) => setDateRange(val as [Dayjs, Dayjs] | null)}
              format="YYYY-MM-DD HH:mm:ss"
            />
            <a onClick={loadData}>查询</a>
          </Space>
        </Card>

        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Title level={5}>加速度（acc）随时间变化</Title>
                <Plot
                  data={[
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.acc_x),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_x',
                    },
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.acc_y),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_y',
                    },
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.acc_z),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_z',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    height: 320,
                    margin: { l: 50, r: 10, t: 20, b: 40 },
                    xaxis: {
                      title: { text: '时间（秒）' },
                      showgrid: false,
                    },
                    yaxis: {
                      title: { text: '加速度' },
                    },
                    legend: { orientation: 'h' },
                  }}
                  config={{
                    responsive: true,
                    scrollZoom: true,
                    displaylogo: false,
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Title level={5}>角速度（gyro）随时间变化</Title>
                <Plot
                  data={[
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.gyro_x),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_x',
                    },
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.gyro_y),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_y',
                    },
                    {
                      x: aggregatedBySecond.map((d) => d.time),
                      y: aggregatedBySecond.map((d) => d.gyro_z),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_z',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    height: 320,
                    margin: { l: 50, r: 10, t: 20, b: 40 },
                    xaxis: {
                      title: { text: '时间（秒）' },
                      showgrid: false,
                    },
                    yaxis: {
                      title: { text: '角速度' },
                    },
                    legend: { orientation: 'h' },
                  }}
                  config={{
                    responsive: true,
                    scrollZoom: true,
                    displaylogo: false,
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <Title level={5}>原始数据明细</Title>
                <Table<ImuRecord>
                  rowKey={(record) => `${record.ts}-${record.device_id}`}
                  dataSource={data}
                  columns={columns}
                  size="small"
                  scroll={{ x: 'max-content', y: 400 }}
                  pagination={{ pageSize: 50, showSizeChanger: false }}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Space>
    </PageContainer>
  );
};

export default ImuDashboard;
