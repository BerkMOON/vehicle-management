/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！
import { ResponseInfoType } from '@/types/common';
import { request } from '@umijs/max';
import type {
  CaptchaRequest,
  CaptchaResponse,
  ModifyRoleParams,
  PageInfo_UserInfo,
  UserInfo,
  UserSelfInfo,
} from './typings';

const API_PREFIX_ADMIN = '/api/admin';
const API_PREFIX = `${API_PREFIX_ADMIN}/user`;

export const UserAPI = {
  /**
   * 获取用户列表
   * GET /api/admin/user/getAllUsers
   * @param params 分页参数
   */
  queryUserList: (params?: { page?: number; limit?: number }) =>
    request<ResponseInfoType<PageInfo_UserInfo>>(`${API_PREFIX}/getAllUsers`, {
      method: 'GET',
      params,
    }),

  /**
   * 获取用户详情
   * GET /api/getSelfInfo
   */
  getUserDetail: () =>
    request<ResponseInfoType<UserSelfInfo>>(`${API_PREFIX_ADMIN}/getSelfInfo`, {
      method: 'GET',
    }),

  /**
   * 用户登录
   * POST /api/login
   */
  loginUser: (params: {
    username: string;
    password: string;
    captcha?: string;
    captcha_id?: string;
  }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX_ADMIN}/login`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 用户登出
   * POST /api/logout
   */
  logout: () =>
    request<ResponseInfoType<null>>(`${API_PREFIX_ADMIN}/logout`, {
      method: 'POST',
    }),

  /**
   * 用户注册
   * POST /api/admin/user/register
   */
  createUser: (params: UserInfo) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/register`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 删除用户
   * POST /api/admin/user/delete
   */
  deleteUser: (params: { user_id: string }) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/delete`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 更新用户角色
   * POST /api/admin/user/updateUserRole
   */
  modifyRole: (params: ModifyRoleParams) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/updateUserRole`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 更新用户信息
   * POST /api/admin/user/updateUserInfo
   * 接口ID：210698804
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-210698804
   */
  modifyUserInfo: (params: UserInfo) =>
    request<ResponseInfoType<null>>(`${API_PREFIX}/updateUserInfo`, {
      method: 'POST',
      data: params,
    }),

  /**
   * 后台验证码接口
   * POST /api/admin/captcha/gen
   * 接口ID：350940898
   * 接口地址：https://app.apifox.com/link/project/5084807/apis/api-350940898
   */
  generateCaptcha: (params: CaptchaRequest) =>
    request<ResponseInfoType<CaptchaResponse>>(
      `${API_PREFIX_ADMIN}/captcha/gen`,
      {
        method: 'POST',
        data: params,
      },
    ),
};
