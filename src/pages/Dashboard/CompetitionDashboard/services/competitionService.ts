import dayjs from 'dayjs';
import {
  AnomalyItem,
  BackendBinding,
  BackendDetection,
  BatchUploadResult,
  CompetitionConfig,
  PendingFile,
  RefreshMetricsProgressHandlers,
  StoreMetrics,
  TableType,
  UploadRecord,
} from '../types';
import {
  base64ToBuffer,
  fileToBase64,
  parseExcelFile,
  readFileBuffer,
} from '../utils/excelParser';
import { parseFileName } from '../utils/fileNameParser';
import { calculateStoreMetrics, detectAnomalies } from '../utils/metrics';
import {
  appendParseErrors,
  clearAllLocalData,
  clearParseErrors,
  fetchBackendStoreLinks,
  fetchStoreBackendData,
  getAnomalies,
  getConfig,
  getMetricsSnapshot,
  getParseErrors,
  getPendingFiles,
  getUploadRecords,
  getVehicleRows,
  replaceRowsByBusinessDates,
  saveAnomalies,
  saveConfig,
  saveMetricsSnapshot,
  savePendingFiles,
  saveUploadRecords,
  saveVehicleRows,
} from './dataProvider';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CompetitionDashboardService = {
  getConfig,
  saveConfig,

  async refreshMetrics(): Promise<{
    metrics: StoreMetrics[];
    bindingsCount: number;
    detectionsCount: number;
    linkedStoreCount: number;
  }> {
    return new Promise((resolve) => {
      this.refreshMetricsIncremental({
        onExcelReady: () => {},
        onStoreStatus: () => {},
        onStoreMetrics: () => {},
        onComplete: resolve,
      });
    });
  },

  /** 按门店增量刷新：先展示 Excel 分母，各店后台数据就绪后逐店更新分子 */
  async refreshMetricsIncremental(
    handlers: RefreshMetricsProgressHandlers,
  ): Promise<void> {
    const config = getConfig();
    const vehicleRows = getVehicleRows();
    const activeStores = config.stores.filter((store) => store.active);

    let storeLinks: Awaited<ReturnType<typeof fetchBackendStoreLinks>> = [];
    try {
      storeLinks = await fetchBackendStoreLinks(config);
    } catch (error) {
      console.warn('[CompetitionDashboard] fetch store links failed', error);
    }

    const linkMap = new Map(
      storeLinks.map((link) => [link.competitionStoreId, link]),
    );

    const metricsMap = new Map<string, StoreMetrics>();
    activeStores.forEach((store) => {
      metricsMap.set(
        store.id,
        calculateStoreMetrics({
          config,
          storeId: store.id,
          vehicleRows,
          bindings: [],
          detections: [],
        }),
      );
    });

    const excelMetrics = activeStores.map((store) => metricsMap.get(store.id)!);
    handlers.onExcelReady(excelMetrics);

    const allBindings: BackendBinding[] = [];
    const allDetections: BackendDetection[] = [];

    await Promise.all(
      activeStores.map(async (store) => {
        const link = linkMap.get(store.id);
        if (!link) {
          handlers.onStoreStatus(store.id, 'no_link');
          return;
        }

        handlers.onStoreStatus(store.id, 'loading');
        try {
          const { bindings, detections } = await fetchStoreBackendData(
            link,
            config,
          );
          allBindings.push(...bindings);
          allDetections.push(...detections);

          const storeMetrics = calculateStoreMetrics({
            config,
            storeId: store.id,
            vehicleRows,
            bindings,
            detections,
          });
          metricsMap.set(store.id, storeMetrics);
          handlers.onStoreMetrics(store.id, storeMetrics);
          handlers.onStoreStatus(store.id, 'done');
        } catch (error) {
          console.warn(
            `[CompetitionDashboard] store refresh failed: ${store.name}`,
            error,
          );
          handlers.onStoreStatus(store.id, 'error');
        }
      }),
    );

    const metrics = activeStores.map((store) => metricsMap.get(store.id)!);
    const backendLoaded = allBindings.length > 0 || allDetections.length > 0;
    const anomalies = detectAnomalies({
      vehicleRows,
      bindings: allBindings,
      detections: allDetections,
      enableBackendCheck: backendLoaded,
    });
    saveMetricsSnapshot(metrics);
    saveAnomalies(anomalies);

    handlers.onComplete({
      metrics,
      bindingsCount: allBindings.length,
      detectionsCount: allDetections.length,
      linkedStoreCount: storeLinks.length,
    });
  },

  getMetricsSnapshot,
  getVehicleRows,
  getUploadRecords,
  getPendingFiles,
  getAnomalies,
  getParseErrors,
  clearParseErrors,
  clearAllLocalData,

  async uploadFiles(
    files: File[],
    uploadedBy?: string,
  ): Promise<BatchUploadResult> {
    const config = getConfig();
    const records: UploadRecord[] = [];
    const parseErrors: BatchUploadResult['parseErrors'] = [];
    let pendingFiles = getPendingFiles();
    let successCount = 0;
    let pendingCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const parsedName = parseFileName(file.name, config.stores, config);
      if (!parsedName.store || !parsedName.tableType) {
        pendingCount += 1;
        pendingFiles = [
          ...pendingFiles,
          {
            id: createId('pending'),
            fileName: file.name,
            uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            reason: !parsedName.store
              ? '无法从文件名匹配门店'
              : '无法从文件名识别表类型',
            fileBase64: await fileToBase64(file),
          },
        ];
        continue;
      }

      try {
        const buffer = await readFileBuffer(file);
        const uploadRecordId = createId('upload');
        const parsed = parseExcelFile({
          buffer,
          fileName: file.name,
          tableType: parsedName.tableType,
          store: parsedName.store,
          uploadRecordId,
          reportDate: parsedName.reportDate,
          competitionConfig: config,
        });

        parseErrors.push(...parsed.errors);

        const mergedRows = replaceRowsByBusinessDates({
          storeId: parsedName.store.id,
          tableType: parsedName.tableType,
          businessDates: parsed.businessDates,
          newRows: parsed.rows,
        });
        saveVehicleRows(mergedRows);

        const record: UploadRecord = {
          id: uploadRecordId,
          storeId: parsedName.store.id,
          storeName: parsedName.store.name,
          tableType: parsedName.tableType,
          businessDates: parsed.businessDates,
          reportDate: parsedName.reportDate || undefined,
          fileName: file.name,
          uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          uploadedBy,
          rowCount: parsed.rows.length + parsed.errors.length,
          validRowCount: parsed.rows.length,
          parseStatus: parsed.errors.length > 0 ? 'partial' : 'success',
          errorMessage:
            parsed.errors.length > 0
              ? `${parsed.errors.length} 行解析失败`
              : undefined,
        };
        records.push(record);
        successCount += 1;
      } catch (error: any) {
        errorCount += 1;
        parseErrors.push({
          fileName: file.name,
          rowNo: 0,
          reason: error?.message || '文件解析失败',
        });
      }
    }

    if (records.length > 0) {
      saveUploadRecords([...getUploadRecords(), ...records]);
    }
    if (parseErrors.length > 0) {
      appendParseErrors(parseErrors);
    }
    savePendingFiles(pendingFiles);

    return {
      successCount,
      pendingCount,
      errorCount,
      records,
      parseErrors,
    };
  },

  async resolvePendingFile(params: {
    pendingId: string;
    storeId: string;
    tableType: TableType;
  }) {
    const pendingFiles = getPendingFiles();
    const target = pendingFiles.find((item) => item.id === params.pendingId);
    if (!target?.fileBase64) {
      throw new Error('待处理文件不存在');
    }

    const config = getConfig();
    const store = config.stores.find((item) => item.id === params.storeId);
    if (!store) throw new Error('门店不存在');

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

    const mergedRows = replaceRowsByBusinessDates({
      storeId: store.id,
      tableType: params.tableType,
      businessDates: parsed.businessDates,
      newRows: parsed.rows,
    });
    saveVehicleRows(mergedRows);

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
      rowCount: parsed.rows.length + parsed.errors.length,
      validRowCount: parsed.rows.length,
      parseStatus: parsed.errors.length > 0 ? 'partial' : 'success',
    };

    if (parsed.errors.length > 0) {
      appendParseErrors(parsed.errors);
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
};

export type {
  AnomalyItem,
  CompetitionConfig,
  PendingFile,
  StoreMetrics,
  UploadRecord,
};
