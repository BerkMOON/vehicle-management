import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, Form, Input } from 'antd';

export const searchForm = (
  <>
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
      <Form.Item name="mileage" label="最小里程数">
        <Input placeholder="请输入最小里程数" allowClear />
      </Form.Item>
    </Col>
  </>
);
