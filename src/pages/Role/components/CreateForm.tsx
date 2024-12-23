import AuthoritySelect from '@/components/AuthoritySelect/AuthoritySelect';
import { createRole } from '@/services/role/RoleController';
import { Form, Input, message, Modal } from 'antd';
import React from 'react';

interface CreateFormProps {
  modalVisible: boolean;
  refresh: () => void;
  onCancel: () => void;
}

const CreateForm: React.FC<CreateFormProps> = (props) => {
  const { modalVisible, onCancel, refresh } = props;
  const [form] = Form.useForm();

  const onCreate = async (values: any) => {
    try {
      await createRole(values);
      refresh();
      onCancel();
    } catch (e) {
      message.error('接口报错，请稍后再试');
      console.error(e);
    }
  };

  return (
    <Modal
      destroyOnClose
      title="新建角色"
      width={420}
      open={modalVisible}
      onCancel={() => onCancel()}
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="form_in_modal"
          clearOnDestroy
          onFinish={(values) => onCreate(values)}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item required label="角色名称" name="role_name">
        <Input />
      </Form.Item>
      <Form.Item label="角色权限" name="code_list">
        <AuthoritySelect></AuthoritySelect>
      </Form.Item>
    </Modal>
  );
};

export default CreateForm;
