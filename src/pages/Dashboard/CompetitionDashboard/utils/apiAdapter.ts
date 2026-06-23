import { SuccessCode } from '@/constants';
import type { CompetitionStoreMetricsItem } from '@/services/competitionDashboard/typings.d';
import {
  CompetitionConfig,
  MetricsDateRange,
  StoreMetrics,
  StoreReturnStatus,
} from '../types';
import { BackendStoreLink } from './storeIdMap';

function emptyStoreMetrics(
  store: CompetitionConfig['stores'][number],
  calculatedAt: string,
): StoreMetrics {
  return {
    storeId: store.id,
    storeName: store.name,
    brand: store.brand,
    newCarSales: 0,
    entryTotal: 0,
    entryNotInstalled: 0,
    entryNotInstalledExcel: 0,
    newBindings: 0,
    entryNewBindings: 0,
    inspectedCount: 0,
    comprehensiveRatio: 0,
    inspectionCoverageRatio: 0,
    afterSalesRatio: 0,
    comprehensiveOk: false,
    inspectionCoverageOk: false,
    afterSalesOk: false,
    calculatedAt,
  };
}

export function mapBackendMetricsToStoreMetrics(params: {
  config: CompetitionConfig;
  items: CompetitionStoreMetricsItem[];
  links: BackendStoreLink[];
  calculatedAt: string;
  metricsDateRange?: MetricsDateRange;
}): StoreMetrics[] {
  const { config, items, links, calculatedAt } = params;
  const itemByBackendId = new Map(
    items.map((item) => [String(item.store_id), item]),
  );

  return config.stores
    .filter((store) => store.active)
    .map((store) => {
      const link = links.find((l) => l.competitionStoreId === store.id);
      const apiItem = link
        ? itemByBackendId.get(link.backendStoreId)
        : undefined;
      if (!apiItem) {
        return emptyStoreMetrics(store, calculatedAt);
      }
      return {
        storeId: store.id,
        storeName: store.name,
        brand: store.brand,
        newCarSales: apiItem.new_car_sales,
        entryTotal: apiItem.entry_total,
        entryNotInstalled: 0,
        entryNotInstalledExcel: apiItem.entry_not_installed_excel,
        newBindings: apiItem.new_bindings,
        entryNewBindings: apiItem.entry_new_bindings,
        inspectedCount: apiItem.inspected_count,
        comprehensiveRatio: apiItem.comprehensive_ratio,
        inspectionCoverageRatio: apiItem.inspection_coverage_ratio,
        afterSalesRatio: apiItem.after_sales_ratio,
        comprehensiveOk: apiItem.comprehensive_ok,
        inspectionCoverageOk: apiItem.inspection_coverage_ok,
        afterSalesOk: apiItem.after_sales_ok,
        calculatedAt,
      };
    });
}

export function mergeReturnStatus(params: {
  config: CompetitionConfig;
  links: BackendStoreLink[];
  apiList: Array<{
    store_id: number;
    new_car: { uploaded: boolean; row_count: number };
    entry_check: { uploaded: boolean; row_count: number };
    completed: boolean;
  }>;
}): StoreReturnStatus[] {
  const { config, links, apiList } = params;
  const apiByBackendId = new Map(
    apiList.map((item) => [String(item.store_id), item]),
  );

  return config.stores
    .filter((store) => store.active)
    .map((store) => {
      const link = links.find((l) => l.competitionStoreId === store.id);
      const apiItem = link
        ? apiByBackendId.get(link.backendStoreId)
        : undefined;
      const newCar = apiItem?.new_car ?? { uploaded: false, row_count: 0 };
      const entryCheck = apiItem?.entry_check ?? {
        uploaded: false,
        row_count: 0,
      };
      return {
        storeId: store.id,
        storeName: store.name,
        brand: store.brand,
        newCar: {
          uploaded: newCar.uploaded,
          rowCount: newCar.row_count,
        },
        entryCheck: {
          uploaded: entryCheck.uploaded,
          rowCount: entryCheck.row_count,
        },
        completed: newCar.uploaded && entryCheck.uploaded,
      };
    });
}

export function assertApiSuccess<T>(
  res: { response_status?: { code?: number; msg?: string }; data?: T },
  fallbackMessage: string,
): T {
  if (res?.response_status?.code !== SuccessCode.SUCCESS) {
    throw new Error(res?.response_status?.msg || fallbackMessage);
  }
  return res.data as T;
}
