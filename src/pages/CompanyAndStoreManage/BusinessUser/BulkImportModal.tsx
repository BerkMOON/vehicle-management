import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Alert,
  Button,
  Modal,
  Progress,
  Table,
  Typography,
  Upload,
} from 'antd';
import React, { useRef, useState } from 'react';
import { ImportFailure, ImportResult, runBulkImport } from './bulkImportUsers';

interface BulkImportModalProps {
  onFinished?: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ onFinished }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const fileRef = useRef<File | null>(null);

  const failureColumns = [
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '失败原因', dataIndex: 'reason', width: 140 },
    {
      title: '详情',
      dataIndex: 'detail',
      ellipsis: true,
    },
  ];

  const startImport = async () => {
    if (!fileRef.current) return;
    setImporting(true);
    setProgress({ current: 0, total: 0 });
    try {
      const buffer = await fileRef.current.arrayBuffer();
      const importResult = await runBulkImport(buffer, (current, total) => {
        setProgress({ current, total });
      });
      setResult(importResult);
      setResultVisible(true);
      onFinished?.();
    } finally {
      setImporting(false);
      fileRef.current = null;
    }
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    maxCount: 1,
    showUploadList: false,
    disabled: importing,
    beforeUpload: (file) => {
      fileRef.current = file;
      Modal.confirm({
        title: '确认批量导入用户？',
        content: (
          <div>
            <p>
              文件：<strong>{file.name}</strong>
            </p>
            <p>规则说明：</p>
            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
              <li>
                支持「按手机号汇总」格式（门店角色 JSON
                列）及旧版「按人整理」格式
              </li>
              <li>按手机号识别用户，用户名和密码均为手机号</li>
              <li>显示名为姓名</li>
              <li>
                账号已存在时，会用文件中的门店角色<strong>覆盖</strong>原有角色
              </li>
              <li>账号不存在时，自动创建并分配角色</li>
            </ul>
          </div>
        ),
        okText: '开始导入',
        cancelText: '取消',
        onOk: startImport,
      });
      return false;
    },
  };

  return (
    <>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={importing}>
          上传文件批量导入
        </Button>
      </Upload>

      <Modal
        title="批量导入进行中"
        open={importing}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <Progress
          percent={
            progress.total > 0
              ? Math.round((progress.current / progress.total) * 100)
              : 0
          }
          status="active"
        />
        <Typography.Text
          type="secondary"
          style={{ marginTop: 12, display: 'block' }}
        >
          正在处理 {progress.current}/{progress.total} 个用户，请勿关闭页面
        </Typography.Text>
      </Modal>

      <Modal
        title="批量导入结果"
        open={resultVisible}
        width={860}
        onCancel={() => setResultVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setResultVisible(false)}
          >
            关闭
          </Button>,
        ]}
      >
        {result && (
          <>
            <Alert
              type={result.failCount > 0 ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
              message={
                <>
                  共处理 <strong>{result.totalUsers}</strong> 个用户，成功{' '}
                  <strong>{result.successCount}</strong> 个，失败{' '}
                  <strong>{result.failCount}</strong> 个
                  {result.failures.length > result.failCount ? (
                    <>（下方共 {result.failures.length} 条失败明细）</>
                  ) : null}
                </>
              }
            />
            {result.failures.length > 0 ? (
              <Table<ImportFailure>
                rowKey={(row, index) => `${row.phone}-${row.reason}-${index}`}
                size="small"
                columns={failureColumns}
                dataSource={result.failures}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ y: 360 }}
              />
            ) : (
              <Typography.Text type="secondary">全部导入成功。</Typography.Text>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default BulkImportModal;
