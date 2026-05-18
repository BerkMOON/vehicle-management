import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { INBOUND_STATUS } from '@/services/warehouse/inbound/typings.d';
import { OutboundAPI } from '@/services/warehouse/outbound/OutboundController';
import type {
  OutboundRecordItem,
  OutboundRecordParams,
} from '@/services/warehouse/outbound/typings.d';
import { fetchAllPaginatedData } from '@/utils/request';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { buildOutboundInvoiceWorkbook } from './buildOutboundInvoiceStatement';

const { RangePicker } = DatePicker;
const { Text } = Typography;

async function fetchAllOutboundBatches(
  params: Omit<OutboundRecordParams, 'page' | 'limit'>,
): Promise<OutboundRecordItem[]> {
  return fetchAllPaginatedData<OutboundRecordItem, OutboundRecordParams>(
    OutboundAPI.getOutboundRecords,
    { ...params } as OutboundRecordParams,
    { pageSize: 100, responseKey: 'batch_list' },
  );
}

const OutboundInvoicePage: React.FC = () => {
  const [form] = Form.useForm<{
    store_id?: string;
    time_range?: [Dayjs, Dayjs];
    status?: string;
    unit_price?: number;
  }>();
  const unitPriceWatched = Form.useWatch('unit_price', form);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<OutboundRecordItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const stats = useMemo(() => {
    const totalQty = records.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    const price = Number(unitPriceWatched) || 0;
    const totalAmount =
      price > 0 ? Math.round(totalQty * price * 100) / 100 : 0;
    return {
      batchCount: records.length,
      totalQty,
      totalAmount,
    };
  }, [records, unitPriceWatched]);

  const columns = [
    { title: '批次ID', dataIndex: 'id', width: 90 },
    { title: '批次名称', dataIndex: 'name', width: 160 },
    { title: '数量', dataIndex: 'quantity', width: 80 },
    { title: '设备类型', dataIndex: 'device_type', width: 120 },
    { title: '公司', dataIndex: 'company_name', width: 160 },
    { title: '门店', dataIndex: 'store_name', width: 160 },
    { title: '创建时间', dataIndex: 'create_time', width: 170 },
    { title: '修改时间', dataIndex: 'modify_time', width: 170 },
    { title: '备注', dataIndex: 'extra', width: 170 },
    {
      title: '状态',
      dataIndex: ['status', 'name'],
      width: 100,
    },
  ];

  const handleQuery = async () => {
    const values = await form.validateFields();
    if (!values.store_id) {
      message.warning('请选择门店');
      return;
    }
    if (!values.time_range?.[0] || !values.time_range?.[1]) {
      message.warning('请选择出库时间范围');
      return;
    }

    setLoading(true);
    try {
      const [start, end] = values.time_range;
      const list = await fetchAllOutboundBatches({
        store_id: values.store_id,
        start_time: start.format('YYYY-MM-DD HH:mm:ss'),
        end_time: end.format('YYYY-MM-DD HH:mm:ss'),
        status: values.status as INBOUND_STATUS | undefined,
      });
      setRecords(list);
      setSelectedRowKeys([]);
      message.success(`已加载 ${list.length} 条出库批次`);
    } catch (e) {
      console.error(e);
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedRecords = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map((k) => Number(k)));
    return records.filter((r) => keySet.has(Number(r.id)));
  }, [records, selectedRowKeys]);

  const handleExport = useCallback(() => {
    if (selectedRecords.length === 0) {
      message.warning('请在下方列表中勾选需要导出的出库批次');
      return;
    }
    const storeId = form.getFieldValue('store_id');
    const timeRange = form.getFieldValue('time_range') as
      | [Dayjs, Dayjs]
      | undefined;
    const unitPrice = Number(form.getFieldValue('unit_price')) || 0;
    if (!storeId || !timeRange?.[0] || !timeRange?.[1]) {
      message.warning('请先完成门店与时间查询');
      return;
    }

    const end = timeRange[1];
    const billMonthLabel = end.format('YYYY年M月');
    const buyerDisplayName =
      selectedRecords[0]?.store_name ||
      selectedRecords[0]?.company_name ||
      '购货方';
    const reconciliationDate = dayjs().format('YYYY-M-D');

    const wb = buildOutboundInvoiceWorkbook(selectedRecords, {
      billMonthLabel,
      buyerDisplayName,
      reconciliationDate,
      unitPrice,
    });

    const safeStore = (selectedRecords[0]?.store_name || '门店').replace(
      /[\\/:*?"<>|]/g,
      '_',
    );
    const fileName = `易达安-${safeStore}${billMonthLabel}对账单.xlsx`;

    XLSX.writeFile(wb, fileName);
    message.success('已开始下载');
  }, [form, selectedRecords]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  return (
    <PageContainer header={{ title: '开票对账单' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="查询条件">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            根据门店、出库时间与可选状态拉取出库批次（OutboundAPI.getOutboundRecords），用于汇总开票并导出对账单样式
            Excel。
          </Text>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              unit_price: 349,
            }}
          >
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="store_id"
                  label="门店"
                  rules={[{ required: true, message: '请选择门店' }]}
                >
                  <StoreSelect
                    style={{ width: '100%' }}
                    placeholder="请选择门店"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  name="time_range"
                  label="出库时间"
                  rules={[{ required: true, message: '请选择时间范围' }]}
                >
                  <RangePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="status" label="状态（可选）">
                  <Select
                    allowClear
                    placeholder="全部"
                    options={[
                      { label: '录入中', value: INBOUND_STATUS.PENDING },
                      { label: '提交中', value: INBOUND_STATUS.COMMITING },
                      { label: '已出库', value: INBOUND_STATUS.COMPLETED },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="unit_price"
                  label="含税单价（元，用于合计）"
                  tooltip="为 0 时导出中含税价格/总计为空或 0"
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={handleQuery}
            >
              查询
            </Button>
          </Form>
        </Card>

        {records.length > 0 && (
          <Card title="汇总">
            <Space size="large" wrap>
              <Statistic title="出库批次数" value={stats.batchCount} />
              <Statistic title="设备数量合计" value={stats.totalQty} />
              <Statistic
                title="含税金额合计（按单价估算）"
                value={stats.totalAmount}
                precision={2}
              />
            </Space>
          </Card>
        )}

        <Card title="出库明细（查询结果）">
          <Space wrap style={{ marginBottom: 12 }} align="center">
            <Text type="secondary">
              请勾选需要纳入对账单的出库批次，再点击导出（支持跨页保留勾选）。
            </Text>
            <Text>
              已选 <Text strong>{selectedRowKeys.length}</Text> 条
            </Text>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={selectedRowKeys.length === 0}
            >
              导出对账单 Excel
            </Button>
          </Space>
          <Table<OutboundRecordItem>
            rowKey="id"
            loading={loading}
            dataSource={records}
            columns={columns as any}
            rowSelection={rowSelection}
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Card>
      </Space>
    </PageContainer>
  );
};

export default OutboundInvoicePage;
