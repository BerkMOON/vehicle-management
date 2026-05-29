import BaseListPage from '@/components/BasicComponents/BaseListPage';
import { SuccessCode } from '@/constants';
import { EntryCheckAPI } from '@/services/entryCheck/EntryCheckController';
import { Navigate, useAccess } from '@umijs/max';
import { Alert, message } from 'antd';
import React from 'react';
import { columns } from './columns';
import { searchForm } from './searchForm';

const EntryInspectionLogList: React.FC = () => {
  const { isLogin, equipmentManage } = useAccess();

  const fetchData = async (params: Record<string, unknown>) => {
    const { page, limit, company_id, store_id, vin, record_date } = params;
    const res = await EntryCheckAPI.listInspectionLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      ...(company_id !== null && company_id !== ''
        ? { company_id: company_id as number | string }
        : {}),
      ...(store_id !== null && store_id !== ''
        ? { store_id: store_id as number | string }
        : {}),
      vin: (vin as string) || undefined,
      record_date: (record_date as string) || undefined,
    });

    if (res?.response_status?.code !== SuccessCode.SUCCESS) {
      message.error(res?.response_status?.msg || '查询失败');
      return { list: [], total: 0 };
    }

    return {
      list: res.data?.item_list ?? [],
      total: res.data?.meta?.total_count ?? 0,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!equipmentManage) {
    return (
      <Alert
        type="warning"
        message="无设备管理权限，无法访问入场车架号留痕"
        showIcon
      />
    );
  }

  return (
    <BaseListPage
      title="入场车架号留痕"
      columns={columns}
      searchFormItems={searchForm}
      fetchData={fetchData}
    />
  );
};

export default EntryInspectionLogList;
