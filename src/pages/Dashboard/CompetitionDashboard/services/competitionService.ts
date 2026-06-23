import { CompetitionDashboardAPI } from '@/services/competitionDashboard';
import type { CompetitionRowInput } from '@/services/competitionDashboard/typings.d';
import dayjs from 'dayjs';
import {
  AnomalyItem,
  BatchUploadResult,
  CompetitionConfig,
  MetricsDateRange,
  ParseErrorDraft,
  ParseErrorFixInput,
  ParseErrorRow,
  PendingFile,
  RefreshMetricsProgressHandlers,
  StoreMetrics,
  StoreReturnStatus,
  TableType,
  UploadConfirmDraft,
  UploadRecord,
  VehicleRow,
} from '../types';
import {
  assertApiSuccess,
  mapBackendMetricsToStoreMetrics,
  mergeReturnStatus,
} from '../utils/apiAdapter';
import { getDefaultMetricsDateRange } from '../utils/date';
import {
  base64ToBuffer,
  fileToBase64,
  parseExcelFile,
  readFileBuffer,
} from '../utils/excelParser';
import { parseFileName } from '../utils/fileNameParser';
import {
  BackendStoreLink,
  fetchBackendStoreLinks,
  invalidateBackendStoreCache,
} from '../utils/storeIdMap';
import { prepareRowsForUpload } from '../utils/uploadFilter';
import { cleanVin } from '../utils/vin';
import {
  appendParseErrors,
  clearAllLocalData,
  clearParseErrors,
  getAnomalies,
  getConfig,
  getParseErrors,
  getPendingFiles,
  getUploadRecords,
  initCompetitionStorage,
  removeParseError,
  saveAnomalies,
  saveConfig,
  savePendingFiles,
  saveUploadRecords,
} from './dataProvider';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function enrichParseErrors(
  drafts: ParseErrorDraft[],
  context: {
    storeId?: string;
    storeName?: string;
    tableType?: TableType;
    fileName: string;
  },
): ParseErrorRow[] {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return drafts.map((draft) => ({
    ...draft,
    fileName: draft.fileName || context.fileName,
    storeId: draft.storeId ?? context.storeId,
    storeName: draft.storeName ?? context.storeName,
    tableType: draft.tableType ?? context.tableType,
    id: createId('parse-err'),
    status: 'open' as const,
    createdAt: now,
  }));
}

function getBackendStoreId(
  links: BackendStoreLink[],
  competitionStoreId: string,
): number | null {
  const link = links.find(
    (item) => item.competitionStoreId === competitionStoreId,
  );
  if (!link) return null;
  const storeId = Number(link.backendStoreId);
  return Number.isFinite(storeId) ? storeId : null;
}

function toApiRows(rows: VehicleRow[]): CompetitionRowInput[] {
  return rows.map((row) => ({
    business_date: row.businessDate,
    vin: row.vin,
    installed_flag: row.installedFlag,
    remark: row.remark,
  }));
}

async function postRowsToBackend(params: {
  tableType: TableType;
  backendStoreId: number;
  rows: VehicleRow[];
}) {
  if (params.rows.length === 0) return;
  const payload = {
    store_id: params.backendStoreId,
    rows: toApiRows(params.rows),
  };
  if (params.tableType === 'new_car') {
    const res = await CompetitionDashboardAPI.replaceNewCarRows(payload);
    return assertApiSuccess(res, '新车数据写入失败');
  }
  const res = await CompetitionDashboardAPI.replaceAfterSalesRows(payload);
  return assertApiSuccess(res, '售后数据写入失败');
}

async function fetchMetricsFromBackend(
  config: CompetitionConfig,
  metricsDateRange: MetricsDateRange,
): Promise<{ metrics: StoreMetrics[]; links: BackendStoreLink[] }> {
  const links = await fetchBackendStoreLinks(config);
  const res = await CompetitionDashboardAPI.getMetrics({
    start_date: metricsDateRange.startDate,
    end_date: metricsDateRange.endDate,
  });
  const data = assertApiSuccess(res, '指标查询失败');
  const metrics = mapBackendMetricsToStoreMetrics({
    config,
    items: data.list || [],
    links,
    calculatedAt: data.calculated_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
    metricsDateRange,
  });
  return { metrics, links };
}

export const CompetitionDashboardService = {
  getConfig,
  saveConfig,
  initStorage: initCompetitionStorage,

  async recalculateMetrics(
    metricsDateRange: MetricsDateRange,
  ): Promise<StoreMetrics[]> {
    const config = getConfig();
    const { metrics } = await fetchMetricsFromBackend(config, metricsDateRange);
    return metrics;
  },

  async refreshMetrics(metricsDateRange?: MetricsDateRange): Promise<{
    metrics: StoreMetrics[];
    bindingsCount: number;
    detectionsCount: number;
    linkedStoreCount: number;
  }> {
    return new Promise((resolve, reject) => {
      this.refreshMetricsIncremental(
        {
          onExcelReady: () => {},
          onStoreStatus: () => {},
          onStoreMetrics: () => {},
          onComplete: resolve,
        },
        metricsDateRange,
      ).catch(reject);
    });
  },

  async refreshMetricsIncremental(
    handlers: RefreshMetricsProgressHandlers,
    metricsDateRange?: MetricsDateRange,
  ): Promise<void> {
    await initCompetitionStorage();
    const config = getConfig();
    const range = metricsDateRange ?? getDefaultMetricsDateRange(config);
    const activeStores = config.stores.filter((store) => store.active);

    let links: BackendStoreLink[] = [];
    try {
      links = await fetchBackendStoreLinks(config);
    } catch (error) {
      console.warn('[CompetitionDashboard] fetch store links failed', error);
    }

    activeStores.forEach((store) => {
      const link = links.find((item) => item.competitionStoreId === store.id);
      handlers.onStoreStatus(store.id, link ? 'loading' : 'no_link');
    });

    try {
      const { metrics, links: resolvedLinks } = await fetchMetricsFromBackend(
        config,
        range,
      );
      handlers.onExcelReady(metrics);
      activeStores.forEach((store) => {
        const link = resolvedLinks.find(
          (item) => item.competitionStoreId === store.id,
        );
        const storeMetrics = metrics.find((item) => item.storeId === store.id);
        if (storeMetrics) {
          handlers.onStoreMetrics(store.id, storeMetrics);
        }
        handlers.onStoreStatus(store.id, link ? 'done' : 'no_link');
      });
      saveAnomalies([]);
      handlers.onComplete({
        metrics,
        bindingsCount: 0,
        detectionsCount: 0,
        linkedStoreCount: resolvedLinks.length,
      });
    } catch (error) {
      console.error('[CompetitionDashboard] metrics refresh failed', error);
      activeStores.forEach((store) => {
        handlers.onStoreStatus(store.id, 'error');
      });
      throw error;
    }
  },

  async fetchReturnStatus(date: string): Promise<StoreReturnStatus[]> {
    const config = getConfig();
    const links = await fetchBackendStoreLinks(config);
    const res = await CompetitionDashboardAPI.getReturnStatus({ date });
    const data = assertApiSuccess(res, '回传监控查询失败');
    return mergeReturnStatus({
      config,
      links,
      apiList: data.list || [],
    });
  },

  getUploadRecords,
  getPendingFiles,
  getAnomalies,
  getParseErrors,
  clearParseErrors,
  clearAllLocalData: () => {
    clearAllLocalData();
    invalidateBackendStoreCache();
  },

  async prepareUploadDrafts(files: File[]): Promise<UploadConfirmDraft[]> {
    await initCompetitionStorage();
    const config = getConfig();

    return files.map((file) => {
      const parsed = parseFileName(file.name, config.stores, config);
      let matchHint = '文件名自动识别';
      if (!parsed.store && !parsed.tableType) {
        matchHint = '未识别门店与表类型，请手动选择';
      } else if (!parsed.store) {
        matchHint = '未识别门店，请手动选择';
      } else if (!parsed.tableType) {
        matchHint = '未识别表类型，请手动选择';
      }

      return {
        id: createId('draft'),
        file,
        fileName: file.name,
        storeId: parsed.store?.id ?? null,
        storeName: parsed.store?.name ?? null,
        tableType: parsed.tableType,
        reportDate: parsed.reportDate,
        matchHint,
      };
    });
  },

  async confirmUploadFiles(
    drafts: UploadConfirmDraft[],
    uploadedBy?: string,
  ): Promise<BatchUploadResult> {
    await initCompetitionStorage();
    const config = getConfig();
    const links = await fetchBackendStoreLinks(config);
    const records: UploadRecord[] = [];
    const parseErrors: ParseErrorRow[] = [];
    let pendingCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const draft of drafts) {
      if (!draft.storeId || !draft.tableType) {
        errorCount += 1;
        parseErrors.push(
          ...enrichParseErrors(
            [
              {
                fileName: draft.fileName,
                rowNo: 0,
                reason: '未选择门店或表类型',
              },
            ],
            { fileName: draft.fileName },
          ),
        );
        continue;
      }

      const store = config.stores.find((item) => item.id === draft.storeId);
      if (!store) {
        errorCount += 1;
        parseErrors.push(
          ...enrichParseErrors(
            [{ fileName: draft.fileName, rowNo: 0, reason: '门店不存在' }],
            {
              fileName: draft.fileName,
              storeId: draft.storeId,
              tableType: draft.tableType,
            },
          ),
        );
        continue;
      }

      const backendStoreId = getBackendStoreId(links, store.id);
      if (!backendStoreId) {
        errorCount += 1;
        parseErrors.push(
          ...enrichParseErrors(
            [
              {
                fileName: draft.fileName,
                rowNo: 0,
                reason: `门店「${store.name}」未匹配到后台 store_id`,
              },
            ],
            {
              fileName: draft.fileName,
              storeId: store.id,
              storeName: store.name,
              tableType: draft.tableType,
            },
          ),
        );
        continue;
      }

      try {
        const buffer = await readFileBuffer(draft.file);
        const uploadRecordId = createId('upload');
        const parsedName = parseFileName(draft.fileName, config.stores, config);
        const parsed = parseExcelFile({
          buffer,
          fileName: draft.fileName,
          tableType: draft.tableType,
          store,
          uploadRecordId,
          reportDate: parsedName.reportDate ?? draft.reportDate,
          competitionConfig: config,
        });

        parseErrors.push(
          ...enrichParseErrors(parsed.errors, {
            storeId: store.id,
            storeName: store.name,
            tableType: draft.tableType,
            fileName: draft.fileName,
          }),
        );

        const prepared = await prepareRowsForUpload({
          rows: parsed.rows,
          tableType: draft.tableType,
          backendStoreId,
          businessDates: parsed.businessDates,
        });

        if (prepared.uploadCount > 0) {
          await postRowsToBackend({
            tableType: draft.tableType,
            backendStoreId,
            rows: prepared.toUpload,
          });
        }

        const statusMessages: string[] = [];
        if (parsed.errors.length > 0) {
          statusMessages.push(`${parsed.errors.length} 行解析失败`);
        }
        if (prepared.skippedExistingCount > 0) {
          statusMessages.push(`跳过已入库 ${prepared.skippedExistingCount} 行`);
        }
        if (prepared.uploadCount === 0 && parsed.rows.length > 0) {
          statusMessages.push('无新增行需上传');
        }

        records.push({
          id: uploadRecordId,
          storeId: store.id,
          storeName: store.name,
          tableType: draft.tableType,
          businessDates: parsed.businessDates,
          reportDate: parsedName.reportDate || draft.reportDate || undefined,
          fileName: draft.fileName,
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          uploadedBy,
          rowCount: parsed.rawValidCount + parsed.errors.length,
          validRowCount: prepared.uploadCount,
          skippedExistingCount: prepared.skippedExistingCount,
          parseStatus:
            parsed.errors.length > 0
              ? 'partial'
              : prepared.uploadCount > 0 || parsed.rows.length === 0
              ? 'success'
              : 'success',
          errorMessage:
            statusMessages.length > 0 ? statusMessages.join('；') : undefined,
        });
        successCount += 1;
      } catch (error: any) {
        errorCount += 1;
        parseErrors.push(
          ...enrichParseErrors(
            [
              {
                fileName: draft.fileName,
                rowNo: 0,
                reason: error?.message || '文件解析或上传失败',
              },
            ],
            {
              fileName: draft.fileName,
              storeId: draft.storeId ?? undefined,
              storeName: store?.name,
              tableType: draft.tableType ?? undefined,
            },
          ),
        );
      }
    }

    if (records.length > 0) {
      saveUploadRecords([...getUploadRecords(), ...records]);
    }
    if (parseErrors.length > 0) {
      appendParseErrors(parseErrors);
    }

    return {
      successCount,
      pendingCount,
      errorCount,
      records,
      parseErrors,
    };
  },

  /** @deprecated 请使用 prepareUploadDrafts + confirmUploadFiles */
  async uploadFiles(
    files: File[],
    uploadedBy?: string,
  ): Promise<BatchUploadResult> {
    const drafts = await this.prepareUploadDrafts(files);
    const ready = drafts.filter((item) => item.storeId && item.tableType);
    const pending = drafts.filter((item) => !item.storeId || !item.tableType);

    let pendingFiles = getPendingFiles();
    for (const draft of pending) {
      pendingFiles = [
        ...pendingFiles,
        {
          id: createId('pending'),
          fileName: draft.fileName,
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          reason: draft.matchHint,
          fileBase64: await fileToBase64(draft.file),
        },
      ];
    }
    savePendingFiles(pendingFiles);

    const result = await this.confirmUploadFiles(ready, uploadedBy);
    return {
      ...result,
      pendingCount: result.pendingCount + pending.length,
    };
  },

  async resolvePendingFile(params: {
    pendingId: string;
    storeId: string;
    tableType: TableType;
  }) {
    await initCompetitionStorage();
    const pendingFiles = getPendingFiles();
    const target = pendingFiles.find((item) => item.id === params.pendingId);
    if (!target?.fileBase64) {
      throw new Error('待处理文件不存在');
    }

    const config = getConfig();
    const store = config.stores.find((item) => item.id === params.storeId);
    if (!store) throw new Error('门店不存在');

    const links = await fetchBackendStoreLinks(config);
    const backendStoreId = getBackendStoreId(links, store.id);
    if (!backendStoreId) {
      throw new Error(`门店「${store.name}」未匹配到后台 store_id`);
    }

    const parsedName = parseFileName(target.fileName, config.stores, config);
    const buffer = await base64ToBuffer(target.fileBase64);
    const uploadRecordId = createId('upload');
    const parsed = parseExcelFile({
      buffer,
      fileName: target.fileName,
      tableType: params.tableType,
      store,
      uploadRecordId,
      reportDate: parsedName.reportDate,
      competitionConfig: config,
    });

    const prepared = await prepareRowsForUpload({
      rows: parsed.rows,
      tableType: params.tableType,
      backendStoreId,
      businessDates: parsed.businessDates,
    });

    if (prepared.uploadCount > 0) {
      await postRowsToBackend({
        tableType: params.tableType,
        backendStoreId,
        rows: prepared.toUpload,
      });
    }

    const record: UploadRecord = {
      id: uploadRecordId,
      storeId: store.id,
      storeName: store.name,
      tableType: params.tableType,
      businessDates: parsed.businessDates,
      reportDate: parsedName.reportDate || undefined,
      fileName: target.fileName,
      uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      uploadedBy: undefined,
      rowCount: parsed.rawValidCount + parsed.errors.length,
      validRowCount: prepared.uploadCount,
      skippedExistingCount: prepared.skippedExistingCount,
      parseStatus: parsed.errors.length > 0 ? 'partial' : 'success',
      errorMessage:
        prepared.skippedExistingCount > 0
          ? `跳过已入库 ${prepared.skippedExistingCount} 行`
          : undefined,
    };

    if (parsed.errors.length > 0) {
      appendParseErrors(
        enrichParseErrors(parsed.errors, {
          storeId: store.id,
          storeName: store.name,
          tableType: params.tableType,
          fileName: target.fileName,
        }),
      );
    }

    saveUploadRecords([...getUploadRecords(), record]);
    savePendingFiles(
      pendingFiles.filter((item) => item.id !== params.pendingId),
    );
    return record;
  },

  resolveAnomaly(anomalyId: string) {
    const next = getAnomalies().map((item) =>
      item.id === anomalyId ? { ...item, status: 'resolved' as const } : item,
    );
    saveAnomalies(next);
  },

  /** 手动修正解析失败行并追加写入后端 */
  async submitParseErrorFix(input: ParseErrorFixInput): Promise<void> {
    await initCompetitionStorage();
    const config = getConfig();
    const store = config.stores.find((item) => item.id === input.storeId);
    if (!store) throw new Error('门店不存在');

    const vinResult = cleanVin(input.vin);
    if (!vinResult.valid) {
      throw new Error(vinResult.reason || '车架号无效');
    }
    if (!input.businessDate?.trim()) {
      throw new Error('请填写业务日期');
    }

    const links = await fetchBackendStoreLinks(config);
    const backendStoreId = getBackendStoreId(links, store.id);
    if (!backendStoreId) {
      throw new Error(`门店「${store.name}」未匹配到后台 store_id`);
    }

    const prepared = await prepareRowsForUpload({
      rows: [
        {
          id: createId('manual-fix'),
          storeId: store.id,
          storeName: store.name,
          tableType: input.tableType,
          vin: vinResult.vin,
          businessDate: input.businessDate.trim(),
          installedFlag: input.installedFlag?.trim() || undefined,
          remark: input.remark?.trim() || undefined,
          uploadRecordId: 'manual-fix',
          sourceFileName: '',
          rowNo: 0,
        },
      ],
      tableType: input.tableType,
      backendStoreId,
      businessDates: [input.businessDate.trim()],
    });

    if (prepared.uploadCount === 0) {
      removeParseError(input.errorId);
      throw new Error('该车架号在该业务日已入库，无需重复提交');
    }

    await postRowsToBackend({
      tableType: input.tableType,
      backendStoreId,
      rows: prepared.toUpload,
    });

    removeParseError(input.errorId);
  },
};

export type {
  AnomalyItem,
  CompetitionConfig,
  PendingFile,
  StoreMetrics,
  UploadRecord,
};
