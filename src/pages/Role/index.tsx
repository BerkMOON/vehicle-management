import { getAllRoles } from '@/services/role/RoleController';
import { PageContainer } from '@ant-design/pro-components';
import { Access, Navigate, useAccess } from '@umijs/max';
import { Button, Divider, Table } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import CreateForm from './components/CreateForm';
import DeleteForm from './components/DeleteForm';
import ModifyForm from './components/ModifyForm';
import UpdateRoleForm from './components/UpdateRoleForm';

const TableList: React.FC<unknown> = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const { isLogin, userList } = useAccess();
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [deleteModalVisible, handleDeleteModalVisible] =
    useState<boolean>(false);
  const [modifyModalVisible, handleModifyModalVisible] =
    useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<any[]>();
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'role_name',
      key: 'role_name',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      key: 'action',
      render: (_: null, record: any) => (
        <>
          <a
            onClick={() => {
              setSelectedId(record.role_id);
              handleUpdateModalVisible(true);
            }}
          >
            更新角色权限
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => {
              setSelectedId(record.role_id);
              handleModifyModalVisible(true);
            }}
          >
            更新角色信息
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => {
              setSelectedId(record.role_id);
              handleDeleteModalVisible(true);
            }}
          >
            删除角色
          </a>
        </>
      ),
    },
  ];

  const getData = useCallback(async () => {
    const { data } = await getAllRoles({
      page: pageInfo.page,
      limit: pageInfo.limit,
    });

    const { role_info_list, meta } = data || {};
    setData(role_info_list);
    setPageInfo({
      page: pageInfo.page,
      limit: pageInfo.limit,
      total: meta?.total_count || 0,
    });
  }, [pageInfo]);

  useEffect(() => {
    getData();
  }, []);

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!userList) {
    return (
      <Access
        accessible={userList}
        fallback={<div>Can not read foo content.</div>}
      />
    );
  }

  return (
    <PageContainer
      header={{
        title: '角色管理页面',
      }}
    >
      <div>
        <Button
          onClick={() => handleModalVisible(true)}
          type="primary"
          style={{ marginBottom: 16 }}
        >
          新建
        </Button>
        <Button
          onClick={getData}
          type="primary"
          style={{ marginBottom: 16, marginLeft: 16 }}
        >
          刷新
        </Button>
      </div>
      <Table
        rowKey="role_id"
        dataSource={data}
        columns={columns}
        pagination={{
          onChange: (page, pageSize) => {
            setPageInfo({
              page,
              limit: pageSize,
              total: pageInfo.total,
            });
          },
        }}
      ></Table>
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        modalVisible={createModalVisible}
        refresh={getData}
      ></CreateForm>
      <DeleteForm
        onCancel={() => handleDeleteModalVisible(false)}
        modalVisible={deleteModalVisible}
        refresh={getData}
        roleId={selectedId}
      ></DeleteForm>
      <UpdateRoleForm
        onCancel={() => handleUpdateModalVisible(false)}
        modalVisible={updateModalVisible}
        refresh={getData}
        roleId={selectedId}
      ></UpdateRoleForm>
      <ModifyForm
        onCancel={() => handleModifyModalVisible(false)}
        modalVisible={modifyModalVisible}
        refresh={getData}
        roleId={selectedId}
      ></ModifyForm>
    </PageContainer>
  );
};

export default TableList;
