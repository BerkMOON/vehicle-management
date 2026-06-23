import { Button, Space, Table, Tag, message } from 'antd';
import React, { useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { AnomalyItem, ParseErrorRow } from '../types';
import ParseErrorFixModal from './ParseErrorFixModal';

interface AnomalyPanelProps {
  anomalies: AnomalyItem[];
  parseErrors: ParseErrorRow[];
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
  const [fixRecord, setFixRecord] = useState<ParseErrorRow | null>(null);
  const [fixSubmitting, setFixSubmitting] = useState(false);

  const openParseErrors = parseErrors.filter((item) => item.status === 'open');

  const handleFixSubmit = async (
    input: Parameters<
      typeof CompetitionDashboardService.submitParseErrorFix
    >[0],
  ) => {
    setFixSubmitting(true);
    try {
      await CompetitionDashboardService.submitParseErrorFix(input);
      message.success('已修正并入库');
      setFixRecord(null);
      onChanged();
    } catch (error: any) {
      message.error(error?.message || '修正入库失败');
    } finally {
      setFixSubmitting(false);
    }
  };

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

      {openParseErrors.length > 0 && (
        <div>
          <Space style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>
              解析失败行（{openParseErrors.length}）
            </h3>
            {onClearParseErrors && (
              <Button size="small" onClick={onClearParseErrors}>
                清空记录
              </Button>
            )}
          </Space>
          <Table
            rowKey="id"
            size="small"
            dataSource={openParseErrors}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            columns={[
              {
                title: '文件',
                dataIndex: 'fileName',
                width: 200,
                ellipsis: true,
              },
              { title: '行号', dataIndex: 'rowNo', width: 70 },
              { title: '门店', dataIndex: 'storeName', width: 110 },
              {
                title: '表类型',
                dataIndex: 'tableType',
                width: 100,
                render: (value: ParseErrorRow['tableType']) =>
                  value ? TABLE_TYPE_LABEL[value] : '-',
              },
              {
                title: '原始日期',
                dataIndex: 'rawBusinessDate',
                width: 110,
                render: (value?: string) => value || '-',
              },
              {
                title: '业务日期',
                dataIndex: 'businessDate',
                width: 110,
                render: (value?: string) => value || '-',
              },
              {
                title: '原始车架号',
                dataIndex: 'rawVin',
                width: 180,
                ellipsis: true,
                render: (value?: string) => value || '-',
              },
              {
                title: '安装标记',
                dataIndex: 'installedFlag',
                width: 90,
                render: (value?: string) => value || '-',
              },
              { title: '原因', dataIndex: 'reason', ellipsis: true },
              {
                title: '操作',
                width: 100,
                fixed: 'right',
                render: (_: unknown, record: ParseErrorRow) => (
                  <Button type="link" onClick={() => setFixRecord(record)}>
                    修正入库
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      <ParseErrorFixModal
        open={!!fixRecord}
        record={fixRecord}
        submitting={fixSubmitting}
        onSubmit={handleFixSubmit}
        onCancel={() => setFixRecord(null)}
      />
    </Space>
  );
};

export default AnomalyPanel;
