import { PageInfo } from 'types/common';

// b端用户列表 请求参数
export interface GetAllBusinessUsersRequest {
  page?: number;
  limit?: number;
  username?: string;
  phone?: string;
  email?: string;
  status?: number;
  role?: string;
  company_id?: number;
  store_id?: number;
}

export interface BusinessUserInfo {
  id?: number;
  username?: string;
  header_img?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  company_name?: string;
  store_name?: string;
  status?: {
    code: number;
    name: string;
  };
  role?: string;
  role_name?: string;
  create_time?: string;
  modify_time?: string;
}

// b端用户列表 返回结果
export interface GetAllBusinessUsersResponse {
  meta: PageInfo;
  user_list: BusinessUserInfo[];
}

export interface GetUserRolesResponse {
  meta: PageInfo;
  role_list: BusinessUserInfo[];
}

// 更新用户状态 请求参数
export interface StatusRequest {
  user_id: number;
  status: number;
}

// 更新用户信息 请求参数
export interface UpdateRequest {
  user_id: number;
  header_img?: string;
  nickname?: string;
  phone?: string;
  email?: string;
}

// 更新用户角色 请求参数
export interface RoleRequest {
  user_id: number;
  role: string;
}

export interface BusinessRoleInfo {
  role?: string;
  desc?: string;
}

// b端权限列表 返回结果
export interface GetAllBusinessRoleResponse {
  role_list: BusinessRoleInfo[];
}

// 创建b端用户 请求参数
export interface CreateRequest {
  username: string;
  password: string;
  header_img?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  company_id: number;
  store_id: number;
  role: string;
}
