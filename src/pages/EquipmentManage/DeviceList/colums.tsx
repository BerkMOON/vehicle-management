import { ModalControl } from '@/hooks/useModalControl';
import { DeviceList } from '@/services/device/typings';
import { Button } from 'antd';

interface GetColumnsProps {
  handleModalOpen: (modal: ModalControl, device: DeviceList) => void;
  updateModal: ModalControl;
}

export const getColumns = (props: GetColumnsProps) => {
  const { handleModalOpen, updateModal } = props;
  return [
    {
      title: '公司名称',
      dataIndex: 'company_name',
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
    },
    {
      title: '设备SN码',
      dataIndex: 'sn',
    },
    {
      title: '车架号',
      dataIndex: 'vin',
    },
    {
      title: '车辆品牌',
      dataIndex: 'brand',
    },
    {
      title: '车辆型号',
      dataIndex: 'car_model',
    },
    {
      title: '用户手机号',
      dataIndex: 'phone',
    },
    {
      title: '首次上报时间',
      dataIndex: 'onset_time',
    },
    {
      title: '用户状态',
      dataIndex: ['status', 'name'],
    },
    {
      title: '用户绑定时间',
      dataIndex: 'bind_time',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_: any, record: DeviceList) => {
        return (
          <Button
            type="link"
            onClick={() => handleModalOpen(updateModal, record)}
          >
            修改信息
          </Button>
        );
      },
    },
  ];
};
