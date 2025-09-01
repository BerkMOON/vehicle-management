import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type { StorageItem } from '@/services/warehouse/storage/typings.d';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Descriptions, message } from 'antd';
import React, { useEffect, useState } from 'react';

const StorageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<StorageItem>();
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const {
        data: { record_list },
      } = await StorageAPI.getStorageList({ sn: id, limit: 1, page: 1 });
      setDetail(record_list[0]);
    } catch (error) {
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
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
            仓储详情
          </>
        ),
      }}
    >
      <Card loading={loading}>
        <Descriptions column={2}>
          <Descriptions.Item label="库存状态">
            {detail?.status?.name}
          </Descriptions.Item>
          <Descriptions.Item label="SN码">{detail?.sn}</Descriptions.Item>
          <Descriptions.Item label="IMEI号">
            {detail?.device_id}
          </Descriptions.Item>
          <Descriptions.Item label="ICCID号">
            {detail?.icc_id}
          </Descriptions.Item>
          <Descriptions.Item label="设备类型">
            {detail?.device_type}
          </Descriptions.Item>
          <Descriptions.Item label="入库时间">
            {detail?.create_time}
          </Descriptions.Item>
          <Descriptions.Item label="入库批次">
            {detail?.inbound_batch_id ? (
              <a href={`/warehouse/inbound/detail/${detail.inbound_batch_id}`}>
                {detail.inbound_batch_id}
              </a>
            ) : (
              ''
            )}
          </Descriptions.Item>
          <Descriptions.Item label="出库时间">
            {detail?.out_time || '未出库'}
          </Descriptions.Item>
          <Descriptions.Item label="出库批次">
            {detail?.outbound_batch_id ? (
              <a
                href={`/warehouse/outbound/detail/${detail.outbound_batch_id}`}
              >
                {detail.outbound_batch_id}
              </a>
            ) : (
              '未出库'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </PageContainer>
  );
};

export default StorageDetail;
