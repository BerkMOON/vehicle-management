import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, DatePicker, Form, Input } from 'antd';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="device_id" label="设备号">
        <Input placeholder="请输入设备号" allowClear />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="sn" label="SN号">
        <Input placeholder="请输入设备SN号" allowClear />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="company_id" label="选择公司">
        <CompanySelect style={{ width: '194px' }} placeholder="请选择公司" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="store_id" label="选择门店">
        <StoreSelect style={{ width: '194px' }} placeholder="请选择门店" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="loss_time" label="流失时间">
        <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
      </Form.Item>
    </Col>
  </>
);
