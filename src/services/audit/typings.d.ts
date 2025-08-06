import { BaseListInfo, StatusInfo } from '@/types/common';
export interface AuditInfo {
  task_id: number;
  device_id: string;
  clue_id: string;
}

export interface AuditTaskDetailParams {
  clue_id: string;
  needRecordDetail?: boolean;
  needAuditResult?: boolean;
  needMachineAuditResult?: boolean;
}

export interface AuditTaskDetail {
  id: number;
  clue_id: string;
  handler_name: string;
  device_id: string;
  data_file_url: string;
  status: {
    code: number;
    name: string;
  };
  sn: string;
  begin_time: string;
  end_time: string;
  level: string;
  note: string;
  create_time: string;
  modify_time: string;
  video_url: string;
  video_path: string;
  report_time: string;
  ext_info1: string;
  ext_info2: string;
  gps: string;
  tag_list: string[];
  machine_audit_result: {
    overall_score: number;
    sub_scores: {
      code: string;
      name: string;
      score: number;
      weight: number;
    }[];
    tags: {
      code: string;
      name: string;
    }[];
  };
}

export interface AuditTaskParams {
  task_id: number;
  audit_result: string; // 处理结果，通过：approved，拒绝：rejected
  clue_id: string;
  level: string;
  note: string;
  tag_id_list: number[];
}

export interface AuditTagItem {
  tag_id: number;
  tag_name: string;
}

export interface AuditTagList {
  tag_list: AuditTagItem[];
}

export interface AuditTaskListParams {
  page: number;
  limit: number;
  clue_id: string;
  handler_id: number;
  device_id: string;
  status: number; // 状态，0处理中，1通过，2未通过
  level: string;
}

export interface AuditTaskItem {
  id: number;
  clue_id: string;
  handler_name: string;
  status: {
    code: number;
    name: string;
  };
  sn: string;
  level: string;
  create_time: string;
  modify_time: string;
}

export interface AuditTaskList extends BaseListInfo {
  task_list: AuditTaskItem[];
}

export interface AuditClueListParams {
  page: number;
  limit: number;
  clue_id: string;
  device_id: string;
}

export interface AuditClueItem {
  id: number;
  clue_id: string;
  device_id: string;
  report_time: string; //线索上报时间
  create_time: string;
  modify_time: string;
}

export interface AuditClueList extends BaseListInfo {
  record_list: AuditClueItem[];
}

export interface AuditHandlerList extends BaseListInfo {
  handler_list: AuditHandlerItem[];
}

export interface AuditHandlerItem {
  handler_id: number;
  handler_name: string;
}

export interface BusinessTaskParams {
  page: number;
  limit: number;
  status?: string;
  company_id?: number;
  store_id?: number;
  start_time?: string;
  end_time?: string;
}

export interface BusinessTaskItem {
  id: number;
  clue_id: string;
  sn: string;
  device_id: string;
  vin: string;
  report_time: string;
  level: string;
  handler_name: string;
  status: StatusInfo;
  remark: string;
  gps: {
    lat: string;
    lng: string;
  };
  create_time: string;
  modify_time: string;
}

export interface BusinessTaskList extends BaseListInfo {
  task_list: BusinessTaskItem[];
}

export interface BlackListInfo {
  device_id: string;
  set_time: string;
}

export interface BlackListResponse {
  item_list: BlackListInfo[];
}
