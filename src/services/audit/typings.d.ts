import { BaseListInfo } from '@/types/common';
export interface AuditInfo {
  task_id: number;
  equipment_id: string;
  clue_id: string;
}

export interface AuditTaskDetailParams {
  clue_id: string;
  needRecordDetail?: boolean;
  needAuditResult?: boolean;
}

export interface AuditTaskDetail {
  id: number;
  clue_id: string;
  handler_name: string;
  equipment_id: string;
  status: {
    code: number;
    name: string;
  };
  begin_time: string;
  end_time: string;
  level: string;
  note: string;
  create_time: string;
  modify_time: string;
  video_url: string;
  report_time: string;
  ext_info1: string;
  ext_info2: string;
  ext_info3: string;
  tag_list: string[];
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
  equipment_id: string;
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
  level: string;
  create_time: string;
  modify_time: string;
}

export interface AuditTaskList {
  task_list: AuditTaskItem[];
  meta: {
    total_count: number;
    total_page: number;
  };
}

export interface AuditClueListParams {
  page: number;
  limit: number;
  clue_id: string;
  equipment_id: string;
}

export interface AuditClueItem {
  id: number;
  clue_id: string;
  equipment_id: string;
  report_time: string; //线索上报时间
  create_time: string;
  modify_time: string;
}

export interface AuditClueList {
  record_list: AuditClueItem[];
  meta: {
    total_count: number;
    total_page: number;
  };
}

export interface AuditHandlerList extends BaseListInfo {
  handler_list: AuditHandlerItem[];
}

export interface AuditHandlerItem {
  handler_id: number;
  handler_name: string;
}