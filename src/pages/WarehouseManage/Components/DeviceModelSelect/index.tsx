import { SuccessCode } from '@/constants';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type { DeviceModel } from '@/services/warehouse/storage/typings.d';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

interface DeviceModelSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** 展示名映射后的回调，可选 */
  allowClear?: boolean;
}

/** 展示名：后端若仍返回「慧颖」文案，前端统一显示为「汇影」 */
export function formatModelName(name?: string) {
  if (!name) return '';
  return name.replace(/慧颖/g, '汇影');
}

const DeviceModelSelect: React.FC<DeviceModelSelectProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  style,
  allowClear = true,
}) => {
  const [models, setModels] = useState<DeviceModel[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await StorageAPI.getModels();
        if (response.response_status.code === SuccessCode.SUCCESS) {
          setModels(response.data.model_list || []);
        }
      } catch (error) {
        console.error('Failed to fetch device models:', error);
      }
    };
    fetchModels();
  }, []);

  return (
    <Select
      placeholder={placeholder || '请选择设备型号'}
      allowClear={allowClear}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: '200px', ...style }}
    >
      {models.map((item) => (
        <Option key={item.model} value={item.model}>
          {formatModelName(item.model_name) || item.model}
        </Option>
      ))}
    </Select>
  );
};

export default DeviceModelSelect;
