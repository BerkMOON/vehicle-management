import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { SuccessCode } from '@/constants';
import { EntryCheckAPI } from '@/services/entryCheck/EntryCheckController';
import type {
  EntryInspectionLogListItem,
  EntryInspectionLogListParams,
} from '@/services/entryCheck/typings';
import { fetchAllPaginatedData } from '@/utils/request';
import { DownloadOutlined } from '@ant-design/icons';
import { Navigate, useAccess } from '@umijs/max';
import { Alert, Button, message } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { columns } from './columns';
import { searchForm } from './searchForm';

function buildListParams(params: Record<string, unknown>) {
  const { company_id, store_id, vin, record_date } = params;
  return {
    ...(company_id !== null && company_id !== ''
      ? { company_id: company_id as number | string }
      : {}),
    ...(store_id !== null && store_id !== ''
      ? { store_id: store_id as number | string }
      : {}),
    vin: (vin as string) || undefined,
    record_date: (record_date as string) || undefined,
  };
}

const EntryInspectionLogList: React.FC = () => {
  const { isLogin, entryInspectionLog } = useAccess();
  const hasAccess = entryInspectionLog();
  const baseListRef = useRef<BaseListPageRef>(null);
  const lastQueryRef = useRef<Record<string, unknown>>({});
  const [exporting, setExporting] = useState(false);

  const fetchData = async (params: Record<string, unknown>) => {
    lastQueryRef.current = params;
    const { page, limit } = params;
    const res = await EntryCheckAPI.listInspectionLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      ...buildListParams(params),
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = buildListParams(lastQueryRef.current);
      const list = await fetchAllPaginatedData<
        EntryInspectionLogListItem,
        Omit<EntryInspectionLogListParams, 'page' | 'limit'>
      >(EntryCheckAPI.listInspectionLogs, filters, {
        pageSize: 200,
        responseKey: 'item_list',
      });

      if (list.length === 0) {
        message.warning('暂无数据可导出');
        return;
      }

      const sheetData = list.map((item) => ({
        ID: item.id,
        公司: item.company_name,
        门店: item.store_name,
        工程师: item.business_user_name,
        车架号: item.vin,
        首次上传: item.ctime,
        最后更新: item.mtime,
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '入场车架号留痕');
      XLSX.writeFile(
        wb,
        `入场车架号留痕_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
      );
      message.success(`导出成功，共 ${list.length} 条`);
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!hasAccess) {
    return (
      <Alert type="warning" message="无入场车架号留痕权限，无法访问" showIcon />
    );
  }

  return (
    <BaseListPage
      ref={baseListRef}
      title="入场车架号留痕"
      columns={columns}
      searchFormItems={searchForm}
      fetchData={fetchData}
      extraButtons={
        <Button
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          导出
        </Button>
      }
    />
  );
};

export default EntryInspectionLogList;
