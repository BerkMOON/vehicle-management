import QrCodeScanner from '@/components/BasicComponents/QrCodeScanner';
import { Form, Input, Space } from 'antd';
import React from 'react';

// 创建一个专门的SN码输入组件，支持 value 和 onChange
interface SnInputWithScannerProps {
  value?: string;
  onChange?: (value: string) => void;
}

const SnInputWithScanner: React.FC<SnInputWithScannerProps> = ({
  value,
  onChange,
}) => {
  // 扫描成功回调
  const handleScanSuccess = (decodedText: string) => {
    console.log('扫描结果:', decodedText);
    // 通过 onChange 更新表单值
    onChange?.(decodedText);
  };

  // 输入框变化回调
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        placeholder="请输入或扫描设备SN码"
        value={value}
        onChange={handleInputChange}
      />
      <QrCodeScanner
        onScan={handleScanSuccess}
        buttonText="扫码"
        buttonType="primary"
      />
    </Space.Compact>
  );
};

export const createAndModifyForm = () => (
  <>
    <Form.Item
      required
      label="设备SN码"
      name="sn"
      rules={[{ required: true, message: '请输入设备SN码' }]}
    >
      <SnInputWithScanner />
    </Form.Item>
    <Form.Item label="备注" name="remark">
      <Input />
    </Form.Item>
  </>
);
