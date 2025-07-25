import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import RoleSelect from '@/components/BusinessComponents/RoleSelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { RoleList } from '@/services/user/typings';
import { Button, Form, FormInstance, Input } from 'antd';

interface BusinessUserFormProps {
  form?: FormInstance;
  isModify?: boolean;
  roleList?: RoleList[];
}

export const BusinessUserForm: React.FC<BusinessUserFormProps> = ({
  isModify,
}) => {
  return (
    <>
      <Form.Item
        required
        label="用户名"
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input />
      </Form.Item>
      {!isModify && (
        <>
          <Form.Item required label="密码" name="password">
            <Input.Password />
          </Form.Item>
        </>
      )}
      <Form.Item label="显示名称" name="nickname">
        <Input />
      </Form.Item>
      <Form.Item label="手机号" name="phone">
        <Input />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input />
      </Form.Item>
    </>
  );
};

export const UpdateRoleForm: React.FC<BusinessUserFormProps> = ({
  form,
  roleList,
}) => {
  return (
    <Form.List name="role_list" initialValue={roleList}>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field) => (
            <div
              key={field.key}
              style={{
                marginBottom: 16,
                padding: 16,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
              }}
            >
              <Form.Item
                label="角色"
                name={[field.name, 'role']}
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <RoleSelect isBusinessRole={true} />
              </Form.Item>
              <Form.Item
                name={[field.name, 'company_id']}
                label="选择公司"
                rules={[{ required: true, message: '请选择公司' }]}
              >
                <CompanySelect
                  placeholder="请选择公司"
                  onChange={() => {
                    const currentValues = form?.getFieldValue('role_list');
                    if (currentValues && currentValues[field.name]) {
                      const newValues = [...currentValues];
                      newValues[field.name] = {
                        ...newValues[field.name],
                        store_id: undefined,
                      };
                      form?.setFieldsValue({ role_list: newValues });
                    }
                  }}
                />
              </Form.Item>
              <Form.Item
                name={[field.name, 'store_id']}
                label="选择门店"
                rules={[{ required: true, message: '请选择门店' }]}
                dependencies={[[field.name, 'company_id']]}
              >
                <StoreSelect
                  placeholder="请选择门店"
                  companyId={
                    form?.getFieldValue('role_list')?.[field.name]?.company_id
                  }
                />
              </Form.Item>
              <Button
                type="text"
                danger
                onClick={() => remove(field.name)}
                style={{ marginTop: 8 }}
              >
                删除
              </Button>
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => add()}
            block
            style={{ marginTop: 16 }}
          >
            添加角色配置
          </Button>
        </>
      )}
    </Form.List>
  );
};
