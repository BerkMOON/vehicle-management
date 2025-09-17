import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, Form, Input } from 'antd';

export const searchForm = (
  <>
    <Col>
      <Form.Item name="company_id" label="选择公司">
        <CompanySelect style={{ width: '200px' }} placeholder="请选择公司" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="store_id" label="选择门店">
        <StoreSelect style={{ width: '200px' }} placeholder="请选择门店" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="before_days" label="未上线天数">
        <Input placeholder="请输入未上线天数" />
      </Form.Item>
    </Col>
  </>
);
