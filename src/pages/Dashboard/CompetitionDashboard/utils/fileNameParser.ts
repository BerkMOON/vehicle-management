import dayjs from 'dayjs';
import { DEFAULT_COMPETITION_CONFIG } from '../constants';
import { CompetitionConfig, CompetitionStore, TableType } from '../types';
import { detectBrandFromFileName, resolveStoreByName } from './storeMapper';

export interface ParsedFileName {
  store: CompetitionStore | null;
  tableType: TableType | null;
  reportDate: string | null;
  matchedText?: string;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, '').replace(/\.xlsx?$/i, '');
}

function detectTableType(fileName: string): TableType | null {
  const name = fileName.toLowerCase();
  if (name.includes('新车')) return 'new_car';
  if (
    name.includes('入厂检测') ||
    name.includes('入厂') ||
    name.includes('售后') ||
    name.includes('安装统计')
  ) {
    return 'entry_check';
  }
  return null;
}

function inferCompetitionYear(
  month: number,
  day: number,
  config: Pick<CompetitionConfig, 'startDate' | 'endDate'>,
): number {
  const years = new Set([
    dayjs(config.startDate).year(),
    dayjs(config.endDate).year(),
  ]);
  const start = dayjs(config.startDate);
  const end = dayjs(config.endDate);

  for (const year of years) {
    const candidate = dayjs(`${year}-${month}-${day}`, 'YYYY-M-D', true);
    if (!candidate.isValid()) continue;
    if (
      (candidate.isAfter(start) || candidate.isSame(start, 'day')) &&
      (candidate.isBefore(end) || candidate.isSame(end, 'day'))
    ) {
      return year;
    }
  }

  return start.year();
}

/** 从文件名解析报表日期（支持 2026.6.15、6.15、6-15、6月15日 等） */
export function detectReportDate(
  fileName: string,
  competitionConfig: Pick<
    CompetitionConfig,
    'startDate' | 'endDate'
  > = DEFAULT_COMPETITION_CONFIG,
): string | null {
  const fullYearPatterns = [
    /(20\d{2})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/,
    /(20\d{2})(\d{2})(\d{2})/,
  ];
  for (const pattern of fullYearPatterns) {
    const match = fileName.match(pattern);
    if (!match) continue;
    const date = dayjs(`${match[1]}-${match[2]}-${match[3]}`, 'YYYY-M-D', true);
    if (date.isValid()) return date.format('YYYY-MM-DD');
  }

  const shortPatterns = [
    /(?:^|[^\d])(\d{1,2})[.\-/月](\d{1,2})日?(?:[^\d]|$)/,
    /(?:^|[^\d])(\d{1,2})-(\d{1,2})(?:[^\d]|$)/,
  ];
  for (const pattern of shortPatterns) {
    const match = fileName.match(pattern);
    if (!match) continue;
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    const year = inferCompetitionYear(month, day, competitionConfig);
    const date = dayjs(`${year}-${month}-${day}`, 'YYYY-M-D', true);
    if (date.isValid()) return date.format('YYYY-MM-DD');
  }

  return null;
}

export function matchStoreByFileName(
  fileName: string,
  stores: CompetitionStore[] = DEFAULT_COMPETITION_CONFIG.stores,
): CompetitionStore | null {
  const brand = detectBrandFromFileName(fileName);
  const activeStores = stores.filter((store) => store.active);
  const candidateStores = brand
    ? activeStores.filter((store) => store.brand === brand)
    : activeStores;
  return resolveStoreByName(normalizeText(fileName), candidateStores);
}

export function parseFileName(
  fileName: string,
  stores?: CompetitionStore[],
  competitionConfig?: Pick<CompetitionConfig, 'startDate' | 'endDate'>,
): ParsedFileName {
  const config = competitionConfig || DEFAULT_COMPETITION_CONFIG;
  return {
    store: matchStoreByFileName(fileName, stores),
    tableType: detectTableType(fileName),
    reportDate: detectReportDate(fileName, config),
  };
}

/** 上传记录覆盖的业务日期：行内日期 + 文件名日期（催报用） */
export function getUploadCoverageDates(
  record: {
    fileName: string;
    businessDates: string[];
    reportDate?: string | null;
  },
  competitionConfig: Pick<CompetitionConfig, 'startDate' | 'endDate'>,
): string[] {
  const dates = new Set(record.businessDates);
  const reportDate =
    record.reportDate || detectReportDate(record.fileName, competitionConfig);
  if (reportDate) dates.add(reportDate);
  return Array.from(dates);
}
