import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useWatch } from 'antd/es/form/Form';
import React from 'react';
import DeviceTypeSelect from '../Components/DeivceTypeSelect';
import DeviceModelSelect from '../Components/DeviceModelSelect';

interface OutboundFormProps {
  form: FormInstance;
  isEdit: boolean;
}

export const OutboundForm: React.FC<OutboundFormProps> = ({
  form,
  isEdit = false,
}) => {
  const companyId = useWatch('company_id', form);
  const model = useWatch('model', form);

  return (
    <>
      <Form.Item
        name="name"
        label="批次名称"
        rules={[{ required: true, message: '请输入批次名称' }]}
      >
        <Input placeholder="请输入批次名称" />
      </Form.Item>
      {!isEdit && (
        <>
          <Form.Item
            name="model"
            label="设备型号"
            rules={[{ required: true, message: '请选择设备型号' }]}
          >
            <DeviceModelSelect
              style={{ width: '100%' }}
              allowClear={false}
              onChange={(value) => {
                form.setFieldsValue({
                  model: value,
                  device_type: undefined,
                });
              }}
            />
          </Form.Item>
          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
            dependencies={['model']}
          >
            <DeviceTypeSelect model={model} style={{ width: '100%' }} />
          </Form.Item>
        </>
      )}
      <Form.Item
        name="company_id"
        label="选择公司"
        rules={[{ required: true, message: '请选择公司' }]}
      >
        <CompanySelect
          placeholder="请选择公司"
          onChange={() => {
            form.setFieldValue('store_id', undefined);
          }}
        />
      </Form.Item>

      <Form.Item
        name="store_id"
        label="选择门店"
        rules={[{ required: true, message: '请选择门店' }]}
        dependencies={['company_id']}
      >
        <StoreSelect
          placeholder="请选择门店"
          companyId={companyId}
          disabled={!companyId}
        />
      </Form.Item>
      <Form.Item name="extra" label="备注">
        <Input.TextArea rows={4} placeholder="请输入备注" />
      </Form.Item>
    </>
  );
};
