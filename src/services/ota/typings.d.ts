import { COMMON_STATUS } from '@/constants';
import { BaseListInfo } from '@/types/common';

export enum UPGRADE_TYPE {
  FULL_GRAY = 1,
  TARGETED = 2,
}

export enum OtaType {
  Firmware = 1,
  Algorithm,
}

export const UPGRADE_TYPE_LABEL = [
  { label: '全量灰度', value: UPGRADE_TYPE.FULL_GRAY },
];

export const UPGRADE_MOUDULE_LABEL = [
  {
    label: '固件',
    value: OtaType.Firmware,
  },
  {
    label: '碰撞算法',
    value: OtaType.Algorithm,
  },
];

export interface OtaItem {
  id: number;
  model: string; // 设备型号
  version: string; //版本
  status: {
    name: string;
    code: COMMON_STATUS;
  }; // 状态，生效：active，删除：deleted
  filename: string; // 文件名
  path: string; // 文件url
  md5: string;
  handler_name: string; // 处理人
  upgrade_type: {
    name: string;
    code: UPGRADE_TYPE;
  }; // 升级类型，1：全量灰度，2：定向设备
  rule: string; // 规则
  release_range: number; // 灰度比例
  ext: string; // 扩展信息
  create_time: string; // 创建时间
  modify_time: string; // 修改时间
}

export interface OtaList extends BaseListInfo {
  record_list: OtaItem[];
}

export interface OtaParams {
  page: number;
  limit: number;
  model: string; // 型号
  version?: string;
  status?: COMMON_STATUS; // 状态，生效：active，删除：deleted
  upgrade_type?: UPGRADE_TYPE; // 升级类型，1：全量灰度，2：定向设备
  module_type?: OtaType;
}

export interface OssConfig {
  policy: string;
  signature: string;
  ossAccessKeyId: string;
  host: string;
  dir: string;
}

/** 全量灰度创建：仅 upgrade_type=1，不再传 device_ids */
export interface OtaCreateParams {
  model: string;
  filename: string;
  path: string;
  md5: string;
  upgrade_type: UPGRADE_TYPE.FULL_GRAY;
  module_type: OtaType;
  version?: string;
  release_range?: number;
  ext?: string;
}

/** 全量灰度更新：已去掉 device_ids */
export interface OtaUpdateParams {
  record_id: number;
  ext: string;
}

export interface OtaDeleteParams {
  record_id: number;
  status: number;
}

export interface OtaReleaseParams {
  record_id: number;
  release_range: number;
}

export interface OtaUploadParams {
  module_type: OtaType;
}

/** 定向升级单条规则 */
export interface DirectionalOtaItem {
  id?: string;
  model: string;
  module_type: OtaType;
  version?: string;
  filename: string;
  path: string;
  md5: string;
  device_ids: string[];
  ext?: string;
}

export interface DirectionalOtaConfig {
  handler_id: number;
  handler_name: string;
  modify_time: string;
  items: DirectionalOtaItem[];
}

export interface DirectionalSetConfigParams {
  allow_empty?: boolean;
  expected_modify_time: string;
  items: DirectionalOtaItem[];
}

/** 定向保存相关错误码 */
export enum DIRECTIONAL_ERROR_CODE {
  EMPTY_WITHOUT_ALLOW = 800004,
  OVER_LIMIT = 800005,
  CONFLICT = 800006,
  INVALID_ITEM = 100001,
}
