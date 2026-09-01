import { AliyunOSSUpload } from '@/components/BusinessComponents/OSSUpload';
import DeviceModelSelect from '@/pages/WarehouseManage/Components/DeviceModelSelect';
import { OtaType } from '@/services/ota/typings.d';
import { Checkbox, Form, FormInstance, Input, Radio } from 'antd';
import { useWatch } from 'antd/es/form/Form';

interface OtaFormProps {
  form: FormInstance;
}

export const OtaForm: React.FC<OtaFormProps> = ({ form }) => {
  const moduleType = useWatch('module_type', form);
  const customVersion = useWatch('custom_version', form);

  const handleFileUpload = (fileInfo: {
    path: string;
    name: string;
    md5: string;
  }) => {
    form.setFieldsValue({
      path: fileInfo.path,
      filename: fileInfo.name,
      md5: fileInfo.md5,
    });
  };

  const validDate = (value: string) => {
    if (!value) return Promise.resolve();

    if (value.length !== 12) {
      return Promise.reject('版本号必须是12位数字');
    }

    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6));
    const day = parseInt(value.substring(6, 8));
    const hour = parseInt(value.substring(8, 10));
    const minute = parseInt(value.substring(10, 12));

    if (!/^\d+$/.test(value)) {
      return Promise.reject('版本号必须全部为数字');
    }

    if (month < 1 || month > 12) {
      return Promise.reject('月份必须在1-12之间');
    }

    if (hour < 0 || hour > 23) {
      return Promise.reject('小时必须在0-23之间');
    }
    if (minute < 0 || minute > 59) {
      return Promise.reject('分钟必须在0-59之间');
    }

    const date = new Date(year, month - 1, day);
    if (date.getMonth() + 1 !== month) {
      return Promise.reject('无效的日期');
    }

    return Promise.resolve();
  };

  return (
    <>
      <Form.Item
        label="模块类型"
        name="module_type"
        initialValue={OtaType.Firmware}
        rules={[{ required: true, message: '请选择模块类型' }]}
      >
        <Radio.Group>
          <Radio value={OtaType.Firmware}>固件</Radio>
          <Radio value={OtaType.Algorithm}>碰撞算法</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        label="是否自定义版本"
        name="custom_version"
        valuePropName="checked"
      >
        <Checkbox>自定义版本</Checkbox>
      </Form.Item>
      {customVersion && (
        <Form.Item
          label="自定义版本号"
          name="version"
          rules={[
            { required: true, message: '请输入自定义版本号' },
            {
              validator: (_, value) => validDate(value),
            },
          ]}
        >
          <Input placeholder="请输入自定义版本号，格式：年月日时分（如：202503251304）" />
        </Form.Item>
      )}

      <Form.Item
        label={`${moduleType === OtaType.Firmware ? '固件' : '碰撞算法'}文件`}
        name="fileList"
        rules={[
          {
            required: true,
            message: `请上传${
              moduleType === OtaType.Firmware ? '固件' : '碰撞算法'
            }文件`,
          },
        ]}
      >
        <AliyunOSSUpload
          type={moduleType}
          onUploadSuccess={handleFileUpload}
        ></AliyunOSSUpload>
      </Form.Item>

      <Form.Item name="path" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="filename" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="md5" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="设备型号"
        name="model"
        rules={[{ required: true, message: '请选择设备型号' }]}
      >
        <DeviceModelSelect
          style={{ width: '100%' }}
          allowClear={false}
          placeholder="请选择设备型号"
        />
      </Form.Item>

      <Form.Item label="版本描述" name="ext">
        <Input.TextArea rows={4} placeholder="请输入版本描述" />
      </Form.Item>
    </>
  );
};

export const OtaUpdataForm = () => {
  return (
    <Form.Item label="版本描述" name="ext">
      <Input.TextArea rows={4} placeholder="请输入版本描述" />
    </Form.Item>
  );
};

export { OtaPublishForm } from './publishForm';
