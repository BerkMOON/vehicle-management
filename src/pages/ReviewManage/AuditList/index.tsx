import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { TaskStatus } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import type {
  AuditTaskItem,
  BusinessTaskParams,
} from '@/services/audit/typings';
import { DeviceAPI } from '@/services/device/DeviceController';
import { fetchAllPaginatedData } from '@/utils/request';
import { DownloadOutlined } from '@ant-design/icons';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Result, message } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { getColumns } from './colums';
import { searchForm } from './searchForm';

const DEFAULT_SEARCH_PARAMS = {
  status: TaskStatus.All,
};

type BusinessTaskRow = AuditTaskItem & {
  company_name?: string;
  store_name?: string;
};

type DeviceExtraInfo = {
  vin: string;
  carInfo: string;
  phone: string;
};

const DEVICE_QUERY_CONCURRENCY = 8;

const formatCarInfo = (device?: { brand?: string; car_model?: string }) => {
  const parts = [device?.brand, device?.car_model].filter(Boolean);
  return parts.length ? parts.join(' ') : '';
};

/** 按 SN 批量查询设备信息（车架号 / 车辆信息 / 手机号） */
const fetchDeviceExtraBySns = async (sns: string[]) => {
  const uniqueSns = Array.from(new Set(sns.filter(Boolean)));
  const map = new Map<string, DeviceExtraInfo>();

  for (let i = 0; i < uniqueSns.length; i += DEVICE_QUERY_CONCURRENCY) {
    const batch = uniqueSns.slice(i, i + DEVICE_QUERY_CONCURRENCY);
    await Promise.all(
      batch.map(async (sn) => {
        try {
          const { data } = await DeviceAPI.getDeviceList({
            sn,
            page: 1,
            limit: 1,
          });
          const device = data?.device_list?.[0] as
            | {
                brand?: string;
                car_model?: string;
                vin?: string;
                phone?: string;
              }
            | undefined;
          map.set(sn, {
            vin: device?.vin || '',
            carInfo: formatCarInfo(device),
            phone: device?.phone || '',
          });
        } catch {
          map.set(sn, { vin: '', carInfo: '', phone: '' });
        }
      }),
    );
  }

  return map;
};

const AuditList: React.FC = () => {
  const { isLogin, clueList } = useAccess();
  const clueListAccess = clueList();
  const baseListRef = useRef<BaseListPageRef>(null);
  const lastQueryRef = useRef<Partial<BusinessTaskParams>>({});
  const [exporting, setExporting] = useState(false);

  const columns = getColumns();

  const fetchClueData = async (params: BusinessTaskParams) => {
    lastQueryRef.current = {
      status: params.status,
      company_id: params.company_id,
      store_id: params.store_id,
      start_time: params.start_time,
      end_time: params.end_time,
    };
    const { data } = await AuditAPI.getBTaskList(params);
    return {
      list: data.task_list,
      total: data.meta.total_count,
    };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const list = await fetchAllPaginatedData<
        BusinessTaskRow,
        Omit<BusinessTaskParams, 'page' | 'limit'>
      >(AuditAPI.getBTaskList, lastQueryRef.current, {
        pageSize: 200,
        responseKey: 'task_list',
      });

      if (list.length === 0) {
        message.warning('暂无数据可导出');
        return;
      }

      message.loading({
        content: '正在补充设备信息…',
        key: 'audit-export',
        duration: 0,
      });

      const deviceMap = await fetchDeviceExtraBySns(
        list.map((item) => item.sn),
      );

      const sheetData = list.map((item) => {
        const device = deviceMap.get(item.sn);
        return {
          线索ID: item.clue_id,
          门店: item.store_name ?? '',
          设备号: item.sn,
          车架号: device?.vin ?? '',
          车辆信息: device?.carInfo ?? '',
          用户手机号: device?.phone ?? '',
          审核通过时间: item.create_time,
        };
      });

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '工单列表');
      XLSX.writeFile(wb, `工单列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
      message.success({
        content: `导出成功，共 ${list.length} 条`,
        key: 'audit-export',
      });
    } catch (error: any) {
      message.error({
        content: error?.message || '导出失败',
        key: 'audit-export',
      });
    } finally {
      setExporting(false);
    }
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
      extraButtons={
        <Button
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          导出 Excel
        </Button>
      }
    />
  );
};

export default AuditList;
