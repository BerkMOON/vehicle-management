import { SuccessCode } from '@/constants';
import { CompetitionDashboardAPI } from '@/services/competitionDashboard';
import type {
  CompetitionAfterSalesRowItem,
  CompetitionNewCarRowItem,
} from '@/services/competitionDashboard/typings.d';
import { DeleteOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_COMPETITION_CONFIG, TABLE_TYPE_LABEL } from '../constants';
import { fetchBackendStoreLinks } from '../utils/storeIdMap';

type RowItem = CompetitionNewCarRowItem | CompetitionAfterSalesRowItem;

interface RowDataPanelProps {
  onDataChanged?: () => void;
}

function buildClearScopeText(params: {
  storeLabel: string;
  tableType: 'new_car' | 'after_sales' | 'all';
  businessDate?: string;
  vin?: string;
}): string {
  const parts = [`门店：${params.storeLabel}`];
  parts.push(
    `表类型：${
      params.tableType === 'all'
        ? '新车 + 售后'
        : TABLE_TYPE_LABEL[params.tableType]
    }`,
  );
  if (params.businessDate) {
    parts.push(`业务日期：${params.businessDate}`);
  } else {
    parts.push('业务日期：不限（该门店全部日期）');
  }
  if (params.vin?.trim()) {
    parts.push(`VIN：${params.vin.trim()}`);
  }
  return parts.join('；');
}

const RowDataPanel: React.FC<RowDataPanelProps> = ({ onDataChanged }) => {
  const [tableType, setTableType] = useState<'new_car' | 'after_sales'>(
    'new_car',
  );
  const [storeId, setStoreId] = useState<number | undefined>();
  const [businessDate, setBusinessDate] = useState<string>();
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearTableType, setClearTableType] = useState<
    'new_car' | 'after_sales' | 'all'
  >('new_car');
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

  const storeLabel = useMemo(
    () => storeOptions.find((item) => item.value === storeId)?.label || '',
    [storeOptions, storeId],
  );

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

  const handleClear = async () => {
    if (!storeId) {
      message.warning('请先选择门店');
      return;
    }
    setClearing(true);
    try {
      const res = await CompetitionDashboardAPI.clearRows({
        store_id: storeId,
        table_type: clearTableType,
        business_date: businessDate,
        vin: vin.trim() || undefined,
      });
      if (res?.response_status?.code !== SuccessCode.SUCCESS) {
        throw new Error(res?.response_status?.msg || '清除失败');
      }
      const deletedNew = res.data?.deleted_new_car_count ?? 0;
      const deletedAfter = res.data?.deleted_after_sales_count ?? 0;
      message.success(
        `已清除：新车 ${deletedNew} 行，售后 ${deletedAfter} 行。请重新上传正确文件。`,
      );
      setClearModalOpen(false);
      setPage(1);
      await loadRows();
      onDataChanged?.();
    } catch (error) {
      console.error(error);
      message.error(error instanceof Error ? error.message : '清除失败');
    } finally {
      setClearing(false);
    }
  };

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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="数据纠错"
        description="发现上传错误时，在此按门店/日期筛选后清除数据库行，再到「文件上传」重新导入。清除操作不可恢复，请谨慎确认。"
      />
      <Tabs
        activeKey={tableType}
        onChange={(key) => {
          setTableType(key as 'new_car' | 'after_sales');
          setClearTableType(key as 'new_car' | 'after_sales');
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
          placeholder="门店（清除时必选）"
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
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={!storeId}
          onClick={() => {
            setClearTableType(tableType);
            setClearModalOpen(true);
          }}
        >
          清除数据
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

      <Modal
        title="确认清除竞赛数据"
        open={clearModalOpen}
        onCancel={() => !clearing && setClearModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            disabled={clearing}
            onClick={() => setClearModalOpen(false)}
          >
            取消
          </Button>,
          <Popconfirm
            key="confirm"
            title="确定清除？此操作不可恢复"
            okText="确定清除"
            cancelText="再想想"
            onConfirm={handleClear}
          >
            <Button type="primary" danger loading={clearing}>
              确认清除
            </Button>
          </Popconfirm>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>将按以下条件从数据库删除行数据：</div>
          <Select
            style={{ width: '100%' }}
            value={clearTableType}
            onChange={setClearTableType}
            options={[
              { label: TABLE_TYPE_LABEL.new_car, value: 'new_car' },
              { label: TABLE_TYPE_LABEL.entry_check, value: 'after_sales' },
              { label: '新车 + 售后两类表', value: 'all' },
            ]}
          />
          <Alert
            type="warning"
            showIcon
            message={buildClearScopeText({
              storeLabel: storeLabel || `store_id=${storeId}`,
              tableType: clearTableType,
              businessDate,
              vin,
            })}
            description={
              businessDate
                ? `当前列表约 ${total} 条（仅作参考，以实际删除结果为准）`
                : '未选业务日期时，将清除该门店在对应表中的全部历史行'
            }
          />
        </Space>
      </Modal>
    </div>
  );
};

export default RowDataPanel;
