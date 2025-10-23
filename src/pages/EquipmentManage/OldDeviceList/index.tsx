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
    const { data } = await DeviceAPI.getUnusedDeviceListNotUpdated(params);
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="旧版本设备页面"
        columns={columns}
        searchFormItems={searchForm}
        fetchData={fetchUserData}
        defaultSearchParams={{
          before_days: 10,
        }}
      />
    </>
  );
};

export default TableList;
