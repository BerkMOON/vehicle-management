import { getAllRoles } from '@/services/user/UserController';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

const RoleSelect: React.FC<any> = (props) => {
  const { value, onChange } = props;
  //   const [form] = Form.useForm();
  //   const [formValues, setFormValues] = useState<any>();

  const [option, setOptions] = useState<any>([]);
  //   const onCreate = async (values: any) => {
  //     console.log('Received values of form: ', values);
  //     setFormValues(values);
  //     await register(values);
  //     refresh();
  //     onCancel();
  //   };

  useEffect(() => {
    getAllRoles()
      .then((result) => {
        const {
          data: { role_info_list },
        } = result;
        setOptions(
          role_info_list.map((role: any) => ({
            label: role.role_name,
            value: role.role_id,
          })),
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return <Select options={option} value={value} onChange={onChange}></Select>;
};

export default RoleSelect;