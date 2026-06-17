import dayjs from 'dayjs';
import {
  AnomalyItem,
  BackendBinding,
  BackendDetection,
  CompetitionConfig,
  StoreMetrics,
  StoreReturnStatus,
  VehicleRow,
} from '../types';
import { getUploadCoverageDates } from './fileNameParser';
import { uniqueVins } from './vin';

function recordCoversDate(
  record: {
    fileName: string;
    businessDates: string[];
    reportDate?: string | null;
  },
  date: string,
  config: CompetitionConfig,
): boolean {
  return getUploadCoverageDates(record, config).includes(date);
}

function calcRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number((numerator / denominator).toFixed(6));
}

function isExcelNotInstalled(flag?: string): boolean {
  if (!flag) return true;
  const text = flag.trim();
  if (!text) return true;
  if (text.includes('否') || text.includes('未') || text.includes('无'))
    return true;
  if (text.includes('是') || text.includes('已') || text.includes('有'))
    return false;
  return true;
}

export function buildReturnStatus(params: {
  config: CompetitionConfig;
  date: string;
  vehicleRows: VehicleRow[];
  uploadRecords: Array<{
    storeId: string;
    tableType: string;
    fileName: string;
    businessDates: string[];
    reportDate?: string | null;
    uploadedAt: string;
    uploadedBy?: string;
    validRowCount: number;
  }>;
}): StoreReturnStatus[] {
  const { config, date, vehicleRows, uploadRecords } = params;

  return config.stores
    .filter((store) => store.active)
    .map((store) => {
      const newCarRecord = uploadRecords.find(
        (item) =>
          item.storeId === store.id &&
          item.tableType === 'new_car' &&
          recordCoversDate(item, date, config),
      );
      const entryRecord = uploadRecords.find(
        (item) =>
          item.storeId === store.id &&
          item.tableType === 'entry_check' &&
          recordCoversDate(item, date, config),
      );

      const newCarRows = vehicleRows.filter(
        (row) =>
          row.storeId === store.id &&
          row.tableType === 'new_car' &&
          row.businessDate === date,
      );
      const entryRows = vehicleRows.filter(
        (row) =>
          row.storeId === store.id &&
          row.tableType === 'entry_check' &&
          row.businessDate === date,
      );

      const newCar: StoreReturnStatus['newCar'] = {
        uploaded: !!newCarRecord || newCarRows.length > 0,
        uploadedAt: newCarRecord?.uploadedAt,
        uploadedBy: newCarRecord?.uploadedBy,
        rowCount: newCarRecord?.validRowCount ?? newCarRows.length,
      };
      const entryCheck: StoreReturnStatus['entryCheck'] = {
        uploaded: !!entryRecord || entryRows.length > 0,
        uploadedAt: entryRecord?.uploadedAt,
        uploadedBy: entryRecord?.uploadedBy,
        rowCount: entryRecord?.validRowCount ?? entryRows.length,
      };

      return {
        storeId: store.id,
        storeName: store.name,
        brand: store.brand,
        newCar,
        entryCheck,
        completed: newCar.uploaded && entryCheck.uploaded,
      };
    });
}

export function calculateStoreMetrics(params: {
  config: CompetitionConfig;
  storeId: string;
  vehicleRows: VehicleRow[];
  bindings: BackendBinding[];
  detections: BackendDetection[];
}): StoreMetrics {
  const { config, storeId, vehicleRows, bindings, detections } = params;
  const store = config.stores.find((item) => item.id === storeId);
  if (!store) {
    throw new Error(`unknown store: ${storeId}`);
  }

  const inPeriod = (date: string) =>
    dayjs(date).isAfter(dayjs(config.startDate).subtract(1, 'day')) &&
    dayjs(date).isBefore(dayjs(config.endDate).add(1, 'day'));

  const storeRows = vehicleRows.filter((row) => row.storeId === storeId);
  const newCarRows = storeRows.filter(
    (row) => row.tableType === 'new_car' && inPeriod(row.businessDate),
  );
  const entryRows = storeRows.filter(
    (row) => row.tableType === 'entry_check' && inPeriod(row.businessDate),
  );

  const newCarSales = uniqueVins(newCarRows.map((row) => row.vin)).length;
  const entryVinSet = new Set(uniqueVins(entryRows.map((row) => row.vin)));
  const entryTotal = entryVinSet.size;

  const bindingMap = bindings
    .filter((item) => item.storeId === storeId && inPeriod(item.bindDate))
    .reduce((map, item) => {
      const prev = map.get(item.vin);
      if (!prev || dayjs(item.bindDate).isBefore(prev)) {
        map.set(item.vin, item.bindDate);
      }
      return map;
    }, new Map<string, string>());

  const entryDateMap = entryRows.reduce((map, row) => {
    const prev = map.get(row.vin);
    if (!prev || dayjs(row.businessDate).isBefore(prev)) {
      map.set(row.vin, row.businessDate);
    }
    return map;
  }, new Map<string, string>());

  const entryVinInstalledMap = new Map<string, boolean>();
  entryRows.forEach((row) => {
    const installed = !isExcelNotInstalled(row.installedFlag);
    const prev = entryVinInstalledMap.get(row.vin);
    if (prev === undefined) {
      entryVinInstalledMap.set(row.vin, installed);
    } else if (installed) {
      entryVinInstalledMap.set(row.vin, true);
    }
  });
  let entryNotInstalledExcel = 0;
  entryVinInstalledMap.forEach((installed) => {
    if (!installed) entryNotInstalledExcel += 1;
  });

  let entryNotInstalled = 0;
  entryDateMap.forEach((entryDate, vin) => {
    const bindDate = bindingMap.get(vin);
    if (!bindDate || dayjs(bindDate).isAfter(entryDate)) {
      entryNotInstalled += 1;
    }
  });

  const newBindings = uniqueVins(
    bindings
      .filter((item) => item.storeId === storeId && inPeriod(item.bindDate))
      .map((item) => item.vin),
  ).length;

  const entryVinSetForBind = new Set(entryDateMap.keys());
  const entryNewBindings = uniqueVins(
    bindings
      .filter(
        (item) =>
          item.storeId === storeId &&
          inPeriod(item.bindDate) &&
          entryVinSetForBind.has(item.vin),
      )
      .map((item) => item.vin),
  ).length;

  // 入厂检测覆盖率分子：entry-inspection-log 中竞赛期内 VIN，且落在该店售后入厂 Excel 集合内
  const inspectedCount = uniqueVins(
    detections
      .filter(
        (item) =>
          item.storeId === storeId &&
          item.hasPhoto &&
          inPeriod(item.detectDate) &&
          entryVinSet.has(item.vin),
      )
      .map((item) => item.vin),
  ).length;

  const comprehensiveRatio = calcRatio(newBindings, newCarSales);
  const inspectionCoverageRatio = calcRatio(inspectedCount, entryTotal);
  const afterSalesRatio = calcRatio(entryNewBindings, entryNotInstalledExcel);

  const calculatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const target = config.targets;

  return {
    storeId: store.id,
    storeName: store.name,
    brand: store.brand,
    newCarSales,
    entryTotal,
    entryNotInstalled,
    entryNotInstalledExcel,
    newBindings,
    entryNewBindings,
    inspectedCount,
    comprehensiveRatio,
    inspectionCoverageRatio,
    afterSalesRatio,
    comprehensiveOk: comprehensiveRatio >= target.comprehensive,
    inspectionCoverageOk: inspectionCoverageRatio >= target.inspectionCoverage,
    afterSalesOk: afterSalesRatio >= target.afterSales,
    calculatedAt,
  };
}

export function calculateAllMetrics(params: {
  config: CompetitionConfig;
  vehicleRows: VehicleRow[];
  bindings: BackendBinding[];
  detections: BackendDetection[];
}): StoreMetrics[] {
  return params.config.stores
    .filter((store) => store.active)
    .map((store) =>
      calculateStoreMetrics({
        config: params.config,
        storeId: store.id,
        vehicleRows: params.vehicleRows,
        bindings: params.bindings,
        detections: params.detections,
      }),
    );
}

export function detectAnomalies(params: {
  vehicleRows: VehicleRow[];
  bindings: BackendBinding[];
  detections: BackendDetection[];
  enableBackendCheck?: boolean;
}): AnomalyItem[] {
  const {
    vehicleRows,
    bindings,
    detections,
    enableBackendCheck = true,
  } = params;
  const anomalies: AnomalyItem[] = [];
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  if (
    !enableBackendCheck ||
    (bindings.length === 0 && detections.length === 0)
  ) {
    return anomalies;
  }

  const entryVinMap = new Map<string, { storeId: string; storeName: string }>();
  vehicleRows
    .filter((row) => row.tableType === 'entry_check')
    .forEach((row) => {
      entryVinMap.set(row.vin, {
        storeId: row.storeId,
        storeName: row.storeName,
      });
    });

  detections.forEach((item) => {
    if (!entryVinMap.has(item.vin)) {
      anomalies.push({
        id: `detect-${item.vin}-${item.detectDate}`,
        storeId: item.storeId,
        storeName: item.storeName,
        vin: item.vin,
        type: 'detect_without_entry',
        message: '后端有检测记录，但门店入厂表无此车架号',
        status: 'open',
        createdAt: now,
      });
    }
  });

  vehicleRows
    .filter((row) => row.tableType === 'entry_check')
    .forEach((row) => {
      const hasDetect = detections.some(
        (item) => item.vin === row.vin && item.hasPhoto,
      );
      if (!hasDetect) {
        anomalies.push({
          id: `entry-${row.vin}-${row.businessDate}`,
          storeId: row.storeId,
          storeName: row.storeName,
          vin: row.vin,
          type: 'entry_without_detect',
          message: '门店报入厂，但后端无检测照片记录',
          status: 'open',
          createdAt: now,
        });
      }

      const hasBind = bindings.some((item) => item.vin === row.vin);
      if (row.installedFlag?.includes('是') && !hasBind) {
        anomalies.push({
          id: `bind-${row.vin}`,
          storeId: row.storeId,
          storeName: row.storeName,
          vin: row.vin,
          type: 'installed_without_bind',
          message: '门店标记已加装，但后端无绑定记录',
          status: 'open',
          createdAt: now,
        });
      }
    });

  return anomalies;
}
