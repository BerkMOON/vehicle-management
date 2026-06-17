import { DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, DatePicker, Space, Table, Tabs, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { BRAND_LABEL } from '../constants';
import { StoreReturnStatus } from '../types';
import { formatDateTime } from '../utils/date';
import { exportMissingReturnList } from '../utils/export';

interface ReturnMonitorPanelProps {
  date: string;
  onDateChange: (date: string) => void;
  returnStatus: StoreReturnStatus[];
}

function missingSummary(item: StoreReturnStatus): string {
  const parts: string[] = [];
  if (!item.newCar.uploaded) parts.push('新车表');
  if (!item.entryCheck.uploaded) parts.push('入厂检测表');
  return parts.join('、') || '-';
}

function renderUploadCell(value: StoreReturnStatus['newCar']) {
  if (!value.uploaded) return <Tag>未回传</Tag>;
  return (
    <Tag color="success">
      已回传 · {value.rowCount || 0} 行
      {value.uploadedBy ? ` · ${value.uploadedBy}` : ''}
      {value.uploadedAt ? ` · ${formatDateTime(value.uploadedAt)}` : ''}
    </Tag>
  );
}

const ReturnMonitorPanel: React.FC<ReturnMonitorPanelProps> = ({
  date,
  onDateChange,
  returnStatus,
}) => {
  const summary = useMemo(() => {
    const total = returnStatus.length;
    const completed = returnStatus.filter((item) => item.completed).length;
    return { total, completed, missing: total - completed };
  }, [returnStatus]);

  const missingList = useMemo(
    () => returnStatus.filter((item) => !item.completed),
    [returnStatus],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, StoreReturnStatus[]>();
    returnStatus.forEach((item) => {
      const list = map.get(item.brand) || [];
      list.push(item);
      map.set(item.brand, list);
    });
    return map;
  }, [returnStatus]);

  const matrixColumns = [
    { title: '门店', dataIndex: 'storeName', width: 140 },
    {
      title: '新车表',
      dataIndex: 'newCar',
      render: renderUploadCell,
    },
    {
      title: '入厂检测表',
      dataIndex: 'entryCheck',
      render: renderUploadCell,
    },
    {
      title: '当日完成',
      dataIndex: 'completed',
      width: 100,
      render: (value: boolean) =>
        value ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Tag color="warning">未完成</Tag>
        ),
    },
  ];

  const missingColumns = [
    { title: '门店', dataIndex: 'storeName', width: 140 },
    {
      title: '品牌',
      dataIndex: 'brand',
      width: 100,
      render: (brand: StoreReturnStatus['brand']) => BRAND_LABEL[brand],
    },
    {
      title: '缺传内容',
      render: (_: unknown, record: StoreReturnStatus) => missingSummary(record),
    },
    {
      title: '新车表',
      dataIndex: 'newCar',
      width: 120,
      render: (value: StoreReturnStatus['newCar']) =>
        value.uploaded ? (
          <Tag color="success">已回传</Tag>
        ) : (
          <Tag color="error">未回传</Tag>
        ),
    },
    {
      title: '入厂检测表',
      dataIndex: 'entryCheck',
      width: 120,
      render: (value: StoreReturnStatus['entryCheck']) =>
        value.uploaded ? (
          <Tag color="success">已回传</Tag>
        ) : (
          <Tag color="error">未回传</Tag>
        ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Alert
          type={summary.completed === summary.total ? 'success' : 'warning'}
          showIcon
          message={`${date} 回传进度：已回传 ${summary.completed} 家 / 共 ${summary.total} 家`}
          description={
            summary.missing > 0
              ? `仍有 ${summary.missing} 家门店未完成当日两类表回传，见下方缺传列表`
              : '当日全部门店已完成回传'
          }
          style={{ marginBottom: 0 }}
        />
        <DatePicker
          value={dayjs(date)}
          onChange={(value) =>
            value && onDateChange(value.format('YYYY-MM-DD'))
          }
        />
        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            exportMissingReturnList(
              returnStatus,
              date,
              `未回传名单_${date}.xlsx`,
            )
          }
        >
          导出未回传名单
        </Button>
      </Space>

      <Tabs
        items={[
          {
            key: 'matrix',
            label: '全部门店',
            children: (
              <>
                {Array.from(grouped.entries()).map(([brand, list]) => (
                  <div key={brand} style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>
                      {BRAND_LABEL[brand as keyof typeof BRAND_LABEL]}品牌部
                    </h3>
                    <Table
                      rowKey="storeId"
                      size="small"
                      pagination={false}
                      dataSource={list}
                      columns={matrixColumns}
                      rowClassName={(record) =>
                        !record.completed ? 'competition-row-warning' : ''
                      }
                    />
                  </div>
                ))}
              </>
            ),
          },
          {
            key: 'missing',
            label: `缺传列表（${missingList.length}）`,
            children: (
              <Table
                rowKey="storeId"
                size="small"
                pagination={false}
                dataSource={missingList}
                columns={missingColumns}
                locale={{ emptyText: '当日全部门店已回传' }}
                rowClassName={() => 'competition-row-warning'}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default ReturnMonitorPanel;
