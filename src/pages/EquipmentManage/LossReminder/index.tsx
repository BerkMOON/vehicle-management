import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { DeviceAPI } from '@/services/device/DeviceController';
import { Navigate, useAccess } from '@umijs/max';
import React, { useRef } from 'react';
import { getColumns } from './colums';
import { searchForm } from './searchForm';

const TableList: React.FC = () => {
  const { isLogin } = useAccess();
  const baseListRef = useRef<BaseListPageRef>(null);

  const columns = getColumns();

  const fetchUserData = async (params: any) => {
    const { data } = await DeviceAPI.getLossNotifications(params);
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  const searchParamsTransform = (params: any) => {
    const { loss_time, ...rest } = params;
    return {
      ...rest,
      start_time: loss_time?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      end_time: loss_time?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
  };

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="流失提醒页面"
        columns={columns}
        searchFormItems={searchForm}
        searchParamsTransform={searchParamsTransform}
        fetchData={fetchUserData}
      />
    </>
  );
};

export default TableList;
