import { SuccessCode } from '@/constants';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type { DeviceType } from '@/services/warehouse/storage/typings.d';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

interface DeviceTypeSelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const DeviceTypeSelect: React.FC<DeviceTypeSelectProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  style,
}) => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);

  const fetchDeviceTypes = async () => {
    try {
      const response = await StorageAPI.getDeviceTypes();
      if (response.response_status.code === SuccessCode.SUCCESS) {
        setDeviceTypes(response.data.type_list || []);
      }
    } catch (error) {
      console.error('Failed to fetch device types:', error);
    }
  };

  useEffect(() => {
    fetchDeviceTypes();
  }, []);

  return (
    <Select
      placeholder={placeholder || '请选择设备类型'}
      allowClear
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...(style
        ? { style: { width: '200px', ...style } }
        : { style: { width: '200px' } })}
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
