import { deleteRole } from '@/services/role/RoleController';
import { Modal } from 'antd';
import React from 'react';

interface DeleteFormProps {
  modalVisible: boolean;
  roleId: string;
  refresh: () => void;
  onCancel: () => void;
}

const DeleteForm: React.FC<DeleteFormProps> = (props) => {
  const { modalVisible, onCancel, refresh, roleId } = props;

  const onDelete = async () => {
    await deleteRole(roleId);
    refresh();
    onCancel();
  };

  return (
    <Modal
      destroyOnClose
      title="删除角色"
      width={420}
      open={modalVisible}
      onCancel={() => onCancel()}
      onOk={onDelete}
    >
      <div>是否删除角色，删除后不可回复，请确认</div>
    </Modal>
  );
};

export default DeleteForm;
