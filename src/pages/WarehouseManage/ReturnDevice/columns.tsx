import {
  ReturnItem,
  ReturnProcessStatus,
} from '@/services/warehouse/storage/typings.d';
import { RollbackOutlined, ShopOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface ReturnColumnsProps {
  onToVendor?: (record: ReturnItem) => void;
  onReInbound?: (record: ReturnItem) => void;
}

export const getColumns = (props: ReturnColumnsProps = {}) => {
  const { onToVendor, onReInbound } = props;

  return [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'SN码',
      dataIndex: 'sn',
      key: 'sn',
      render: (_: string, record: ReturnItem) =>
        record.snapshot?.sn || record.sn || '-',
    },
    {
      title: '设备型号',
      key: 'model',
      render: (_: unknown, record: ReturnItem) => record.snapshot?.model || '-',
    },
    {
      title: '公司名称',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      key: 'store_name',
    },
    {
      title: '处理状态',
      dataIndex: ['process_status', 'name'],
      key: 'process_status',
      render: (text: string) => text || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '退厂时间',
      dataIndex: 'return_time',
      key: 'return_time',
      render: (text: string) => text || '-',
    },
    {
      title: '重新入库时间',
      dataIndex: 're_inbound_time',
      key: 're_inbound_time',
      render: (text: string) => text || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_: unknown, record: ReturnItem) => {
        const pending =
          record.process_status?.code === ReturnProcessStatus.PENDING;
        if (!pending) return null;
        return (
          <>
            <Tooltip title="退还给厂家，设备将从仓管正式表删除">
              <Button
                type="link"
                icon={<ShopOutlined />}
                onClick={() => onToVendor?.(record)}
              >
                退厂
              </Button>
            </Tooltip>
            <Tooltip title="重新入库，设备回到在库状态">
              <Button
                type="link"
                icon={<RollbackOutlined />}
                onClick={() => onReInbound?.(record)}
              >
                重新入库
              </Button>
            </Tooltip>
          </>
        );
      },
    },
  ];
};
