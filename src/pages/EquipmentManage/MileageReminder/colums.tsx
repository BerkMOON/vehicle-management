import { MileageReminderInfo } from '@/services/device/typings';

export const getColumns = () => {
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
      title: '车型',
      dataIndex: 'device_id',
      render: (_: any, record: MileageReminderInfo) => {
        return <span>{`${record.brand} ${record.car_model}`}</span>;
      },
    },
    {
      title: '里程',
      dataIndex: 'mileage',
      render: (text: number) => {
        return <span>{text.toFixed(0)} km</span>;
      },
    },
    {
      title: '用户手机号',
      dataIndex: 'phone',
    },
  ];
};
