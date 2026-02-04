import { Form, Input } from 'antd';

export const UpdateDeviceForm = () => (
  <>
    <Form.Item label="用户手机号" name="phone">
      <Input placeholder="请输入用户手机号" />
    </Form.Item>
    <Form.Item label="车架号" name="vin">
      <Input placeholder="请输入车架号" />
    </Form.Item>
    <Form.Item label="车辆品牌" name="brand">
      <Input placeholder="请输入车辆品牌" />
    </Form.Item>
    <Form.Item label="车辆型号" name="car_model">
      <Input placeholder="请输入车辆型号" />
    </Form.Item>
  </>
);
