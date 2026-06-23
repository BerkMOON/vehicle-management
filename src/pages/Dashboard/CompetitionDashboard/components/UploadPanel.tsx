import { UserSelfInfo } from '@/services/user/typings';
import { InboxOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import type { UploadProps } from 'antd';
import { Alert, Button, Table, Upload, message } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import {
  BatchUploadResult,
  PendingFile,
  UploadConfirmDraft,
  UploadRecord,
} from '../types';
import { formatDateTime } from '../utils/date';
import { getUploadCoverageDates } from '../utils/fileNameParser';
import PendingFilesModal from './PendingFilesModal';
import UploadConfirmModal from './UploadConfirmModal';

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
  const uploadingRef = useRef(false);
  const [lastResult, setLastResult] = useState<BatchUploadResult | null>(null);
  const [pendingVisible, setPendingVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmDrafts, setConfirmDrafts] = useState<UploadConfirmDraft[]>([]);
  const [confirming, setConfirming] = useState(false);

  const history = useMemo(
    () =>
      [...uploadRecords].sort(
        (a, b) => dayjs(b.uploadedAt).valueOf() - dayjs(a.uploadedAt).valueOf(),
      ),
    [uploadRecords],
  );

  const handleSelectFiles = async (fileList: File[]) => {
    if (fileList.length === 0 || uploadingRef.current) return;
    if (fileList.length > 50) {
      message.warning('单次最多上传 50 个文件');
      return;
    }
    uploadingRef.current = true;
    setUploading(true);
    try {
      const drafts = await CompetitionDashboardService.prepareUploadDrafts(
        fileList,
      );
      if (drafts.length === 0) {
        message.warning('没有可上传的文件');
        return;
      }
      setConfirmDrafts(drafts);
      setConfirmVisible(true);
    } catch (error: any) {
      message.error(error?.message || '文件解析失败');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (confirmDrafts.length === 0) return;
    const incomplete = confirmDrafts.some(
      (item) => !item.storeId || !item.tableType,
    );
    if (incomplete) {
      message.warning('请为每个文件选择门店和表类型');
      return;
    }

    setConfirming(true);
    try {
      const result = await CompetitionDashboardService.confirmUploadFiles(
        confirmDrafts,
        uploader,
      );
      setLastResult(result);
      setConfirmVisible(false);
      setConfirmDrafts([]);
      message.success(
        `上传完成：成功 ${result.successCount}，失败 ${result.errorCount}`,
      );
      onChanged();
    } catch (error: any) {
      message.error(error?.message || '上传失败');
    } finally {
      setConfirming(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.xlsx,.xls',
    showUploadList: false,
    disabled: uploading || confirming,
    beforeUpload: (file, fileList) => {
      const batch = fileList as unknown as File[];
      if (batch.indexOf(file as unknown as File) !== batch.length - 1) {
        return false;
      }
      void handleSelectFiles([...batch]);
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
            <li>支持一次拖入多个 xlsx 文件，单文件可上传万级行数</li>
            <li>文件名需包含门店名与表类型关键词（新车 / 售后 / 入厂检测）</li>
            <li>选择文件后会弹出确认框，可修改门店与表类型后再提交</li>
            <li>
              同一门店同一表类型同一业务日期重复上传时，会用新数据整体替换旧数据
            </li>
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
          支持新车表、售后/入厂表；含多个数据 sheet 时自动合并（按表头识别，不限
          sheet 名称）
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

      <UploadConfirmModal
        open={confirmVisible}
        drafts={confirmDrafts}
        confirming={confirming}
        onDraftsChange={setConfirmDrafts}
        onConfirm={handleConfirmUpload}
        onCancel={() => {
          if (confirming) return;
          setConfirmVisible(false);
          setConfirmDrafts([]);
        }}
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
