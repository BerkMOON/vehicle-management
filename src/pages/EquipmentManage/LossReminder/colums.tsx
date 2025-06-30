import { NearbyPoint } from '@/services/device/typings';

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
      title: '触发时间',
      dataIndex: 'trigger_time',
    },
    // {
    //   title: '车辆品牌',
    //   dataIndex: 'brand',
    // },
    // {
    //   title: '车辆型号',
    //   dataIndex: 'car_model',
    // },
    // {
    //   title: '用户手机号',
    //   dataIndex: 'phone',
    // },
    {
      title: '触发位置',
      dataIndex: 'nearby_points',
      render: (point: NearbyPoint[]) => {
        return (
          <>
            {point?.map((item, index) => (
              <div key={index}>{item.name}</div>
            ))}
          </>
        );
      },
    },
    {
      title: '具体位置',
      dataIndex: 'nearby_points',
      render: (point: NearbyPoint[]) => {
        return (
          <>
            {point?.map((item, index) => (
              <div key={index}>
                {item.city}
                {item.district}
                {item.address}
              </div>
            ))}
          </>
        );
      },
    },
  ];
};
