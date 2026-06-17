import { Button, Modal, Select, Space, message } from 'antd';
import React, { useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { PendingFile, TableType } from '../types';

interface PendingFilesModalProps {
  open: boolean;
  pendingFiles: PendingFile[];
  onClose: () => void;
  onResolved: () => void;
}

const PendingFilesModal: React.FC<PendingFilesModalProps> = ({
  open,
  pendingFiles,
  onClose,
  onResolved,
}) => {
  const config = CompetitionDashboardService.getConfig();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [formMap, setFormMap] = useState<
    Record<string, { storeId?: string; tableType?: TableType }>
  >({});

  const handleResolve = async (pendingId: string) => {
    const form = formMap[pendingId];
    if (!form?.storeId || !form?.tableType) {
      message.warning('请选择门店和表类型');
      return;
    }
    setSubmittingId(pendingId);
    try {
      await CompetitionDashboardService.resolvePendingFile({
        pendingId,
        storeId: form.storeId,
        tableType: form.tableType,
      });
      message.success('已入库');
      onResolved();
    } catch (error: any) {
      message.error(error?.message || '处理失败');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Modal
      title="待处理文件"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      {pendingFiles.length === 0 ? (
        <div>暂无待处理文件</div>
      ) : (
        pendingFiles.map((file) => (
          <div
            key={file.id}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong>{file.fileName}</strong>
              <div style={{ color: '#888' }}>{file.reason}</div>
            </div>
            <Space wrap>
              <Select
                placeholder="选择门店"
                style={{ width: 180 }}
                options={config.stores.map((store) => ({
                  label: store.name,
                  value: store.id,
                }))}
                value={formMap[file.id]?.storeId}
                onChange={(storeId) =>
                  setFormMap((prev) => ({
                    ...prev,
                    [file.id]: { ...prev[file.id], storeId },
                  }))
                }
              />
              <Select
                placeholder="选择表类型"
                style={{ width: 160 }}
                options={[
                  { label: TABLE_TYPE_LABEL.new_car, value: 'new_car' },
                  { label: TABLE_TYPE_LABEL.entry_check, value: 'entry_check' },
                ]}
                value={formMap[file.id]?.tableType}
                onChange={(tableType) =>
                  setFormMap((prev) => ({
                    ...prev,
                    [file.id]: { ...prev[file.id], tableType },
                  }))
                }
              />
              <Button
                type="primary"
                loading={submittingId === file.id}
                onClick={() => handleResolve(file.id)}
              >
                确认入库
              </Button>
            </Space>
          </div>
        ))
      )}
    </Modal>
  );
};

export default PendingFilesModal;
