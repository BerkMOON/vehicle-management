import type { OutboundRecordItem } from '@/services/warehouse/outbound/typings.d';
import { Card, Descriptions } from 'antd';

interface BatchInfoProps {
  record: OutboundRecordItem | null;
  tableData: { sn: string }[];
}

export const BatchInfo: React.FC<BatchInfoProps> = ({ record, tableData }) => {
  return (
    <Card title="批次信息" style={{ marginBottom: '20px' }}>
      <Descriptions column={4}>
        <Descriptions.Item label="出库商品数量：">
          {tableData.length}
        </Descriptions.Item>
        <Descriptions.Item label="批次ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="批次名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="出库公司">
          {record?.company_name}
        </Descriptions.Item>
        <Descriptions.Item label="设备类型">
          {record?.device_type}
        </Descriptions.Item>
        <Descriptions.Item label="出库门店">
          {record?.store_name}
        </Descriptions.Item>
        <Descriptions.Item label="出库人">
          {record?.creator_name}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {record?.status?.name}
        </Descriptions.Item>
        <Descriptions.Item label="备注">{record?.extra}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
};
