import { InboundAPI } from '@/services/warehouse/inbound/InboundController';
import type {
  InboundRecordItem,
  InboundRecordParams,
} from '@/services/warehouse/inbound/typings';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import { Button, Input, message, Modal, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

interface InboundSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (snList: string[]) => void;
}

const InboundSelector: React.FC<InboundSelectorProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [dataSource, setDataSource] = useState<InboundRecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<InboundRecordItem | null>(null);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 搜索参数
  const [searchParams, setSearchParams] = useState<{
    product_name?: string;
    status?: string;
  }>({});

  const columns: ColumnsType<InboundRecordItem> = [
    {
      title: '批次ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '批次名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '入库数量',
      dataIndex: 'receivable_quantity',
      key: 'receivable_quantity',
    },
    {
      title: '已收货数量',
      dataIndex: 'received_quantity',
      key: 'received_quantity',
    },
    {
      title: '状态',
      dataIndex: ['status', 'name'],
      key: 'status',
    },
    {
      title: '入库人',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: '入库时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
    },
  ];

  const fetchInboundData = async (
    extraParams: Partial<InboundRecordParams> = {},
  ) => {
    setLoading(true);
    try {
      const requestParams: InboundRecordParams = {
        page: current,
        limit: pageSize,
        ...extraParams,
      };

      if (searchParams.product_name) {
        requestParams.product_name = searchParams.product_name;
      }

      if (searchParams.status) {
        requestParams.status = searchParams.status as any;
      }

      const { data } = await InboundAPI.getInboundRecords(requestParams);
      setDataSource(data.batch_list);
      setTotal(data.meta.total_count);
    } catch (error) {
      message.error('获取入库记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrent(1);
    fetchInboundData();
  };

  const handleReset = () => {
    setSearchParams({});
    setCurrent(1);
    fetchInboundData();
  };

  const handleConfirm = async () => {
    if (!selectedRecord) {
      message.warning('请选择入库单');
      return;
    }

    setConfirmLoading(true);
    try {
      // 获取入库单详情，提取SN号列表
      const { data: storageData } = await StorageAPI.getStorageList({
        inbound_batch_id: selectedRecord.id,
        page: 1,
        limit: 1000, // 获取所有SN
      });

      const snList = storageData.record_list.map((item: any) => item.sn);

      if (snList.length === 0) {
        message.warning('该入库单暂无SN记录');
        return;
      }

      onConfirm(snList);
      message.success(`成功获取${snList.length}个SN号`);
    } catch (error) {
      message.error('获取SN号失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchInboundData();
    }
  }, [visible, current, pageSize]);

  const handleTableChange = (pagination: any) => {
    setCurrent(pagination.current);
    setPageSize(pagination.pageSize);
  };

  return (
    <Modal
      title="选择入库单"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmLoading}
          onClick={handleConfirm}
          disabled={!selectedRecord}
        >
          确认选择
        </Button>,
      ]}
    >
      {/* 搜索区域 */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <Input
            placeholder="请输入产品名称"
            value={searchParams.product_name}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                product_name: e.target.value,
              }))
            }
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择状态"
            value={searchParams.status}
            onChange={(value) =>
              setSearchParams((prev) => ({ ...prev, status: value }))
            }
            style={{ width: 120 }}
            allowClear
          >
            <Option value="processing">处理中</Option>
            <Option value="committing">提交中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedRecord ? [selectedRecord.id] : [],
          onChange: (_, selectedRows) => {
            setSelectedRecord(selectedRows[0] || null);
          },
        }}
        pagination={{
          current,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default InboundSelector;
