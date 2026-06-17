import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Card, Space, Spin, Table, Tabs, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { StoreBackendRefreshStatus, StoreMetrics } from '../types';
import {
  exportAllRankingTables,
  exportRankingTableExcel,
} from '../utils/export';
import {
  RankingTableKind,
  RankingTableRow,
  buildRankingTableRows,
  formatRatio,
  getRankingTableConfig,
} from '../utils/rankingTable';

interface RankingPanelProps {
  metrics: StoreMetrics[];
  startDate: string;
  endDate: string;
  storeRefreshStatus?: Record<string, StoreBackendRefreshStatus>;
}

const TABLE_TABS: { key: RankingTableKind; label: string }[] = [
  { key: 'comprehensive', label: '综合渗透率排名' },
  { key: 'inspection', label: '入厂检测覆盖率排名' },
  { key: 'afterSales', label: '售后渗透率排名' },
];

function isStoreBackendLoading(
  record: RankingTableRow,
  storeRefreshStatus?: Record<string, StoreBackendRefreshStatus>,
): boolean {
  if (record.rowType !== 'store') return false;
  return storeRefreshStatus?.[record.key] === 'loading';
}

function renderMetricCell(
  value: number | null,
  record: RankingTableRow,
  storeRefreshStatus?: Record<string, StoreBackendRefreshStatus>,
  isNumerator = false,
) {
  if (record.rowType !== 'store') {
    return value ?? '-';
  }
  const status = storeRefreshStatus?.[record.key];
  if (status === 'loading') {
    return isNumerator ? (
      <Spin indicator={<LoadingOutlined spin />} size="small" />
    ) : (
      '-'
    );
  }
  if (status === 'error') {
    return (
      <Tooltip title="后台数据拉取失败，显示 Excel 分母">
        <span style={{ color: '#faad14' }}>
          {isNumerator ? '-' : value ?? '-'}
        </span>
      </Tooltip>
    );
  }
  return value ?? '-';
}

function RankingTableView(props: {
  kind: RankingTableKind;
  metrics: StoreMetrics[];
  startDate: string;
  endDate: string;
  storeRefreshStatus?: Record<string, StoreBackendRefreshStatus>;
}) {
  const { kind, metrics, startDate, endDate, storeRefreshStatus } = props;
  const config = useMemo(
    () => getRankingTableConfig(kind, startDate, endDate),
    [kind, startDate, endDate],
  );
  const rows = useMemo(
    () => buildRankingTableRows(metrics, kind),
    [metrics, kind],
  );

  const columns = [
    {
      title: '',
      dataIndex: 'label',
      width: 160,
      render: (text: string, record: RankingTableRow) => (
        <span
          style={{
            fontWeight:
              record.rowType === 'brandSubtotal' ||
              record.rowType === 'groupTotal'
                ? 600
                : 400,
            background: record.rowType === 'groupTotal' ? '#fff7e6' : undefined,
            display: 'block',
            padding: record.rowType === 'groupTotal' ? '2px 4px' : undefined,
          }}
        >
          {text}
          {isStoreBackendLoading(record, storeRefreshStatus) && (
            <LoadingOutlined spin style={{ marginLeft: 6, color: '#1677ff' }} />
          )}
        </span>
      ),
    },
    {
      title: config.denominatorLabel,
      dataIndex: 'denominator',
      width: 120,
      align: 'right' as const,
      render: (value: number | null, record: RankingTableRow) =>
        renderMetricCell(value, record, storeRefreshStatus, false),
    },
    {
      title: config.numeratorLabel,
      dataIndex: 'numerator',
      width: 140,
      align: 'right' as const,
      render: (value: number | null, record: RankingTableRow) =>
        renderMetricCell(value, record, storeRefreshStatus, true),
    },
    {
      title: config.ratioLabel,
      dataIndex: 'ratio',
      width: 120,
      align: 'right' as const,
      render: (value: number | null, record: RankingTableRow) => {
        if (isStoreBackendLoading(record, storeRefreshStatus)) return '-';
        return formatRatio(value);
      },
    },
  ];

  return (
    <Card
      size="small"
      title={config.title}
      extra={
        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            exportRankingTableExcel({
              metrics,
              kind,
              startDate,
              endDate,
            })
          }
        >
          导出 Excel
        </Button>
      }
    >
      <Table
        rowKey="key"
        size="small"
        pagination={false}
        dataSource={rows}
        columns={columns}
        rowClassName={(record) => {
          if (record.rowType === 'groupTotal')
            return 'competition-ranking-group-total';
          if (record.rowType === 'brandSubtotal')
            return 'competition-ranking-subtotal';
          if (storeRefreshStatus?.[record.key] === 'loading') {
            return 'competition-ranking-loading';
          }
          return '';
        }}
      />
    </Card>
  );
}

const RankingPanel: React.FC<RankingPanelProps> = ({
  metrics,
  startDate,
  endDate,
  storeRefreshStatus,
}) => {
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={() =>
            exportAllRankingTables({ metrics, startDate, endDate })
          }
        >
          导出全部排名表
        </Button>
      </Space>
      <Tabs
        items={TABLE_TABS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <RankingTableView
                kind={tab.key}
                metrics={metrics}
                startDate={startDate}
                endDate={endDate}
                storeRefreshStatus={storeRefreshStatus}
              />
            </Space>
          ),
        }))}
      />
    </div>
  );
};

export default RankingPanel;
