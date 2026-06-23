import { Alert, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { UploadConfirmDraft } from '../types';
import { BackendStoreLink, fetchBackendStoreLinks } from '../utils/storeIdMap';

interface UploadConfirmModalProps {
  open: boolean;
  drafts: UploadConfirmDraft[];
  confirming: boolean;
  onDraftsChange: (drafts: UploadConfirmDraft[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const UploadConfirmModal: React.FC<UploadConfirmModalProps> = ({
  open,
  drafts,
  confirming,
  onDraftsChange,
  onConfirm,
  onCancel,
}) => {
  const config = CompetitionDashboardService.getConfig();
  const [storeLinks, setStoreLinks] = useState<BackendStoreLink[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchBackendStoreLinks(config)
      .then(setStoreLinks)
      .catch(() => setStoreLinks([]));
  }, [open, config]);

  const linkMap = useMemo(
    () => new Map(storeLinks.map((link) => [link.competitionStoreId, link])),
    [storeLinks],
  );

  const storeOptions = useMemo(
    () =>
      config.stores
        .filter((store) => store.active)
        .map((store) => ({ label: store.name, value: store.id })),
    [config.stores],
  );

  const tableTypeOptions = [
    { label: TABLE_TYPE_LABEL.new_car, value: 'new_car' as const },
    { label: TABLE_TYPE_LABEL.entry_check, value: 'entry_check' as const },
  ];

  const incompleteCount = drafts.filter(
    (item) => !item.storeId || !item.tableType,
  ).length;
  const unlinkCount = drafts.filter(
    (item) => item.storeId && !linkMap.has(item.storeId),
  ).length;

  const updateDraft = (id: string, patch: Partial<UploadConfirmDraft>) => {
    onDraftsChange(
      drafts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleStoreChange = (id: string, storeId: string) => {
    const store = config.stores.find((item) => item.id === storeId);
    updateDraft(id, {
      storeId,
      storeName: store?.name ?? null,
    });
  };

  return (
    <Modal
      title="确认上传信息"
      open={open}
      width={920}
      okText="确认上传"
      cancelText="取消"
      confirmLoading={confirming}
      okButtonProps={{
        disabled: drafts.length === 0 || incompleteCount > 0,
      }}
      onOk={onConfirm}
      onCancel={onCancel}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="请核对以下文件的门店与表类型，确认无误后再提交到后端。"
      />

      {incompleteCount > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`还有 ${incompleteCount} 个文件未选择门店或表类型`}
        />
      )}

      {unlinkCount > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={`有 ${unlinkCount} 个门店未匹配到后台 store_id，上传将失败，请更换门店或联系管理员`}
        />
      )}

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={drafts}
        scroll={{ y: 360 }}
        columns={[
          {
            title: '文件名',
            dataIndex: 'fileName',
            ellipsis: true,
            width: 260,
          },
          {
            title: '门店',
            width: 180,
            render: (_: unknown, record: UploadConfirmDraft) => (
              <Select
                placeholder="选择门店"
                style={{ width: '100%' }}
                options={storeOptions}
                value={record.storeId ?? undefined}
                onChange={(storeId) => handleStoreChange(record.id, storeId)}
              />
            ),
          },
          {
            title: '表类型',
            width: 150,
            render: (_: unknown, record: UploadConfirmDraft) => (
              <Select
                placeholder="选择类型"
                style={{ width: '100%' }}
                options={tableTypeOptions}
                value={record.tableType ?? undefined}
                onChange={(tableType) => updateDraft(record.id, { tableType })}
              />
            ),
          },
          {
            title: '报表日期',
            dataIndex: 'reportDate',
            width: 110,
            render: (date: string | null) => date || '-',
          },
          {
            title: '识别说明',
            dataIndex: 'matchHint',
            width: 140,
            render: (hint: string) => (
              <Typography.Text type="secondary">{hint}</Typography.Text>
            ),
          },
          {
            title: '后台关联',
            width: 100,
            render: (_: unknown, record: UploadConfirmDraft) => {
              if (!record.storeId) return <Tag>待选择</Tag>;
              const link = linkMap.get(record.storeId);
              if (!link) return <Tag color="error">未关联</Tag>;
              return (
                <Tag color="success" title={link.backendStoreName}>
                  已关联
                </Tag>
              );
            },
          },
          {
            title: '操作',
            width: 70,
            render: (_: unknown, record: UploadConfirmDraft) => (
              <Typography.Link
                type="danger"
                onClick={() =>
                  onDraftsChange(drafts.filter((item) => item.id !== record.id))
                }
              >
                移除
              </Typography.Link>
            ),
          },
        ]}
      />

      <Space style={{ marginTop: 12 }}>
        <Typography.Text type="secondary">
          共 {drafts.length} 个文件，确认后将解析 Excel 并写入后端
        </Typography.Text>
      </Space>
    </Modal>
  );
};

export default UploadConfirmModal;
