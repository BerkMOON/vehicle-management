export interface NightAuditTimeWindow {
  start: string;
  end: string;
}

export interface NightAuditScheduleRule {
  name: string;
  priority: number;
  weekdays: number[];
  start: string;
  end: string;
}

export interface NightAuditOverrideRule {
  name: string;
  priority: number;
  dates: string[];
  window: NightAuditTimeWindow | null;
}

export interface NightAuditWindowRules {
  version?: string;
  timezone: string;
  default: NightAuditTimeWindow;
  schedule: NightAuditScheduleRule[];
  overrides: NightAuditOverrideRule[];
}

export type NightAuditWindowRulesPayload = Omit<
  NightAuditWindowRules,
  'version'
>;

export interface NightAuditDisabled {
  disabled: boolean;
}

export interface NightAuditStatus {
  workerEnabled: boolean;
  disabled: boolean;
  windowActive: boolean;
  ruleLayer: 'override' | 'schedule' | 'default' | string;
  ruleName: string;
  lastRunAt?: string;
  healthy: boolean;
}
