import BaseTable from '@/components/BasicComponents/BaseTable';
import { InboundAPI } from '@/services/warehouse/inbound/InboundController';
import type { InboundRecordItem } from '@/services/warehouse/inbound/typings';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Descriptions, message } from 'antd';
import React, { useEffect, useState } from 'react';

const InboundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<InboundRecordItem | null>(null);
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
      const { data } = await InboundAPI.getInboundDetail({
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
            入库详情
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
          <Descriptions.Item label="入库上传表单">
            <a
              href={record?.excel_file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              下载
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="入库结果表单">
            <a
              href={record?.result_excel_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              下载
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="入库数量">
            {record?.receivable_quantity}
          </Descriptions.Item>
          <Descriptions.Item label="入库人">
            {record?.creator_name}
          </Descriptions.Item>
          <Descriptions.Item label="入库时间">
            {record?.modify_time}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {record?.status?.name}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{record?.extra}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="商品列表">
        <BaseTable
          columns={columns}
          fetchData={fetchData}
          defaultPageSize={100}
          searchParams={{ inbound_batch_id: Number(id) }}
        />
      </Card>
    </PageContainer>
  );
};

export default InboundDetail;
