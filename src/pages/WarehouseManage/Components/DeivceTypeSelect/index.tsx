import { SuccessCode } from '@/constants';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type { DeviceType } from '@/services/warehouse/storage/typings.d';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

interface DeviceTypeSelectProps {
  value?: string | number;
  onChange?: (value: string | number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** 必填：按型号拉取对应类型组 */
  model?: string;
}

const DeviceTypeSelect: React.FC<DeviceTypeSelectProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  style,
  model,
}) => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);

  useEffect(() => {
    if (!model) {
      setDeviceTypes([]);
      return;
    }

    const fetchDeviceTypes = async () => {
      try {
        const response = await StorageAPI.getDeviceTypes({ model });
        if (response.response_status.code === SuccessCode.SUCCESS) {
          setDeviceTypes(response.data.type_list || []);
        } else {
          setDeviceTypes([]);
        }
      } catch (error) {
        console.error('Failed to fetch device types:', error);
        setDeviceTypes([]);
      }
    };
    fetchDeviceTypes();
  }, [model]);

  return (
    <Select
      placeholder={
        placeholder || (model ? '请选择设备类型' : '请先选择设备型号')
      }
      allowClear
      value={value}
      onChange={onChange}
      disabled={disabled || !model}
      style={{ width: '200px', ...style }}
    >
      {deviceTypes.map((type) => (
        <Option key={type.type_enum} value={type.type_enum}>
          {type.type_name}
        </Option>
      ))}
    </Select>
  );
};

export default DeviceTypeSelect;
