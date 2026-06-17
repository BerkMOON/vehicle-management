import { ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Tabs,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AnomalyPanel from './components/AnomalyPanel';
import RankingPanel from './components/RankingPanel';
import ReturnMonitorPanel from './components/ReturnMonitorPanel';
import UploadPanel from './components/UploadPanel';
import { DEFAULT_COMPETITION_CONFIG } from './constants';
import './index.less';
import { CompetitionDashboardService } from './services/competitionService';
import { StoreBackendRefreshStatus, StoreMetrics } from './types';
import { buildReturnStatus } from './utils/metrics';
import { formatRatio } from './utils/rankingTable';

const CompetitionDashboard: React.FC = () => {
  const [config, setConfig] = useState(CompetitionDashboardService.getConfig());
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );
  const [metrics, setMetrics] = useState<StoreMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeRefreshStatus, setStoreRefreshStatus] = useState<
    Record<string, StoreBackendRefreshStatus>
  >({});
  const refreshSessionRef = useRef(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [parseErrors, setParseErrors] = useState(
    CompetitionDashboardService.getParseErrors(),
  );

  const reloadLocal = useCallback(() => {
    setConfig(CompetitionDashboardService.getConfig());
    setParseErrors(CompetitionDashboardService.getParseErrors());
    setRefreshTick((v) => v + 1);
  }, []);

  const [backendStats, setBackendStats] = useState({
    bindings: 0,
    detections: 0,
    linkedStores: 0,
  });

  const refreshProgress = useMemo(() => {
    const statuses = Object.values(storeRefreshStatus);
    if (statuses.length === 0) return null;
    const done = statuses.filter(
      (s) => s === 'done' || s === 'no_link' || s === 'error',
    ).length;
    const loadingCount = statuses.filter((s) => s === 'loading').length;
    return { done, total: statuses.length, loadingCount };
  }, [storeRefreshStatus]);

  const refreshMetrics = useCallback(async () => {
    const session = ++refreshSessionRef.current;
    setLoading(true);
    setStoreRefreshStatus({});

    try {
      await CompetitionDashboardService.refreshMetricsIncremental({
        onExcelReady: (excelMetrics) => {
          if (session !== refreshSessionRef.current) return;
          setMetrics(excelMetrics);
        },
        onStoreStatus: (storeId, status) => {
          if (session !== refreshSessionRef.current) return;
          setStoreRefreshStatus((prev) => ({ ...prev, [storeId]: status }));
        },
        onStoreMetrics: (storeId, storeMetrics) => {
          if (session !== refreshSessionRef.current) return;
          setMetrics((prev) =>
            prev.map((item) =>
              item.storeId === storeId ? storeMetrics : item,
            ),
          );
        },
        onComplete: (result) => {
          if (session !== refreshSessionRef.current) return;
          setMetrics(result.metrics);
          setBackendStats({
            bindings: result.bindingsCount,
            detections: result.detectionsCount,
            linkedStores: result.linkedStoreCount,
          });
          setLoading(false);
        },
      });
    } catch (error) {
      console.error(error);
      if (session === refreshSessionRef.current) {
        setLoading(false);
        message.error('指标刷新失败');
      }
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics, refreshTick]);

  useEffect(() => {
    const minutes = config.autoRefreshMinutes;
    if (!minutes || minutes <= 0) return undefined;
    const timer = window.setInterval(() => {
      refreshMetrics();
    }, minutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [config.autoRefreshMinutes, refreshMetrics]);

  const returnStatus = useMemo(() => {
    return buildReturnStatus({
      config,
      date: selectedDate,
      vehicleRows: CompetitionDashboardService.getVehicleRows(),
      uploadRecords: CompetitionDashboardService.getUploadRecords(),
    });
  }, [config, selectedDate, refreshTick]);

  const summary = useMemo(() => {
    const completedStores = returnStatus.filter(
      (item) => item.completed,
    ).length;
    const avgComprehensive =
      metrics.length > 0
        ? formatRatio(
            metrics.reduce((sum, item) => sum + item.comprehensiveRatio, 0) /
              metrics.length,
          )
        : '0.000000';
    return { completedStores, avgComprehensive };
  }, [returnStatus, metrics]);

  const [form] = Form.useForm();

  return (
    <PageContainer
      title="易达安双月竞赛数据看板"
      subTitle={`竞赛期 ${config.startDate} ~ ${config.endDate}`}
      extra={
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => {
              form.setFieldsValue(config);
              setConfigOpen(true);
            }}
          >
            配置
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            type="primary"
            onClick={refreshMetrics}
          >
            刷新指标
            {refreshProgress && refreshProgress.loadingCount > 0
              ? ` (${refreshProgress.done}/${refreshProgress.total})`
              : ''}
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当日已完成回传门店"
              value={summary.completedStores}
              suffix={`/ ${returnStatus.length}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均综合渗透率"
              value={summary.avgComprehensive}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待处理文件"
              value={CompetitionDashboardService.getPendingFiles().length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="最近计算时间"
              value={
                metrics[0]?.calculatedAt
                  ? dayjs(metrics[0].calculatedAt).format('HH:mm:ss')
                  : '-'
              }
            />
          </Card>
        </Col>
      </Row>

      <Typography.Paragraph type="secondary">
        一期：上传表与回传记录保存在本机浏览器；指标分母来自
        Excel，分子来自后台只读接口（设备绑定 {backendStats.bindings} 条 /
        入厂留痕 {backendStats.detections} 条，已匹配{' '}
        {backendStats.linkedStores} 家门店）。
        {refreshProgress && refreshProgress.loadingCount > 0
          ? ` 后台数据刷新中：${refreshProgress.done}/${refreshProgress.total} 店已完成。`
          : ''}
      </Typography.Paragraph>

      <Tabs
        items={[
          {
            key: 'return',
            label: '回传监控',
            children: (
              <ReturnMonitorPanel
                date={selectedDate}
                onDateChange={setSelectedDate}
                returnStatus={returnStatus}
              />
            ),
          },
          {
            key: 'ranking',
            label: '排名展示',
            children: (
              <RankingPanel
                metrics={metrics}
                startDate={config.startDate}
                endDate={config.endDate}
                storeRefreshStatus={storeRefreshStatus}
              />
            ),
          },
          {
            key: 'upload',
            label: '文件上传',
            children: (
              <UploadPanel
                pendingFiles={CompetitionDashboardService.getPendingFiles()}
                uploadRecords={CompetitionDashboardService.getUploadRecords()}
                onChanged={() => {
                  reloadLocal();
                  refreshMetrics();
                }}
              />
            ),
          },
          {
            key: 'anomaly',
            label: '异常与对账',
            children: (
              <AnomalyPanel
                anomalies={CompetitionDashboardService.getAnomalies()}
                parseErrors={parseErrors}
                onChanged={reloadLocal}
                onClearParseErrors={() => {
                  CompetitionDashboardService.clearParseErrors();
                  reloadLocal();
                }}
              />
            ),
          },
        ]}
      />

      <Drawer
        title="竞赛配置"
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        width={420}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={DEFAULT_COMPETITION_CONFIG}
          onFinish={(values) => {
            const next = {
              ...config,
              targets: values.targets,
              autoRefreshMinutes: values.autoRefreshMinutes,
            };
            CompetitionDashboardService.saveConfig(next);
            setConfig(next);
            setConfigOpen(false);
            message.success('配置已保存');
            refreshMetrics();
          }}
        >
          <Form.Item
            label="综合渗透率目标（小数，如 0.65）"
            name={['targets', 'comprehensive']}
          >
            <InputNumber
              min={0}
              max={5}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="入厂检测覆盖率目标（小数）"
            name={['targets', 'inspectionCoverage']}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="售后渗透率目标（小数）"
            name={['targets', 'afterSales']}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="自动刷新间隔(分钟)" name="autoRefreshMinutes">
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Popconfirm
            title="确定清空本机竞赛数据？"
            description="将删除已上传 VIN、回传记录与排名快照，不可恢复。"
            onConfirm={() => {
              CompetitionDashboardService.clearAllLocalData();
              setConfig(DEFAULT_COMPETITION_CONFIG);
              setMetrics([]);
              setConfigOpen(false);
              reloadLocal();
              refreshMetrics();
              message.success('本地数据已清空');
            }}
          >
            <Button danger block style={{ marginBottom: 12 }}>
              清空本机竞赛数据
            </Button>
          </Popconfirm>
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

export default CompetitionDashboard;
