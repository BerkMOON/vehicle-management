import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import {
  CreateRequest,
  GetAllBusinessRoleResponse,
  GetAllBusinessUsersRequest,
  GetAllBusinessUsersResponse,
  GetUserRolesResponse,
  RoleRequest,
  StatusRequest,
  UpdateRequest,
} from './typings';

const prefix = '/api/admin/user/business';

export const BusinessUserAPI = {
  /**
   * b端用户列表
   * GET /api/admin/user/business/getAllBusinessUsers
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  getAllBusinessUsers: (params?: GetAllBusinessUsersRequest) =>
    request<ResponseInfoType<GetAllBusinessUsersResponse>>(
      `${prefix}/getAllBusinessUsers`,
      {
        method: 'GET',
        params: params,
      },
    ),

  /**
   * 更新用户状态
   * POST /api/admin/user/business/status
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  status: (params: StatusRequest) =>
    request<ResponseInfoType<null>>(`${prefix}/status`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 更新用户信息
   * POST /api/admin/user/business/update
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  update: (params: UpdateRequest) =>
    request<ResponseInfoType<null>>(`${prefix}/update`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 更新用户角色
   * POST /api/admin/user/business/role
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  updateRole: (params: RoleRequest) =>
    request<ResponseInfoType<null>>(`${prefix}/updateUserRoles`, {
      method: 'POST',
      data: params,
    }),
  /**
   * b端权限列表
   * GET /api/admin/user/business/getAllBusinessRole
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  getAllBusinessRole: () =>
    request<ResponseInfoType<GetAllBusinessRoleResponse>>(
      `${prefix}/getAllBusinessRole`,
      {
        method: 'GET',
        params: {},
      },
    ),

  /**
   * 创建b端用户
   * POST /api/admin/user/business/create
   * 接口ID：undefined
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-undefined
   */
  create: (params: CreateRequest) =>
    request<ResponseInfoType<null>>(`${prefix}/create`, {
      method: 'POST',
      data: params,
    }),

  /**
   * b端用户权限关系列表
   * GET /api/admin/user/business/getUserRoles
   * 接口ID：325743716
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-325743716
   */
  getUserRoles: (params: GetAllBusinessUsersRequest) =>
    request<ResponseInfoType<GetUserRolesResponse>>(`${prefix}/getUserRoles`, {
      method: 'GET',
      params: params,
    }),
};
