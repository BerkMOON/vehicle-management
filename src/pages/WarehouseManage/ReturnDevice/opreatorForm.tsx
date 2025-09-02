import { Form, Input } from 'antd';

export const createAndModifyForm = () => (
  <>
    <Form.Item
      required
      label="设备SN码"
      name="sn"
      rules={[{ required: true, message: '请输入设备SN码' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="备注" name="remark">
      <Input />
    </Form.Item>
  </>
);
