import { Button, Space, Table, Tag } from 'antd';
import React from 'react';
import { CompetitionDashboardService } from '../services/competitionService';
import { AnomalyItem } from '../types';

interface AnomalyPanelProps {
  anomalies: AnomalyItem[];
  parseErrors: Array<{
    fileName: string;
    rowNo: number;
    reason: string;
    rawVin?: string;
  }>;
  onChanged: () => void;
  onClearParseErrors?: () => void;
}

const TYPE_LABEL: Record<AnomalyItem['type'], string> = {
  parse_error: '解析异常',
  detect_without_entry: '后端有检测无入厂',
  entry_without_detect: '入厂无检测',
  installed_without_bind: '已加装无绑定',
};

const AnomalyPanel: React.FC<AnomalyPanelProps> = ({
  anomalies,
  parseErrors,
  onChanged,
  onClearParseErrors,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div>
        <h3>数据不一致 / 对账异常</h3>
        <Table
          rowKey="id"
          size="small"
          dataSource={anomalies}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '门店', dataIndex: 'storeName', width: 120 },
            { title: '车架号', dataIndex: 'vin', width: 180 },
            {
              title: '类型',
              dataIndex: 'type',
              width: 140,
              render: (value: AnomalyItem['type']) => TYPE_LABEL[value],
            },
            { title: '说明', dataIndex: 'message' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value: AnomalyItem['status']) =>
                value === 'resolved' ? (
                  <Tag color="success">已处理</Tag>
                ) : (
                  <Tag>待处理</Tag>
                ),
            },
            {
              title: '操作',
              width: 100,
              render: (_: unknown, record: AnomalyItem) =>
                record.status === 'open' ? (
                  <Button
                    type="link"
                    onClick={() => {
                      CompetitionDashboardService.resolveAnomaly(record.id);
                      onChanged();
                    }}
                  >
                    标记已处理
                  </Button>
                ) : null,
            },
          ]}
        />
      </div>

      {parseErrors.length > 0 && (
        <div>
          <Space style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>解析失败行（{parseErrors.length}）</h3>
            {onClearParseErrors && (
              <Button size="small" onClick={onClearParseErrors}>
                清空记录
              </Button>
            )}
          </Space>
          <Table
            rowKey={(row, index) => `${row.fileName}-${row.rowNo}-${index}`}
            size="small"
            dataSource={parseErrors}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '文件', dataIndex: 'fileName', width: 220 },
              { title: '行号', dataIndex: 'rowNo', width: 80 },
              { title: '原因', dataIndex: 'reason' },
              { title: '原始车架号', dataIndex: 'rawVin', width: 180 },
            ]}
          />
        </div>
      )}
    </Space>
  );
};

export default AnomalyPanel;
