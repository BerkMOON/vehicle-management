import { SuccessCode } from '@/constants';
import { CompanyAPI } from '@/services/company/CompanyController';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import { CompetitionConfig } from '../types';
import { resolveStoreByName } from './storeMapper';

export interface BackendStoreLink {
  competitionStoreId: string;
  competitionStoreName: string;
  backendStoreId: string;
  backendStoreName: string;
}

let allStoresCache: StoreItem[] | null = null;
let allStoresInflight: Promise<StoreItem[]> | null = null;

let storeLinksCache: { key: string; links: BackendStoreLink[] } | null = null;
let storeLinksInflight: Promise<BackendStoreLink[]> | null = null;

function configStoresKey(config: CompetitionConfig): string {
  return config.stores.map((store) => store.id).join(',');
}

async function loadAllBackendStores(): Promise<StoreItem[]> {
  const companiesRes = await CompanyAPI.getAllCompanies({
    page: 1,
    limit: 200,
  });
  if (companiesRes?.response_status?.code !== SuccessCode.SUCCESS) {
    throw new Error(companiesRes?.response_status?.msg || '获取公司列表失败');
  }

  const companies = companiesRes.data?.company_list || [];
  const allStores: StoreItem[] = [];

  for (const company of companies) {
    let page = 1;
    let totalPage = 1;
    while (page <= totalPage) {
      const res = await StoreAPI.getAllStores({
        page,
        limit: 200,
        company_id: company.id,
      });
      if (res?.response_status?.code !== SuccessCode.SUCCESS) break;

      const list = res.data?.store_list || [];
      totalPage = res.data?.meta?.total_page || 1;
      list.forEach((store) => {
        if (store.id && store.id !== ':storeId') {
          allStores.push(store);
        }
      });
      page += 1;
    }
  }

  return allStores;
}

/** 拉取后台全部门店（跨公司分页），同会话内复用缓存并合并并发请求 */
export async function fetchAllBackendStores(): Promise<StoreItem[]> {
  if (allStoresCache) return allStoresCache;
  if (allStoresInflight) return allStoresInflight;

  allStoresInflight = loadAllBackendStores()
    .then((stores) => {
      allStoresCache = stores;
      return stores;
    })
    .finally(() => {
      allStoresInflight = null;
    });

  return allStoresInflight;
}

function buildStoreLinks(
  config: CompetitionConfig,
  backendStores: StoreItem[],
): BackendStoreLink[] {
  const linkMap = new Map<string, BackendStoreLink>();

  backendStores.forEach((backendStore) => {
    const compStore = resolveStoreByName(backendStore.name, config.stores);
    if (!compStore?.active) return;
    if (linkMap.has(compStore.id)) return;

    linkMap.set(compStore.id, {
      competitionStoreId: compStore.id,
      competitionStoreName: compStore.name,
      backendStoreId: String(backendStore.id),
      backendStoreName: backendStore.name,
    });
  });

  return Array.from(linkMap.values());
}

/** 竞赛门店 ↔ 后台 store_id 映射（按门店名称/别名匹配） */
export async function fetchBackendStoreLinks(
  config: CompetitionConfig,
): Promise<BackendStoreLink[]> {
  const key = configStoresKey(config);
  if (storeLinksCache?.key === key) return storeLinksCache.links;
  if (storeLinksInflight) return storeLinksInflight;

  storeLinksInflight = fetchAllBackendStores()
    .then((backendStores) => buildStoreLinks(config, backendStores))
    .then((links) => {
      storeLinksCache = { key, links };
      return links;
    })
    .finally(() => {
      storeLinksInflight = null;
    });

  return storeLinksInflight;
}

/** 清空门店映射缓存（如清空本机竞赛数据后需重新匹配） */
export function invalidateBackendStoreCache(): void {
  allStoresCache = null;
  allStoresInflight = null;
  storeLinksCache = null;
  storeLinksInflight = null;
}
