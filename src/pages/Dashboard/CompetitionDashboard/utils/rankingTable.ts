import dayjs from 'dayjs';
import { BRAND_LABEL } from '../constants';
import { Brand, StoreMetrics } from '../types';

export type RankingTableKind = 'comprehensive' | 'inspection' | 'afterSales';

export interface RankingTableRow {
  key: string;
  label: string;
  denominator: number | null;
  numerator: number | null;
  ratio: number | null;
  rowType: 'store' | 'brandSubtotal' | 'groupTotal';
}

export interface RankingTableConfig {
  kind: RankingTableKind;
  title: string;
  denominatorLabel: string;
  numeratorLabel: string;
  ratioLabel: string;
}

const BRAND_ORDER: Brand[] = ['audi', 'lincoln', 'hongqi'];

function calcSubtotalRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number((numerator / denominator).toFixed(6));
}

function pickMetricValues(kind: RankingTableKind, item: StoreMetrics) {
  switch (kind) {
    case 'comprehensive':
      return {
        denominator: item.newCarSales,
        numerator: item.newBindings,
        ratio: item.comprehensiveRatio,
      };
    case 'inspection':
      return {
        denominator: item.entryTotal,
        numerator: item.inspectedCount,
        ratio: item.inspectionCoverageRatio,
      };
    case 'afterSales':
      return {
        denominator: item.entryNotInstalledExcel,
        numerator: item.entryNewBindings,
        ratio: item.afterSalesRatio,
      };
    default:
      return { denominator: 0, numerator: 0, ratio: 0 };
  }
}

export function getRankingTableConfig(
  kind: RankingTableKind,
  startDate: string,
  endDate: string,
): RankingTableConfig {
  const period = `${dayjs(startDate).format('M.D')}-${dayjs(endDate).format(
    'M.D',
  )}`;
  const base = {
    kind,
    title: '',
    ratioLabel: kind === 'inspection' ? '入厂检测覆盖率' : '渗透率',
  };

  if (kind === 'comprehensive') {
    return {
      ...base,
      title: `易达安双月竞赛渗透率排名（${period}）`,
      denominatorLabel: '新车销量',
      numeratorLabel: '记录仪加装量',
      ratioLabel: '渗透率',
    };
  }
  if (kind === 'inspection') {
    return {
      ...base,
      title: `易达安双月竞赛入厂检测覆盖率排名（${period}）`,
      denominatorLabel: '售后入厂台次',
      numeratorLabel: '拍照完成入厂检测台次',
      ratioLabel: '入厂检测覆盖率',
    };
  }
  return {
    ...base,
    title: `易达安双月竞赛售后渗透率排名（${period}）`,
    denominatorLabel: '售后入厂未装台次',
    numeratorLabel: '新增绑定重合台次',
    ratioLabel: '售后渗透率',
  };
}

/** 构建与参考 Excel 一致的排名表行（品牌内按渗透率降序 + 小计 + 集团合计） */
export function buildRankingTableRows(
  metrics: StoreMetrics[],
  kind: RankingTableKind,
): RankingTableRow[] {
  const rows: RankingTableRow[] = [];
  let groupDenominator = 0;
  let groupNumerator = 0;

  BRAND_ORDER.forEach((brand) => {
    const brandStores = metrics
      .filter((item) => item.brand === brand)
      .sort(
        (a, b) =>
          pickMetricValues(kind, b).ratio - pickMetricValues(kind, a).ratio,
      );

    let brandDenominator = 0;
    let brandNumerator = 0;

    brandStores.forEach((store) => {
      const { denominator, numerator, ratio } = pickMetricValues(kind, store);
      brandDenominator += denominator;
      brandNumerator += numerator;
      rows.push({
        key: store.storeId,
        label: store.storeName,
        denominator,
        numerator,
        ratio,
        rowType: 'store',
      });
    });

    if (brandStores.length > 0) {
      groupDenominator += brandDenominator;
      groupNumerator += brandNumerator;
      rows.push({
        key: `${brand}-subtotal`,
        label: `${BRAND_LABEL[brand]}小计`,
        denominator: brandDenominator,
        numerator: brandNumerator,
        ratio: calcSubtotalRatio(brandNumerator, brandDenominator),
        rowType: 'brandSubtotal',
      });
    }
  });

  rows.push({
    key: 'group-total',
    label: '集团合计',
    denominator: groupDenominator,
    numerator: groupNumerator,
    ratio: calcSubtotalRatio(groupNumerator, groupDenominator),
    rowType: 'groupTotal',
  });

  return rows;
}

export function formatRatio(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '-';
  return value.toFixed(6);
}
