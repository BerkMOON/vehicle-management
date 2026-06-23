import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DEFAULT_COMPETITION_CONFIG } from '../constants';
import { CompetitionConfig, MetricsDateRange } from '../types';

dayjs.extend(customParseFormat);

const DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY.M.D',
  'YYYY.M.DD',
  'YYYY.MM.D',
  'YYYY.MM.DD',
  'YYYY/M/D',
  'YYYY/MM/DD',
  'M.D',
  'M.DD',
  'MM.D',
  'MM.DD',
  'M/D',
  'MM/DD',
];

export interface NormalizeDateContext {
  competitionConfig?: Pick<CompetitionConfig, 'startDate' | 'endDate'>;
  reportDate?: string | null;
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

function excelSerialToDate(serial: number): string | null {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeExcelDate(
  value: unknown,
  context: NormalizeDateContext = {},
): string | null {
  if (value === null || value === undefined || value === '') return null;

  const config = context.competitionConfig || DEFAULT_COMPETITION_CONFIG;

  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value > 20000) {
      return excelSerialToDate(value);
    }
    const decimalText = String(value);
    if (/^\d{1,2}\.\d{1,2}$/.test(decimalText)) {
      const month = Number(decimalText.split('.')[0]);
      const day = Number(decimalText.split('.')[1]);
      const year = inferCompetitionYear(month, day, config);
      const parsed = dayjs(`${year}-${month}-${day}`, 'YYYY-M-D', true);
      if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (!Number.isNaN(serial) && serial > 20000) {
      return excelSerialToDate(serial);
    }
    if (!Number.isNaN(serial) && /^\d{1,2}\.\d{1,2}$/.test(text)) {
      const month = Number(text.split('.')[0]);
      const day = Number(text.split('.')[1]);
      const year = inferCompetitionYear(month, day, config);
      const parsed = dayjs(`${year}-${month}-${day}`, 'YYYY-M-D', true);
      if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
  }

  for (const fmt of DATE_FORMATS) {
    const parsed = dayjs(text, fmt, true);
    if (!parsed.isValid()) continue;

    if (fmt.startsWith('M') || fmt.startsWith('MM')) {
      const year = inferCompetitionYear(
        parsed.month() + 1,
        parsed.date(),
        config,
      );
      return dayjs(
        `${year}-${parsed.month() + 1}-${parsed.date()}`,
        'YYYY-M-D',
      ).format('YYYY-MM-DD');
    }

    return parsed.format('YYYY-MM-DD');
  }

  const mdText = text.match(/^(\d{1,2})[.\-/月](\d{1,2})日?$/);
  if (mdText) {
    const month = Number(mdText[1]);
    const day = Number(mdText[2]);
    const year = inferCompetitionYear(month, day, config);
    const parsed = dayjs(`${year}-${month}-${day}`, 'YYYY-M-D', true);
    if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
  }

  const loose = dayjs(text);
  return loose.isValid() ? loose.format('YYYY-MM-DD') : null;
}

export function isWithinCompetition(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  const d = dayjs(date);
  return (
    (d.isAfter(startDate) || d.isSame(startDate, 'day')) &&
    (d.isBefore(endDate) || d.isSame(endDate, 'day'))
  );
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

/** 默认指标范围：竞赛开始日 ~ min(今日, 竞赛结束日) */
export function getDefaultMetricsDateRange(
  config: Pick<CompetitionConfig, 'startDate' | 'endDate'>,
): MetricsDateRange {
  const today = dayjs().format('YYYY-MM-DD');
  const end = dayjs(today).isAfter(config.endDate) ? config.endDate : today;
  const safeEnd = dayjs(end).isBefore(config.startDate)
    ? config.startDate
    : end;
  return { startDate: config.startDate, endDate: safeEnd };
}

export function getFullCompetitionDateRange(
  config: Pick<CompetitionConfig, 'startDate' | 'endDate'>,
): MetricsDateRange {
  return { startDate: config.startDate, endDate: config.endDate };
}
