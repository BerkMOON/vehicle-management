export interface UserInfo {
  id: string;
  username: string;
  header_img: string;
  nickname: string;
  phone: string;
  email: string;
  company: string;
  department: string;
  user_id: string;
  role_name?: string;
  role_list?: RoleList[];
}
export interface RoleList {
  company_id: number;
  company_name?: string;
  role: Role;
  role_name: string;
  store_id: number;
  store_name?: string;
}
export interface InterfaceResult<T> {
  response_status: {
    code: number;
    msg: string;
    extension: {
      key: string;
      value: string;
    }[];
  };
  data?: T;
}

export interface AuthorityInfo {
  name: string;
  code: string;
  endpoints: {
    name: string;
    code: string;
  }[];
}
export interface UserSelfInfo {
  authority: (AuthorityInfo & {
    children: AuthorityInfo[];
  })[];
  user_info: UserInfo;
}

export interface PageInfo_UserInfo {
  meta: {
    total_count: number;
    total_page: number;
  };
  user_info_list: UserInfo[];
}

export interface ModifyRoleParams {
  user_id: string;
  role_id: string;
}
