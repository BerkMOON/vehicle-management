import { SuccessCode } from '@/constants';
import { DeviceAPI } from '@/services/device/DeviceController';
import { EntryCheckAPI } from '@/services/entryCheck/EntryCheckController';
import type { EntryInspectionLogListItem } from '@/services/entryCheck/typings.d';
import dayjs from 'dayjs';
import {
  BackendBinding,
  BackendDetection,
  CompetitionConfig,
  StoreBackendFetchResult,
} from '../types';
import { BackendStoreLink, fetchBackendStoreLinks } from './storeIdMap';
import { cleanVin } from './vin';

const PAGE_SIZE = 200;

interface DeviceRow {
  vin?: string;
  store_name?: string;
  bind_time?: string;
  bindTime?: string;
  createTime?: string;
  create_time?: string;
  onset_time?: string;
  onsetTime?: string;
}

async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ list: T[]; total: number }>,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let total = Infinity;

  while (all.length < total) {
    const { list, total: nextTotal } = await fetchPage(page);
    total = nextTotal;
    if (list.length === 0) break;
    all.push(...list);
    if (list.length < PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

function pickBindDate(item: DeviceRow): string | null {
  const raw =
    item.bind_time ||
    item.bindTime ||
    item.createTime ||
    item.create_time ||
    item.onset_time ||
    item.onsetTime;
  if (!raw) return null;
  const date = dayjs(raw);
  return date.isValid() ? date.format('YYYY-MM-DD') : null;
}

function isInCompetitionPeriod(
  dateText: string,
  config: CompetitionConfig,
): boolean {
  const date = dayjs(dateText);
  const start = dayjs(config.startDate);
  const end = dayjs(config.endDate).endOf('day');
  return (
    (date.isAfter(start) || date.isSame(start, 'day')) &&
    (date.isBefore(end) || date.isSame(end, 'day'))
  );
}

function mapDeviceBinding(
  item: DeviceRow,
  link: BackendStoreLink,
  config: CompetitionConfig,
): BackendBinding | null {
  const vinResult = cleanVin(item.vin);
  const bindDate = pickBindDate(item);
  if (!vinResult.valid || !bindDate) return null;
  if (!isInCompetitionPeriod(bindDate, config)) return null;

  return {
    vin: vinResult.vin,
    storeId: link.competitionStoreId,
    storeName: link.competitionStoreName,
    bindDate,
  };
}

function mapInspectionLog(
  item: EntryInspectionLogListItem,
  link: BackendStoreLink,
  config: CompetitionConfig,
): BackendDetection | null {
  const detectAt = dayjs(item.ctime);
  if (!detectAt.isValid()) return null;

  const detectDate = detectAt.format('YYYY-MM-DD');
  if (!isInCompetitionPeriod(detectDate, config)) return null;

  const vinResult = cleanVin(item.vin);
  if (!vinResult.valid) return null;

  return {
    vin: vinResult.vin,
    storeId: link.competitionStoreId,
    storeName: link.competitionStoreName,
    detectDate,
    hasPhoto: true,
  };
}

export async function fetchBindingsByStore(
  link: BackendStoreLink,
  config: CompetitionConfig,
): Promise<BackendBinding[]> {
  const start = `${config.startDate} 00:00:00`;
  const end = `${config.endDate} 23:59:59`;

  const devices = await fetchAllPages<DeviceRow>(async (page) => {
    const res = await DeviceAPI.getDeviceList({
      page,
      limit: PAGE_SIZE,
      status: 'bound',
      store_id: link.backendStoreId,
      bind_start_time: start,
      bind_end_time: end,
    } as Parameters<typeof DeviceAPI.getDeviceList>[0]);

    if (res?.response_status?.code !== SuccessCode.SUCCESS) {
      throw new Error(
        res?.response_status?.msg ||
          `门店 ${link.competitionStoreName} 设备绑定数据拉取失败`,
      );
    }

    return {
      list: (res.data?.device_list || []) as DeviceRow[],
      total: res.data?.meta?.total_count ?? 0,
    };
  });

  return devices
    .map((item) => mapDeviceBinding(item, link, config))
    .filter((item): item is BackendBinding => item !== null);
}

export async function fetchInspectionLogsByStore(
  link: BackendStoreLink,
  config: CompetitionConfig,
): Promise<BackendDetection[]> {
  const logs = await fetchAllPages<EntryInspectionLogListItem>(async (page) => {
    const res = await EntryCheckAPI.listInspectionLogs({
      page,
      limit: PAGE_SIZE,
      store_id: link.backendStoreId,
    });

    if (res?.response_status?.code !== SuccessCode.SUCCESS) {
      throw new Error(
        res?.response_status?.msg ||
          `门店 ${link.competitionStoreName} 入厂检测数据拉取失败`,
      );
    }

    return {
      list: res.data?.item_list ?? [],
      total: res.data?.meta?.total_count ?? 0,
    };
  });

  return logs
    .map((item) => mapInspectionLog(item, link, config))
    .filter((item): item is BackendDetection => item !== null);
}

/** 单店并行拉取绑定 + 入厂留痕 */
export async function fetchStoreBackendData(
  link: BackendStoreLink,
  config: CompetitionConfig,
): Promise<StoreBackendFetchResult> {
  const [bindings, detections] = await Promise.all([
    fetchBindingsByStore(link, config),
    fetchInspectionLogsByStore(link, config),
  ]);
  return {
    storeId: link.competitionStoreId,
    bindings,
    detections,
  };
}

/** 按后台 store_id 分门店拉取设备绑定，用于综合/售后渗透率分子 */
export async function fetchAllBindings(
  config: CompetitionConfig,
): Promise<BackendBinding[]> {
  const storeLinks = await fetchBackendStoreLinks(config);
  if (storeLinks.length === 0) return [];

  const batches = await Promise.all(
    storeLinks.map(async (link) => {
      try {
        return await fetchBindingsByStore(link, config);
      } catch (error) {
        console.warn(
          `[CompetitionDashboard] device bindings failed: ${link.competitionStoreName}`,
          error,
        );
        return [];
      }
    }),
  );

  return batches.flat();
}

/** 按后台 store_id 分门店拉取入厂留痕，用于入厂检测覆盖率分子 */
export async function fetchAllDetections(
  config: CompetitionConfig,
): Promise<BackendDetection[]> {
  const storeLinks = await fetchBackendStoreLinks(config);
  if (storeLinks.length === 0) return [];

  const batches = await Promise.all(
    storeLinks.map(async (link) => {
      try {
        return await fetchInspectionLogsByStore(link, config);
      } catch (error) {
        console.warn(
          `[CompetitionDashboard] inspection logs failed: ${link.competitionStoreName}`,
          error,
        );
        return [];
      }
    }),
  );

  return batches.flat();
}

export { fetchBackendStoreLinks };
