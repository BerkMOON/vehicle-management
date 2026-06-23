import { Alert, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { UploadConfirmDraft, UploadDraftParsePreview } from '../types';
import { parseExcelFile, readFileBuffer } from '../utils/excelParser';
import { parseFileName } from '../utils/fileNameParser';
import { BackendStoreLink, fetchBackendStoreLinks } from '../utils/storeIdMap';
import { prepareRowsForUpload } from '../utils/uploadFilter';

interface UploadConfirmModalProps {
  open: boolean;
  drafts: UploadConfirmDraft[];
  confirming: boolean;
  onDraftsChange: (drafts: UploadConfirmDraft[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

type DraftParsePreview = UploadDraftParsePreview;

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
  const [previews, setPreviews] = useState<Record<string, DraftParsePreview>>(
    {},
  );

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

  const previewKey = useMemo(
    () =>
      drafts
        .map(
          (item) => `${item.id}:${item.storeId ?? ''}:${item.tableType ?? ''}`,
        )
        .join('|'),
    [drafts],
  );

  useEffect(() => {
    if (!open) {
      setPreviews({});
      return;
    }

    let cancelled = false;

    drafts.forEach((draft) => {
      if (!draft.storeId || !draft.tableType) {
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[draft.id];
          return next;
        });
        return;
      }

      const link = linkMap.get(draft.storeId);
      if (!link) {
        setPreviews((prev) => ({
          ...prev,
          [draft.id]: {
            loading: false,
            parsedCount: 0,
            uploadCount: 0,
            mergedDuplicateCount: 0,
            skippedExistingCount: 0,
            errorCount: 0,
          },
        }));
        return;
      }

      setPreviews((prev) => ({
        ...prev,
        [draft.id]: {
          loading: true,
          parsedCount: 0,
          uploadCount: 0,
          mergedDuplicateCount: 0,
          skippedExistingCount: 0,
          errorCount: 0,
        },
      }));

      const store = config.stores.find((item) => item.id === draft.storeId);
      if (!store) return;

      void (async () => {
        try {
          const buffer = await readFileBuffer(draft.file);
          const parsedName = parseFileName(
            draft.fileName,
            config.stores,
            config,
          );
          const parsed = parseExcelFile({
            buffer,
            fileName: draft.fileName,
            tableType: draft.tableType!,
            store,
            uploadRecordId: `preview-${draft.id}`,
            reportDate: parsedName.reportDate ?? draft.reportDate,
            competitionConfig: config,
          });
          const prepared = await prepareRowsForUpload({
            rows: parsed.rows,
            tableType: draft.tableType!,
            backendStoreId: Number(link.backendStoreId),
            businessDates: parsed.businessDates,
          });
          if (cancelled) return;
          setPreviews((prev) => ({
            ...prev,
            [draft.id]: {
              loading: false,
              parsedCount: parsed.rawValidCount,
              uploadCount: prepared.uploadCount,
              mergedDuplicateCount: prepared.mergedDuplicateCount,
              skippedExistingCount: prepared.skippedExistingCount,
              errorCount: parsed.errors.length,
            },
          }));
        } catch {
          if (cancelled) return;
          setPreviews((prev) => ({
            ...prev,
            [draft.id]: {
              loading: false,
              parsedCount: 0,
              uploadCount: 0,
              mergedDuplicateCount: 0,
              skippedExistingCount: 0,
              errorCount: 0,
            },
          }));
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [open, previewKey, config, linkMap]);

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
  const totalUpload = Object.values(previews).reduce(
    (sum, item) => sum + (item.loading ? 0 : item.uploadCount),
    0,
  );
  const totalSkipped = Object.values(previews).reduce(
    (sum, item) => sum + (item.loading ? 0 : item.skippedExistingCount),
    0,
  );

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
      width={1080}
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
        message="上传前会查询后端已有数据，跳过该门店下已入库的「业务日期 + VIN」，仅提交新增行。"
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
            width: 220,
          },
          {
            title: '门店',
            width: 160,
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
            width: 130,
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
            title: '上传预览',
            width: 200,
            render: (_: unknown, record: UploadConfirmDraft) => {
              const preview = previews[record.id];
              if (!record.storeId || !record.tableType) {
                return (
                  <Typography.Text type="secondary">待选择</Typography.Text>
                );
              }
              if (!linkMap.has(record.storeId)) {
                return (
                  <Typography.Text type="danger">门店未关联</Typography.Text>
                );
              }
              if (!preview || preview.loading) {
                return (
                  <Typography.Text type="secondary">
                    对比后端中…
                  </Typography.Text>
                );
              }
              return (
                <Space direction="vertical" size={0}>
                  <span>新增上传 {preview.uploadCount} 行</span>
                  {preview.skippedExistingCount > 0 ? (
                    <Typography.Text type="warning">
                      跳过已入库 {preview.skippedExistingCount} 行
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary">
                      无已入库重复
                    </Typography.Text>
                  )}
                  {preview.errorCount > 0 && (
                    <Typography.Text type="danger">
                      {preview.errorCount} 行解析失败
                    </Typography.Text>
                  )}
                </Space>
              );
            },
          },
          {
            title: '报表日期',
            dataIndex: 'reportDate',
            width: 100,
            render: (date: string | null) => date || '-',
          },
          {
            title: '后台关联',
            width: 90,
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
            width: 60,
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
          共 {drafts.length} 个文件
          {!Object.values(previews).some((item) => item.loading)
            ? `，预计新增上传 ${totalUpload} 行${
                totalSkipped > 0 ? `，跳过已入库 ${totalSkipped} 行` : ''
              }`
            : ''}
        </Typography.Text>
      </Space>
    </Modal>
  );
};

export default UploadConfirmModal;
