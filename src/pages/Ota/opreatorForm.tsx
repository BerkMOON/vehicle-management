import { AliyunOSSUpload } from '@/components/BusinessComponents/OSSUpload';
import {
  OtaType,
  UPGRADE_TYPE,
  UPGRADE_TYPE_LABEL,
} from '@/services/ota/typings.d';
import { Checkbox, Form, FormInstance, Input, Radio, Slider } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { useState } from 'react';

interface OtaFormProps {
  form: FormInstance;
}

export const OtaForm: React.FC<OtaFormProps> = ({ form }) => {
  const [upgradeType, setUpgradeType] = useState<UPGRADE_TYPE>();

  const moduleType = useWatch('module_type', form);
  const customVersion = useWatch('custom_version', form);

  const handleFileUpload = (fileInfo: {
    path: string;
    name: string;
    md5: string;
  }) => {
    // 设置多个表单字段的值
    form.setFieldsValue({
      path: fileInfo.path,
      filename: fileInfo.name,
      md5: fileInfo.md5,
    });
  };

  const validDate = (value: string) => {
    if (!value) return Promise.resolve();

    // 检查长度是否为12位
    if (value.length !== 12) {
      return Promise.reject('版本号必须是12位数字');
    }

    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6));
    const day = parseInt(value.substring(6, 8));
    const hour = parseInt(value.substring(8, 10));
    const minute = parseInt(value.substring(10, 12));

    // 检查是否都是数字
    if (!/^\d+$/.test(value)) {
      return Promise.reject('版本号必须全部为数字');
    }

    // 验证月份
    if (month < 1 || month > 12) {
      return Promise.reject('月份必须在1-12之间');
    }

    // 验证小时和分钟
    if (hour < 0 || hour > 23) {
      return Promise.reject('小时必须在0-23之间');
    }
    if (minute < 0 || minute > 59) {
      return Promise.reject('分钟必须在0-59之间');
    }

    // 验证日期是否有效
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

      {/* 隐藏的表单项，用于存储文件名 */}
      <Form.Item name="path" hidden>
        <Input />
      </Form.Item>

      {/* 隐藏的表单项，用于存储文件名 */}
      <Form.Item name="filename" hidden>
        <Input />
      </Form.Item>

      {/* 隐藏的表单项，用于存储 MD5 */}
      <Form.Item name="md5" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="设备型号"
        name="model"
        rules={[{ required: true, message: '请输入设备型号' }]}
      >
        <Input placeholder="请输入设备型号" />
      </Form.Item>

      <Form.Item
        label="发布方式"
        name="upgrade_type"
        rules={[{ required: true, message: '请选择发布方式' }]}
      >
        <Radio.Group onChange={(e) => setUpgradeType(e.target.value)}>
          {UPGRADE_TYPE_LABEL.map((item) => (
            <Radio key={item.value} value={item.value}>
              {item.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      {upgradeType === UPGRADE_TYPE.TARGETED && (
        <>
          <Form.Item
            label="定向设备"
            name="device_ids"
            rules={[{ required: false }]}
            extra="指定需要升级的设备"
          >
            <Input.TextArea
              placeholder="请输入设备ID，多个设备用英文逗号分隔，例如：device1,device2"
              style={{ width: '100%' }}
              rows={4}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>
        </>
      )}

      <Form.Item label="版本描述" name="ext">
        <Input.TextArea rows={4} placeholder="请输入版本描述" />
      </Form.Item>
    </>
  );
};

export const OtaUpdataForm = (props: { isTargeted: boolean }) => {
  const { isTargeted } = props;

  return (
    <>
      <Form.Item label="版本描述" name="ext">
        <Input.TextArea rows={4} placeholder="请输入版本描述" />
      </Form.Item>
      {isTargeted ? (
        <>
          <Form.Item
            label="定向设备"
            name="device_ids"
            rules={[{ required: false }]}
            extra="指定需要升级的设备"
          >
            <Input.TextArea
              placeholder="请输入设备ID，多个设备用英文逗号分隔，例如：device1,device2"
              style={{ width: '100%' }}
              rows={4}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>
        </>
      ) : null}
    </>
  );
};

export const OtaPublishForm = (
  <>
    <Form.Item
      label="灰度比例"
      name="release_range"
      rules={[{ required: true, message: '请选择灰度比例' }]}
    >
      <Slider
        min={0}
        max={100}
        marks={{
          0: '0%',
          25: '25%',
          50: '50%',
          75: '75%',
          100: '100%',
        }}
        tooltip={{
          formatter: (value) => `${value}%`,
        }}
      />
    </Form.Item>
  </>
);
