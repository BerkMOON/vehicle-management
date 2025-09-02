export const getColumns = () => {
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
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '退货时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
  ];
};
