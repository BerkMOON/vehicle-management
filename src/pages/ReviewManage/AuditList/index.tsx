import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { TaskStatus } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import type { BusinessTaskParams } from '@/services/audit/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Result } from 'antd';
import React, { useRef } from 'react';
import { getColumns } from './colums';
import { searchForm } from './searchForm';

const DEFAULT_SEARCH_PARAMS = {
  status: TaskStatus.All,
};

const AuditList: React.FC = () => {
  const { isLogin, clueList } = useAccess();
  const clueListAccess = clueList();
  const baseListRef = useRef<BaseListPageRef>(null);

  const columns = getColumns();

  const fetchClueData = async (params: BusinessTaskParams) => {
    const { data } = await AuditAPI.getBTaskList(params);
    return {
      list: data.task_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!clueListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const searchParamsTransform = (params: any) => {
    const { timeRange, ...rest } = params;
    return {
      ...rest,
      start_time: timeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      end_time: timeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
  };

  return (
    <BaseListPage
      ref={baseListRef}
      title="工单列表"
      columns={columns}
      searchFormItems={searchForm}
      fetchData={fetchClueData}
      defaultSearchParams={DEFAULT_SEARCH_PARAMS}
      searchParamsTransform={searchParamsTransform}
    />
  );
};

export default AuditList;
