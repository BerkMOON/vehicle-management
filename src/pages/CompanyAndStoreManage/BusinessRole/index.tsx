import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { COMMON_STATUS } from '@/constants';
import { BusinessUserAPI } from '@/services/businessUser';
import { Navigate, useAccess } from '@umijs/max';
import { Result } from 'antd';
import React, { useRef } from 'react';
import { getColumns } from './colums';
import { searchForm } from './searchForm';

const DEFAULT_SEARCH_PARAMS = {
  status: COMMON_STATUS.ACTIVE,
};

const TableList: React.FC = () => {
  const { isLogin, businessRole } = useAccess();
  const businessRoleAccess = businessRole();
  const baseListRef = useRef<BaseListPageRef>(null);
  const columns = getColumns();

  const fetchUserData = async (params: any) => {
    const { data } = await BusinessUserAPI.getUserRoles(params);
    return {
      list: data.role_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!businessRoleAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="门店人员权限管理页面"
        columns={columns}
        searchFormItems={searchForm}
        defaultSearchParams={DEFAULT_SEARCH_PARAMS}
        fetchData={fetchUserData}
      />
    </>
  );
};

export default TableList;
