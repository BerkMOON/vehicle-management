import { ModalControl } from '@/hooks/useModalControl';
import {
  INBOUND_STATUS_CODE,
  InboundRecordItem,
} from '@/services/warehouse/inbound/typings.d';
import { ColumnsProps } from '@/types/common';
import { history } from '@umijs/max';
import { Button } from 'antd';

export const getColumns = (props: ColumnsProps<InboundRecordItem>) => {
  const { handleModalOpen, createOrModifyModal, deleteModal } = props;

  return [
    {
      title: '批次ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '入库批次名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '应收数量',
      dataIndex: 'receivable_quantity',
      key: 'receivable_quantity',
    },
    {
      title: '实收数量',
      dataIndex: 'received_quantity',
      key: 'received_quantity',
    },
    {
      title: '入库时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
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
      title: '备注',
      dataIndex: 'extra',
      key: 'extra',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_: any, record: InboundRecordItem) => (
        <>
          {record.status.code === INBOUND_STATUS_CODE.PENDING ? (
            <>
              <Button
                type="link"
                onClick={() =>
                  handleModalOpen(deleteModal as ModalControl, record)
                }
              >
                删除批次
              </Button>
              <Button
                type="link"
                onClick={() => handleModalOpen(createOrModifyModal, record)}
              >
                修改
              </Button>
              <Button
                type="link"
                onClick={() =>
                  history.push(`/warehouse/inbound/input/${record.id}`)
                }
              >
                商品录入
              </Button>
            </>
          ) : (
            <Button
              type="link"
              onClick={() =>
                history.push(`/warehouse/inbound/detail/${record.id}`)
              }
            >
              详情
            </Button>
          )}
        </>
      ),
    },
  ];
};
