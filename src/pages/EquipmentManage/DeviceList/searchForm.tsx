import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, DatePicker, Form, Input, Select } from 'antd';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col span={6}>
      <Form.Item name="sn" label="SN号">
        <Input placeholder="请输入设备SN号" allowClear />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="vin" label="车架号">
        <Input placeholder="请输入车架号" allowClear />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="company_id" label="选择公司">
        <CompanySelect placeholder="请选择公司" />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="store_id" label="选择门店">
        <StoreSelect placeholder="请选择门店" />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="phone" label="手机号">
        <Input placeholder="请输入手机号" allowClear />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="status" label="用户状态">
        <Select
          placeholder="请选择用户状态"
          allowClear
          style={{ width: 180 }}
          options={[
            { label: '未绑定', value: 'init' },
            { label: '已绑定', value: 'bound' },
          ]}
        />
      </Form.Item>
    </Col>
    <Col span={9}>
      <Form.Item name="unreported" label="上报状态">
        <Select
          placeholder="请选择用户状态"
          allowClear
          style={{ width: 180 }}
          options={[{ label: '未上报', value: 'true' }]}
        />
      </Form.Item>
    </Col>
    <Col span={9}>
      <Form.Item name="bind_time" label="首次绑定时间">
        <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
      </Form.Item>
    </Col>
    <Col span={9}>
      <Form.Item name="onset_time" label="首次上报时间">
        <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
      </Form.Item>
    </Col>
  </>
);
