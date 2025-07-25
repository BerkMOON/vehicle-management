import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import DeleteForm from '@/components/BasicComponents/DeleteForm';
import { COMMON_STATUS } from '@/constants';
import { useModalControl } from '@/hooks/useModalControl';
import { BusinessUserAPI } from '@/services/businessUser';
import type { UserInfo } from '@/services/user/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Form, Result } from 'antd';
import React, { useRef } from 'react';
import { getColumns } from './colums';
import { BusinessUserForm, UpdateRoleForm } from './opreatorForm';
import { searchForm } from './searchForm';

const DEFAULT_SEARCH_PARAMS = {
  status: COMMON_STATUS.ACTIVE,
};

const TableList: React.FC = () => {
  const { isLogin, businessUser } = useAccess();
  const businessUserAccess = businessUser();
  const baseListRef = useRef<BaseListPageRef>(null);
  const createOrModifyModal = useModalControl();
  const deleteModal = useModalControl();
  const updateRoleModal = useModalControl();
  const [selectedUser, setSelectedUser] = React.useState<UserInfo | null>(null);
  const [form] = Form.useForm();
  const [formInstance] = Form.useForm();

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    user?: UserInfo,
  ) => {
    if (user) {
      setSelectedUser(user);
    } else {
      setSelectedUser(null);
    }
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen,
    deleteModal,
    createOrModifyModal,
    updateRoleModal,
  });

  const handleFormValues = (record: Record<string, any>) => {
    return {
      ...record,
      username: selectedUser?.username,
    };
  };

  const fetchUserData = async (params: any) => {
    const { data } = await BusinessUserAPI.getAllBusinessUsers(params);
    return {
      list: data.user_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!businessUserAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="门店用户列表页面"
        columns={columns}
        searchFormItems={searchForm}
        defaultSearchParams={DEFAULT_SEARCH_PARAMS}
        fetchData={fetchUserData}
        createButton={{
          text: '新建门店用户',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <DeleteForm
        modalVisible={deleteModal.visible}
        onCancel={deleteModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{
          user_id: selectedUser?.id,
          status: COMMON_STATUS.DELETED,
        }}
        name="用户"
        api={BusinessUserAPI.status}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedUser(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '用户',
          successMsg: `${selectedUser ? '修改' : '创建'}用户成功`,
        }}
        api={selectedUser ? BusinessUserAPI.update : BusinessUserAPI.create}
        record={selectedUser}
        idMapKey="user_id"
        idMapValue="id"
        ownForm={form}
      >
        <BusinessUserForm isModify={!!selectedUser}></BusinessUserForm>
      </CreateOrModifyForm>
      <CreateOrModifyForm
        modalVisible={updateRoleModal.visible}
        onCancel={() => {
          updateRoleModal.close();
          setSelectedUser(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '用户',
          successMsg: '修改角色信息成功',
        }}
        api={BusinessUserAPI.updateRole}
        record={selectedUser}
        idMapKey="user_id"
        idMapValue="id"
        operatorFields={handleFormValues}
        ownForm={formInstance}
      >
        <UpdateRoleForm
          form={formInstance}
          roleList={selectedUser?.role_list}
        />
      </CreateOrModifyForm>
    </>
  );
};

export default TableList;
