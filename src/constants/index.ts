export const DEFAULT_NAME = 'Umi Max';

export enum COMMON_STATUS {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export enum COMMON_STATUS_CODE {
  DELETED,
  ACTIVE,
}

export enum SuccessCode {
  SUCCESS = 200,
}

export enum AUDIT_LEVEL {
  A = 'AAAA',
  B = 'AAA',
  C = 'AA',
  D = 'A',
}

export enum AUDIT_RESULT {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDETERMINE = 'undetermined',
}

export enum AUDIT_RESULT_CODE {
  APPROVED = 1,
  REJECTED = 2,
  UNDETERMINE = 4,
}

export const DEVICE_STATUS = {
  NOT_UPGRADED: 0,
  UPGRADING: 1,
  SUCCESS: 2,
  FAILED: 3,
} as const;

export enum STATUS_LABEL {
  ACTIVE = '生效中',
  DELETED = '已删除',
}

export const STATUS_OPTIONS = [
  { label: STATUS_LABEL.ACTIVE, value: COMMON_STATUS.ACTIVE },
  { label: STATUS_LABEL.DELETED, value: COMMON_STATUS.DELETED },
];

export enum TaskStatus {
  All = 'all',
  /** 待处理 */
  Pending = 'pending',
  /** 已处理 */
  Processing = 'processing',
  /** 待返厂 */
  WaitingForReturn = 'waitingForReturn',
  /** 已完成 */
  Returned = 'returned',
  /** 已拒绝 */
  Rejected = 'rejected',
}

export enum TaskStatusLabel {
  All = '全部',
  /** 待处理 */
  Pending = '待认领',
  /** 已处理 */
  Processing = '已认领',
  /** 待返厂 */
  WaitingForReturn = '待返厂',
  /** 已完成 */
  Returned = '已完成',
  /** 已拒绝 */
  Rejected = '已拒绝',
}

export const TASK_STATUS_OPTIONS = [
  { label: TaskStatusLabel.All, value: TaskStatus.All },
  { label: TaskStatusLabel.Pending, value: TaskStatus.Pending },
  { label: TaskStatusLabel.Processing, value: TaskStatus.Processing },
  {
    label: TaskStatusLabel.WaitingForReturn,
    value: TaskStatus.WaitingForReturn,
  },
  { label: TaskStatusLabel.Returned, value: TaskStatus.Returned },
  { label: TaskStatusLabel.Rejected, value: TaskStatus.Rejected },
];

export const SecretKey = '6794xzUkZDgRh4DUCuq54pJs';
