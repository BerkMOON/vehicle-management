import BaseTable from '@/components/BasicComponents/BaseTable';
import { OutboundAPI } from '@/services/warehouse/outbound/OutboundController';
import type { OutboundRecordItem } from '@/services/warehouse/outbound/typings';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Descriptions, message } from 'antd';
import React, { useEffect, useState } from 'react';

const InboundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<OutboundRecordItem | null>(null);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: 'SN码',
      dataIndex: 'sn',
      key: 'sn',
      render: (text: string) => {
        return (
          <a
            href={`/warehouse/storage/detail/${text}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text}
          </a>
        );
      },
    },
    {
      title: 'IMEI号',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: 'ICCID号',
      dataIndex: 'icc_id',
      key: 'icc_id',
    },
    {
      title: '扫码日期',
      dataIndex: 'scan_date',
      key: 'scan_date',
    },
    {
      title: '设备型号',
      dataIndex: 'device_model',
      key: 'device_model',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '录入时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
  ];

  const fetchDetail = async () => {
    setLoading(true);
    try {
      // 获取批次信息
      const { data } = await OutboundAPI.getOutboundDetail({
        batch_id: Number(id),
      });
      setRecord(data);
    } catch (error) {
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (params: any) => {
    // 获取已入库的商品列表
    const { data } = await StorageAPI.getStorageList(params);
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  return (
    <PageContainer
      header={{
        title: (
          <>
            <ArrowLeftOutlined
              onClick={() => {
                history.back();
              }}
            />{' '}
            出库详情
          </>
        ),
      }}
    >
      <Card title="批次信息" style={{ marginBottom: '20px' }} loading={loading}>
        <Descriptions column={4}>
          <Descriptions.Item label="批次ID">{record?.id}</Descriptions.Item>
          <Descriptions.Item label="批次名称">{record?.name}</Descriptions.Item>
          <Descriptions.Item label="设备类型">
            {record?.device_type}
          </Descriptions.Item>
          <Descriptions.Item label="出库数量">
            {record?.quantity}
          </Descriptions.Item>
          <Descriptions.Item label="出库公司">
            {record?.company_name}
          </Descriptions.Item>
          <Descriptions.Item label="出库门店">
            {record?.store_name}
          </Descriptions.Item>
          <Descriptions.Item label="出库人">
            {record?.creator_name}
          </Descriptions.Item>
          <Descriptions.Item label="出库时间">
            {record?.modify_time}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {record?.status?.name}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{record?.extra}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="出库列表">
        <BaseTable
          columns={columns}
          fetchData={fetchData}
          defaultPageSize={100}
          searchParams={{ outbound_batch_id: Number(id) }}
        />
      </Card>
    </PageContainer>
  );
};

export default InboundDetail;
