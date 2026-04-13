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
  Switch,
  Table,
  Typography,
  Upload,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { ImuRecord, parseCsvToImuRecords } from './parseCsv';
import { preprocessImuRecords } from './preprocessImu';

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

  const filtered = source.filter((item) => {
    const t = dayjs(item.ts);
    if (!t.isValid()) return false;
    // 若 CSV 中没有 device_id 列或 device_id 为空，视为单设备文件，不按设备过滤
    if (deviceId && item.device_id && item.device_id !== deviceId) return false;
    return (
      (t.isAfter(start) || t.isSame(start)) &&
      (t.isBefore(end) || t.isSame(end))
    );
  });

  return filtered;
}

const ImuDashboard: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [enablePreprocess, setEnablePreprocess] = useState<boolean>(true);
  const [data1, setData1] = useState<ImuRecord[]>([]);
  const [data2, setData2] = useState<ImuRecord[]>([]);
  /** 文件1上传的 OSS 数据（CSV 解析结果，作为基准） */
  const [uploadedData1, setUploadedData1] = useState<ImuRecord[] | null>(null);
  /** 文件2上传的数据（可选，用于对比） */
  const [uploadedData2, setUploadedData2] = useState<ImuRecord[] | null>(null);

  const dataSource1 = uploadedData1 ?? [];
  const dataSource2 = uploadedData2 ?? [];
  const hasAnySource = dataSource1.length > 0 || dataSource2.length > 0;

  const allSource = useMemo(
    () => [...dataSource1, ...dataSource2],
    [dataSource1, dataSource2],
  );

  const deviceOptions = useMemo(() => {
    const ids = Array.from(new Set(allSource.map((r) => r.device_id))).filter(
      Boolean,
    );
    if (!allSource.length)
      return [{ label: '请先上传 CSV（可上传最多两个文件）', value: '' }];
    if (ids.length === 0)
      return [{ label: '单设备文件（无 device_id 列）', value: '' }];
    return ids.map((id) => ({ label: id, value: id }));
  }, [allSource]);

  const loadData = async () => {
    if (!dateRange) return;
    if (!hasAnySource) return;
    setLoading(true);
    try {
      const [start, end] = dateRange;
      const params = {
        deviceId,
        startTime: start.format('YYYY-MM-DD HH:mm:ss'),
        endTime: end.format('YYYY-MM-DD HH:mm:ss'),
      };
      const [res1, res2] = await Promise.all([
        dataSource1.length
          ? fetchImuData(dataSource1, params)
          : Promise.resolve([]),
        dataSource2.length
          ? fetchImuData(dataSource2, params)
          : Promise.resolve([]),
      ]);
      setData1(res1 || []);
      setData2(res2 || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, dateRange, uploadedData1, uploadedData2]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'ts',
      key: 'ts',
      render: (value: string) =>
        dayjs(value).isValid()
          ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
          : value,
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

  // 预处理：消除安装角度带来的重力偏移（数据量不足窗口大小时不处理）
  const displayData1 = useMemo(
    () => (enablePreprocess ? preprocessImuRecords(data1) : data1),
    [data1, enablePreprocess],
  );
  const displayData2 = useMemo(
    () => (enablePreprocess ? preprocessImuRecords(data2) : data2),
    [data2, enablePreprocess],
  );

  // 按时间聚合（保留毫秒）：同一时刻多条数据取平均值，X 轴为 HH:mm:ss.SSS
  const aggregatedBySecond1 = useMemo(() => {
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

    displayData1.forEach((item) => {
      const t = dayjs(item.ts);
      if (!t.isValid()) return;
      const key = t.format('HH:mm:ss.SSS');
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
  }, [displayData1]);

  const aggregatedBySecond2 = useMemo(() => {
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

    displayData2.forEach((item) => {
      const t = dayjs(item.ts);
      if (!t.isValid()) return;
      const key = t.format('HH:mm:ss.SSS');
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
  }, [displayData2]);

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
              文件，页面将本地读取并展示，无需走接口。支持同时上传两份文件，对比波峰波谷差异。
            </Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>文件1（基准）</Text>
              <Dragger
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = (e.target?.result as string) ?? '';
                    try {
                      const records = parseCsvToImuRecords(text);
                      setUploadedData1(records);
                      setUploadedData2((prev) => prev); // 保持文件2不变
                      if (records.length > 0) {
                        const firstId = records[0].device_id;
                        // 若 CSV 中不存在 device_id 列，则保持 deviceId 为空，视为单设备文件
                        if (records.some((r) => r.device_id)) {
                          setDeviceId((prev) =>
                            records.some((r) => r.device_id === prev)
                              ? prev
                              : firstId,
                          );
                        }
                        const times = records.map((r) => dayjs(r.ts));
                        const minT = times.reduce((a, b) =>
                          a.isBefore(b) ? a : b,
                        );
                        const maxT = times.reduce((a, b) =>
                          a.isAfter(b) ? a : b,
                        );

                        const start = records.some((r) => r.device_id)
                          ? minT.add(8, 'hour').startOf('day')
                          : minT.startOf('day');
                        const end = records.some((r) => r.device_id)
                          ? maxT.add(8, 'hour').endOf('day')
                          : maxT.endOf('day');
                        setDateRange([start, end]);
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
                <p className="ant-upload-text">
                  点击或拖拽 CSV 文件到此处（文件1）
                </p>
                <p className="ant-upload-hint">
                  作为基准数据源，支持从 OSS 导出的 IMU CSV（表头含 ts,
                  device_id, acc_*, gyro_*）
                </p>
              </Dragger>
              {uploadedData1 && (
                <Space>
                  <Text>文件1：{uploadedData1.length.toLocaleString()} 条</Text>
                  <a
                    onClick={() => {
                      setUploadedData1(null);
                      setData1([]);
                    }}
                  >
                    清除文件1
                  </a>
                </Space>
              )}

              <Text strong>文件2（对比，可选）</Text>
              <Dragger
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = (e.target?.result as string) ?? '';
                    try {
                      const records = parseCsvToImuRecords(text);
                      setUploadedData2(records);
                      if (!uploadedData1 && records.length > 0) {
                        const firstId = records[0].device_id;
                        if (records.some((r) => r.device_id)) {
                          setDeviceId((prev) =>
                            records.some((r) => r.device_id === prev)
                              ? prev
                              : firstId,
                          );
                        }
                        const times = records.map((r) => dayjs(r.ts));
                        const minT = times.reduce((a, b) =>
                          a.isBefore(b) ? a : b,
                        );
                        const maxT = times.reduce((a, b) =>
                          a.isAfter(b) ? a : b,
                        );

                        const start = records.some((r) => r.device_id)
                          ? minT.add(8, 'hour').startOf('day')
                          : minT.startOf('day');
                        const end = records.some((r) => r.device_id)
                          ? maxT.add(8, 'hour').endOf('day')
                          : maxT.endOf('day');
                        setDateRange([start, end]);
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
                <p className="ant-upload-text">
                  点击或拖拽 CSV 文件到此处（文件2，可选）
                </p>
                <p className="ant-upload-hint">
                  可上传另一份 IMU CSV，用于与文件1对比波形差异
                </p>
              </Dragger>
              {uploadedData2 && (
                <Space>
                  <Text>文件2：{uploadedData2.length.toLocaleString()} 条</Text>
                  <a
                    onClick={() => {
                      setUploadedData2(null);
                      setData2([]);
                    }}
                  >
                    清除文件2
                  </a>
                </Space>
              )}
            </Space>
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
            <Text strong>预处理：</Text>
            <Switch
              checked={enablePreprocess}
              onChange={setEnablePreprocess}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
            <Text type="secondary">
              （开启时对两份数据都做安装角度纠正与重力归一化）
            </Text>
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
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.acc_x),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_x（文件1）',
                    },
                    {
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.acc_y),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_y（文件1）',
                    },
                    {
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.acc_z),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'acc_z（文件1）',
                    },
                    ...(aggregatedBySecond2.length
                      ? [
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.acc_x),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'acc_x（文件2）',
                            line: { dash: 'dash' as const },
                          },
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.acc_y),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'acc_y（文件2）',
                            line: { dash: 'dash' as const },
                          },
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.acc_z),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'acc_z（文件2）',
                            line: { dash: 'dash' as const },
                          },
                        ]
                      : []),
                  ]}
                  layout={{
                    autosize: true,
                    height: 320,
                    margin: { l: 50, r: 10, t: 20, b: 40 },
                    xaxis: {
                      title: { text: '时间（时:分:秒.毫秒）' },
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
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.gyro_x),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_x（文件1）',
                    },
                    {
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.gyro_y),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_y（文件1）',
                    },
                    {
                      x: aggregatedBySecond1.map((d) => d.time),
                      y: aggregatedBySecond1.map((d) => d.gyro_z),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'gyro_z（文件1）',
                    },
                    ...(aggregatedBySecond2.length
                      ? [
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.gyro_x),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'gyro_x（文件2）',
                            line: { dash: 'dash' as const },
                          },
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.gyro_y),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'gyro_y（文件2）',
                            line: { dash: 'dash' as const },
                          },
                          {
                            x: aggregatedBySecond2.map((d) => d.time),
                            y: aggregatedBySecond2.map((d) => d.gyro_z),
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            name: 'gyro_z（文件2）',
                            line: { dash: 'dash' as const },
                          },
                        ]
                      : []),
                  ]}
                  layout={{
                    autosize: true,
                    height: 320,
                    margin: { l: 50, r: 10, t: 20, b: 40 },
                    xaxis: {
                      title: { text: '时间（时:分:秒.毫秒）' },
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
                  dataSource={displayData1}
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
