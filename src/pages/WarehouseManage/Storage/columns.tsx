import { StorageItem } from '@/services/warehouse/storage/typings.d';
import { history } from '@umijs/max';
import { Button } from 'antd';

export const getColumns = () => {
  return [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '库存状态',
      dataIndex: ['status', 'name'],
      key: 'status',
      render: (text: string) => {
        return (
          <>
            <span
              style={{
                color:
                  text === '在库'
                    ? '#1677ff'
                    : text === '已出库'
                    ? 'orange'
                    : 'red',
              }}
            >
              {text}
            </span>
          </>
        );
      },
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: 'SN码',
      dataIndex: 'sn',
      key: 'sn',
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
      title: '入库时间',
      dataIndex: 'inbound_time',
      key: 'inbound_time',
    },
    {
      title: '入库批次',
      dataIndex: 'inbound_batch_id',
      key: 'inbound_batch_id',
      render: (text: string, record: any) => {
        return record.inbound_batch_id ? (
          <a href={`/warehouse/inbound/detail/${record.inbound_batch_id}`}>
            {text}
          </a>
        ) : (
          ''
        );
      },
    },
    {
      title: '出库时间',
      dataIndex: 'outbound_time',
      key: 'outbound_time',
      render: (text: string, record: any) => {
        return record.outbound_time ? record.outbound_time : '未出库';
      },
    },
    {
      title: '出库批次',
      dataIndex: 'outbound_batch_id',
      key: 'outbound_batch_id',
      render: (text: string, record: any) => {
        return record.outbound_batch_id ? (
          <a href={`/warehouse/outbound/detail/${record.outbound_batch_id}`}>
            {text}
          </a>
        ) : (
          '未出库'
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_: any, record: StorageItem) => (
        <Button
          type="link"
          onClick={() => history.push(`/warehouse/storage/detail/${record.sn}`)}
        >
          详情
        </Button>
      ),
    },
  ];
};
