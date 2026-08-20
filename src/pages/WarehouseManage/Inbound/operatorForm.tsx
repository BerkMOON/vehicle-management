import { WarehouseUpload } from '@/pages/WarehouseManage/Components/WarehouseUpload';
import { OssSence } from '@/services/warehouse/oss/typings.d';
import { Form, FormInstance, Input, InputNumber } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import DeviceTypeSelect from '../Components/DeivceTypeSelect';
import DeviceModelSelect from '../Components/DeviceModelSelect';

interface InboundFormProps {
  form: FormInstance;
  isEdit?: boolean;
}

export const InboundForm: React.FC<InboundFormProps> = ({
  form,
  isEdit = false,
}) => {
  const model = useWatch('model', form);

  const handleFileUpload = (fileInfo: { path: string }) => {
    form.setFieldsValue({
      excel_file_path: fileInfo.path,
    });
  };

  return (
    <>
      <Form.Item
        name="name"
        label="入库批次名称"
        rules={[{ required: true, message: '请输入入库批次名称' }]}
      >
        <Input placeholder="请输入库批次名称" allowClear />
      </Form.Item>
      <Form.Item
        name="receivable_quantity"
        label="数量"
        rules={[{ required: true, message: '请输入数量' }]}
      >
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          placeholder="请输入数量"
        />
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
        label="入库文件"
        name="fileList"
        rules={[
          {
            required: !isEdit,
            message: `请上传入库文件`,
          },
        ]}
      >
        <WarehouseUpload
          scene={OssSence.Origin}
          onUploadSuccess={handleFileUpload}
        ></WarehouseUpload>
      </Form.Item>
      <Form.Item name="extra" label="备注">
        <Input.TextArea placeholder="请输入备注" allowClear />
      </Form.Item>
      <Form.Item name="excel_file_path" hidden>
        <Input />
      </Form.Item>
    </>
  );
};
