import type { InboundRecordItem } from '@/services/warehouse/inbound/typings';
import { Card, Descriptions } from 'antd';

interface BatchInfoProps {
  record: InboundRecordItem | null;
  duplicateSNs: string[];
}

export const BatchInfo: React.FC<BatchInfoProps> = ({
  record,
  duplicateSNs,
}) => {
  return (
    <Card title="批次信息" style={{ marginBottom: '20px' }}>
      <Descriptions column={4}>
        <Descriptions.Item label="批次ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="批次名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="入库表单">
          <a
            href={record?.excel_file_url}
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
        <Descriptions.Item label="设备类型">
          {record?.device_type}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {record?.status?.name}
        </Descriptions.Item>
        <Descriptions.Item label="备注">{record?.extra}</Descriptions.Item>
        {duplicateSNs.length > 0 ? (
          <Descriptions.Item label="重复SN码">
            <span style={{ color: 'red' }}>{duplicateSNs.join(', ')}</span>
          </Descriptions.Item>
        ) : (
          '无'
        )}
      </Descriptions>
    </Card>
  );
};
