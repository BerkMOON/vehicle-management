export const getColumns = () => {
  return [
    {
      title: '账号',
      dataIndex: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'nickname',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
    },
    {
      title: '公司',
      dataIndex: 'company_name',
    },
    {
      title: '门店',
      dataIndex: 'store_name',
    },
    {
      title: '角色',
      dataIndex: 'role',
    },
    {
      title: '用户状态',
      dataIndex: 'status',
      render: (status: { name: string; code: string }) => status.name,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
    },
    {
      title: '更新时间',
      dataIndex: 'modify_time',
    },
  ];
};
