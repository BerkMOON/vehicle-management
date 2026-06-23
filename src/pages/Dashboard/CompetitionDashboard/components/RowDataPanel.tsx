import { SuccessCode } from '@/constants';
import { CompetitionDashboardAPI } from '@/services/competitionDashboard';
import type {
  CompetitionAfterSalesRowItem,
  CompetitionNewCarRowItem,
} from '@/services/competitionDashboard/typings.d';
import { Button, DatePicker, Input, Select, Space, Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_COMPETITION_CONFIG } from '../constants';
import { fetchBackendStoreLinks } from '../utils/storeIdMap';

type RowItem = CompetitionNewCarRowItem | CompetitionAfterSalesRowItem;

const RowDataPanel: React.FC = () => {
  const [tableType, setTableType] = useState<'new_car' | 'after_sales'>(
    'new_car',
  );
  const [storeId, setStoreId] = useState<number | undefined>();
  const [businessDate, setBusinessDate] = useState<string>();
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [storeOptions, setStoreOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  useEffect(() => {
    fetchBackendStoreLinks(DEFAULT_COMPETITION_CONFIG)
      .then((links) => {
        setStoreOptions(
          links.map((link) => ({
            label: link.competitionStoreName,
            value: Number(link.backendStoreId),
          })),
        );
      })
      .catch(console.error);
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        store_id: storeId,
        business_date: businessDate,
        vin: vin.trim() || undefined,
      };
      const res =
        tableType === 'new_car'
          ? await CompetitionDashboardAPI.getNewCarRows(params)
          : await CompetitionDashboardAPI.getAfterSalesRows(params);
      if (res?.response_status?.code !== SuccessCode.SUCCESS) {
        throw new Error(res?.response_status?.msg || '查询失败');
      }
      setRows(res.data?.list || []);
      setTotal(res.data?.meta?.total_count || 0);
    } catch (error) {
      console.error(error);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tableType, storeId, businessDate, vin, page]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const columns = useMemo(
    () => [
      { title: '门店', dataIndex: 'store_name', width: 140 },
      { title: '业务日期', dataIndex: 'business_date', width: 120 },
      { title: 'VIN', dataIndex: 'vin', width: 180 },
      { title: '安装标记', dataIndex: 'installed_flag', width: 120 },
      { title: '备注', dataIndex: 'remark', ellipsis: true },
      { title: '入库时间', dataIndex: 'mtime', width: 170 },
    ],
    [],
  );

  return (
    <div>
      <Tabs
        activeKey={tableType}
        onChange={(key) => {
          setTableType(key as 'new_car' | 'after_sales');
          setPage(1);
        }}
        items={[
          { key: 'new_car', label: '新车安装表' },
          { key: 'after_sales', label: '售后安装表' },
        ]}
      />
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="门店"
          style={{ width: 180 }}
          options={storeOptions}
          value={storeId}
          onChange={setStoreId}
        />
        <DatePicker
          placeholder="业务日期"
          value={businessDate ? dayjs(businessDate) : undefined}
          onChange={(value) =>
            setBusinessDate(value ? value.format('YYYY-MM-DD') : undefined)
          }
        />
        <Input
          placeholder="VIN"
          style={{ width: 200 }}
          value={vin}
          onChange={(e) => setVin(e.target.value)}
        />
        <Button
          type="primary"
          onClick={() => {
            setPage(1);
            loadRows();
          }}
        >
          查询
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (count) => `共 ${count} 条`,
        }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default RowDataPanel;
