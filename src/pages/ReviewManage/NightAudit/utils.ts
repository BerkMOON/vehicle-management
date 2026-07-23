import type {
  NightAuditOverrideRule,
  NightAuditScheduleRule,
  NightAuditTimeWindow,
  NightAuditWindowRulesPayload,
} from '@/services/audit/nightAudit/typings';
import type { Rule } from 'antd/es/form';
import dayjs, { Dayjs } from 'dayjs';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const WEEKDAY_OPTIONS = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

export const RULE_LAYER_LABEL: Record<string, string> = {
  override: '特殊日期',
  schedule: '排班规则',
  default: '默认规则',
};

export function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

export function isValidTimezone(timezone: string): boolean {
  if (!timezone?.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function isValidTimeWindow(
  window?: NightAuditTimeWindow | null,
): boolean {
  if (!window) return false;
  return (
    isValidTime(window.start) &&
    isValidTime(window.end) &&
    window.start !== window.end
  );
}

export function isOrderedTimeWindow(
  window?: NightAuditTimeWindow | null,
): boolean {
  if (!window) return false;
  return (
    isValidTime(window.start) &&
    isValidTime(window.end) &&
    window.start < window.end
  );
}

export function timeToDayjs(time?: string): Dayjs | null {
  if (!time || !isValidTime(time)) return null;
  return dayjs(time, 'HH:mm');
}

export function dayjsToTime(value?: Dayjs | null): string {
  return value?.isValid() ? value.format('HH:mm') : '';
}

export function createOrderedStartRules(endPath: (string | number)[]): Rule[] {
  return [
    { required: true, message: '请选择开始时间' },
    ({ getFieldValue }) => ({
      validator(_, start: Dayjs | null) {
        const end = getFieldValue(endPath);
        if (!start?.isValid?.() || !end?.isValid?.()) {
          return Promise.resolve();
        }
        if (dayjsToTime(start) >= dayjsToTime(end)) {
          return Promise.reject(new Error('开始时间必须小于结束时间'));
        }
        return Promise.resolve();
      },
    }),
  ];
}

export function createOrderedEndRules(startPath: (string | number)[]): Rule[] {
  return [
    { required: true, message: '请选择结束时间' },
    ({ getFieldValue }) => ({
      validator(_, end: Dayjs | null) {
        const start = getFieldValue(startPath);
        if (!start?.isValid?.() || !end?.isValid?.()) {
          return Promise.resolve();
        }
        if (dayjsToTime(start) >= dayjsToTime(end)) {
          return Promise.reject(new Error('结束时间必须大于开始时间'));
        }
        return Promise.resolve();
      },
    }),
  ];
}

export function validateWindowRules(
  values: NightAuditWindowRulesPayload,
): string | null {
  if (!isValidTimezone(values.timezone)) {
    return '时区不能为空且需为合法 IANA 时区';
  }
  if (!isOrderedTimeWindow(values.default)) {
    return '默认时间窗口格式非法，或开始时间未小于结束时间';
  }

  for (let i = 0; i < (values.schedule?.length || 0); i++) {
    const item = values.schedule[i];
    if (!item.name?.trim()) {
      return `排班规则第 ${i + 1} 条：名称不能为空`;
    }
    if (!item.weekdays?.length) {
      return `排班规则「${item.name}」：星期不能为空`;
    }
    if (item.weekdays.some((day) => day < 0 || day > 6)) {
      return `排班规则「${item.name}」：星期取值需在 0-6 之间`;
    }
    if (!isOrderedTimeWindow({ start: item.start, end: item.end })) {
      return `排班规则「${item.name}」：时间窗口格式非法，或开始时间未小于结束时间`;
    }
  }

  const allDates: string[] = [];
  for (let i = 0; i < (values.overrides?.length || 0); i++) {
    const item = values.overrides[i];
    if (!item.name?.trim()) {
      return `特殊日期规则第 ${i + 1} 条：名称不能为空`;
    }
    if (!item.dates?.length) {
      return `特殊日期规则「${item.name}」：日期不能为空`;
    }
    for (const date of item.dates) {
      if (!DATE_REGEX.test(date)) {
        return `特殊日期规则「${item.name}」：日期 ${date} 格式需为 YYYY-MM-DD`;
      }
      if (allDates.includes(date)) {
        return `特殊日期 ${date} 在多条规则中重复，请去重`;
      }
      allDates.push(date);
    }
    if (item.window !== null && !isValidTimeWindow(item.window)) {
      return `特殊日期规则「${item.name}」：时间窗口格式非法或起止时间相同`;
    }
  }

  return null;
}

export interface NightAuditFormValues {
  timezone: string;
  default: {
    start: Dayjs | null;
    end: Dayjs | null;
  };
  schedule: Array<{
    name: string;
    priority: number;
    weekdays: number[];
    start: Dayjs | null;
    end: Dayjs | null;
  }>;
  overrides: Array<{
    name: string;
    priority: number;
    dates: string[];
    closed: boolean;
    start: Dayjs | null;
    end: Dayjs | null;
  }>;
}

export function rulesToFormValues(
  rules: NightAuditWindowRulesPayload,
): NightAuditFormValues {
  return {
    timezone: DEFAULT_TIMEZONE,
    default: {
      start: timeToDayjs(rules.default.start),
      end: timeToDayjs(rules.default.end),
    },
    schedule: (rules.schedule || []).map((item: NightAuditScheduleRule) => ({
      name: item.name,
      priority: item.priority ?? 0,
      weekdays: item.weekdays,
      start: timeToDayjs(item.start),
      end: timeToDayjs(item.end),
    })),
    overrides: (rules.overrides || []).map((item: NightAuditOverrideRule) => ({
      name: item.name,
      priority: item.priority ?? 0,
      dates: item.dates,
      closed: item.window === null,
      start: timeToDayjs(item.window?.start),
      end: timeToDayjs(item.window?.end),
    })),
  };
}

export function formValuesToPayload(
  values: NightAuditFormValues,
): NightAuditWindowRulesPayload {
  return {
    timezone: DEFAULT_TIMEZONE,
    default: {
      start: dayjsToTime(values.default.start),
      end: dayjsToTime(values.default.end),
    },
    schedule: (values.schedule || []).map((item) => ({
      name: item.name,
      priority: item.priority ?? 0,
      weekdays: item.weekdays,
      start: dayjsToTime(item.start),
      end: dayjsToTime(item.end),
    })),
    overrides: (values.overrides || []).map((item) => ({
      name: item.name,
      priority: item.priority ?? 0,
      dates: item.dates,
      window: item.closed
        ? null
        : {
            start: dayjsToTime(item.start),
            end: dayjsToTime(item.end),
          },
    })),
  };
}
