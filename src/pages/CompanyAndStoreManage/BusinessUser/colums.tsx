import { ModalControl } from '@/hooks/useModalControl';
import { RoleList, UserInfo } from '@/services/user/typings';
import { ColumnsProps } from '@/types/common';
import { Divider } from 'antd';

export const getColumns = (props: ColumnsProps<UserInfo>) => {
  const { handleModalOpen, deleteModal, createOrModifyModal, updateRoleModal } =
    props;

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
      dataIndex: 'role_list',
      render: (roleList: RoleList[]) => {
        return roleList.map((item, key) => (
          <div key={key}>{item.company_name}</div>
        ));
      },
    },
    {
      title: '门店',
      dataIndex: 'role_list',
      render: (roleList: RoleList[]) => {
        return roleList.map((item, key) => (
          <div key={key}>{item.store_name}</div>
        ));
      },
    },
    {
      title: '角色',
      dataIndex: 'role_list',
      render: (roleList: RoleList[]) => {
        return roleList.map((item, key) => <div key={key}>{item.role}</div>);
      },
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
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: UserInfo) => (
        <>
          <a
            onClick={() => handleModalOpen(deleteModal as ModalControl, record)}
          >
            删除用户
          </a>
          <Divider type="vertical" />
          <a onClick={() => handleModalOpen(createOrModifyModal, record)}>
            修改用户信息
          </a>
          <Divider type="vertical" />
          <a
            onClick={() =>
              handleModalOpen(updateRoleModal as ModalControl, record)
            }
          >
            修改角色信息
          </a>
        </>
      ),
    },
  ];
};
