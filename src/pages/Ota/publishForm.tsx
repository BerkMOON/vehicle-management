import { Form, Slider } from 'antd';

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
