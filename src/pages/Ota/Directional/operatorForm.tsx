import { AliyunOSSUpload } from '@/components/BusinessComponents/OSSUpload';
import DeviceModelSelect from '@/pages/WarehouseManage/Components/DeviceModelSelect';
import { OtaType } from '@/services/ota/typings.d';
import { Checkbox, Form, FormInstance, Input, Radio } from 'antd';
import { useWatch } from 'antd/es/form/Form';

interface DirectionalFormProps {
  form: FormInstance;
  isEdit?: boolean;
}

/** 校验自定义版本号：12 位年月日时分 */
export const validateVersionSuffix = (value: string) => {
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

const valueMatchesSuffix = (version?: string) =>
  !!version && /V\d{12}$/.test(version);

/** 从完整 version 中取出末尾 12 位时间戳 */
export const extractVersionSuffix = (version?: string) => {
  if (!valueMatchesSuffix(version)) return '';
  return version!.slice(-12);
};

export const buildDirectionalVersion = (
  model: string,
  moduleType: OtaType,
  suffix: string,
) => {
  const moduleName = moduleType === OtaType.Firmware ? 'firmware' : 'collision';
  return `${model}_${moduleName}_V${suffix}`;
};

export const DirectionalForm: React.FC<DirectionalFormProps> = ({
  form,
  isEdit = false,
}) => {
  const moduleType = useWatch('module_type', form);
  const customVersion = useWatch('custom_version', form);

  const handleFileUpload = (fileInfo: {
    path: string;
    name: string;
    md5: string;
  }) => {
    // 换包：清空 version，保留 id；自定义版本也清掉让用户重填或走自动生成
    form.setFieldsValue({
      path: fileInfo.path,
      filename: fileInfo.name,
      md5: fileInfo.md5,
      version: '',
      custom_version: false,
    });
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
            { validator: (_, value) => validateVersionSuffix(value) },
          ]}
          extra="格式：年月日时分（如：202503251304），保存时拼成 model_firmware_V + 该时间"
        >
          <Input placeholder="请输入自定义版本号，格式：年月日时分" />
        </Form.Item>
      )}

      <Form.Item
        label={`${moduleType === OtaType.Firmware ? '固件' : '碰撞算法'}文件`}
        name="fileList"
        rules={[
          {
            required: !isEdit,
            message: `请上传${
              moduleType === OtaType.Firmware ? '固件' : '碰撞算法'
            }文件`,
          },
        ]}
        extra={
          isEdit
            ? '换包会清空 version；保留 id 后保存由服务端换号'
            : '先选模块再上传，目录才会正确'
        }
      >
        <AliyunOSSUpload
          type={moduleType || OtaType.Firmware}
          onUploadSuccess={handleFileUpload}
        />
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
      <Form.Item name="id" hidden>
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

      <Form.Item
        label="定向设备"
        name="device_ids"
        rules={[{ required: true, message: '请输入设备 ID' }]}
        extra="多个设备用英文逗号或换行分隔，单条最多 2000"
      >
        <Input.TextArea
          rows={4}
          placeholder="device1,device2"
          autoSize={{ minRows: 2, maxRows: 8 }}
        />
      </Form.Item>

      <Form.Item label="版本描述" name="ext">
        <Input.TextArea rows={3} placeholder="请输入版本描述" />
      </Form.Item>
    </>
  );
};
