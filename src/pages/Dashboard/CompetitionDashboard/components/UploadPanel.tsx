import { UserSelfInfo } from '@/services/user/typings';
import { InboxOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import type { UploadProps } from 'antd';
import { Alert, Button, Table, Upload, message } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { BatchUploadResult, PendingFile, UploadRecord } from '../types';
import { formatDateTime } from '../utils/date';
import { getUploadCoverageDates } from '../utils/fileNameParser';
import PendingFilesModal from './PendingFilesModal';

interface UploadPanelProps {
  pendingFiles: PendingFile[];
  uploadRecords: UploadRecord[];
  onChanged: () => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({
  pendingFiles,
  uploadRecords,
  onChanged,
}) => {
  const { initialState } = useModel('@@initialState');
  const uploader =
    (initialState as UserSelfInfo)?.user_info?.nickname ||
    (initialState as UserSelfInfo)?.user_info?.username ||
    '管理员';

  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<BatchUploadResult | null>(null);
  const [pendingVisible, setPendingVisible] = useState(false);

  const history = useMemo(
    () =>
      [...uploadRecords].sort(
        (a, b) => dayjs(b.uploadedAt).valueOf() - dayjs(a.uploadedAt).valueOf(),
      ),
    [uploadRecords],
  );

  const handleUpload = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    if (fileList.length > 50) {
      message.warning('单次最多上传 50 个文件');
      return;
    }
    setUploading(true);
    try {
      const result = await CompetitionDashboardService.uploadFiles(
        fileList,
        uploader,
      );
      setLastResult(result);
      message.success(
        `上传完成：成功 ${result.successCount}，待处理 ${result.pendingCount}，失败 ${result.errorCount}`,
      );
      if (result.pendingCount > 0) setPendingVisible(true);
      onChanged();
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.xlsx,.xls',
    showUploadList: false,
    disabled: uploading,
    beforeUpload: (_, fileList) => {
      handleUpload(fileList as unknown as File[]);
      return false;
    },
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="上传说明"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
            <li>支持一次拖入多个 xlsx 文件，单文件建议不超过 5000 行</li>
            <li>文件名需包含门店名与表类型关键词（新车 / 售后 / 入厂检测）</li>
            <li>
              同一门店同一表类型同一业务日期重复上传时，会用新数据整体替换旧数据
            </li>
            <li>匹配失败的文件进入待处理区，由管理员手工指定门店与类型</li>
            <li>当前上传人：{uploader}（记录在本地浏览器，不上传后端）</li>
          </ul>
        }
      />

      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽 Excel 文件到此处批量上传</p>
        <p className="ant-upload-hint">
          支持新车表、售后简单版、入厂检测详细版（三 sheet 自动合并）
        </p>
      </Upload.Dragger>

      {pendingFiles.length > 0 && (
        <Button
          style={{ marginTop: 16 }}
          onClick={() => setPendingVisible(true)}
        >
          待处理文件（{pendingFiles.length}）
        </Button>
      )}

      {lastResult && lastResult.parseErrors.length > 0 && (
        <Table
          style={{ marginTop: 16 }}
          size="small"
          rowKey={(row, index) => `${row.fileName}-${row.rowNo}-${index}`}
          pagination={{ pageSize: 8 }}
          dataSource={lastResult.parseErrors}
          columns={[
            { title: '文件', dataIndex: 'fileName', width: 220 },
            { title: '行号', dataIndex: 'rowNo', width: 80 },
            { title: '原因', dataIndex: 'reason' },
            { title: '原始车架号', dataIndex: 'rawVin', width: 180 },
          ]}
        />
      )}

      <h3 style={{ marginTop: 24 }}>上传记录（{history.length}）</h3>
      <Table
        size="small"
        rowKey="id"
        pagination={{ pageSize: 10 }}
        dataSource={history}
        columns={[
          {
            title: '上传时间',
            dataIndex: 'uploadedAt',
            width: 160,
            render: formatDateTime,
          },
          {
            title: '上传人',
            dataIndex: 'uploadedBy',
            width: 100,
            render: (v) => v || '-',
          },
          { title: '门店', dataIndex: 'storeName', width: 120 },
          {
            title: '表类型',
            dataIndex: 'tableType',
            width: 110,
            render: (v: keyof typeof TABLE_TYPE_LABEL) => TABLE_TYPE_LABEL[v],
          },
          { title: '文件名', dataIndex: 'fileName', ellipsis: true },
          {
            title: '报表日期',
            width: 110,
            render: (_: unknown, record: UploadRecord) => {
              const config = CompetitionDashboardService.getConfig();
              const dates = getUploadCoverageDates(record, config);
              return dates.length > 0 ? dates.join('、') : '-';
            },
          },
          {
            title: '行内日期',
            dataIndex: 'businessDates',
            width: 120,
            render: (dates: string[]) =>
              dates.length > 0 ? dates.join('、') : '-',
          },
          { title: '有效行', dataIndex: 'validRowCount', width: 80 },
          {
            title: '状态',
            dataIndex: 'parseStatus',
            width: 90,
            render: (status: UploadRecord['parseStatus']) => {
              if (status === 'success') return '成功';
              if (status === 'partial') return '部分失败';
              return status;
            },
          },
        ]}
      />

      <PendingFilesModal
        open={pendingVisible}
        pendingFiles={pendingFiles}
        onClose={() => setPendingVisible(false)}
        onResolved={onChanged}
      />
    </div>
  );
};

export default UploadPanel;
