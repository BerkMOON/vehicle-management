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

/** 拉取后台全部门店（跨公司分页） */
export async function fetchAllBackendStores(): Promise<StoreItem[]> {
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

/** 竞赛门店 ↔ 后台 store_id 映射（按门店名称/别名匹配） */
export async function fetchBackendStoreLinks(
  config: CompetitionConfig,
): Promise<BackendStoreLink[]> {
  const backendStores = await fetchAllBackendStores();
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
