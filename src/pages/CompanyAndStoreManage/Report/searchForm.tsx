// import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, Form } from 'antd';

export const searchForm = (
  <>
    <Col>
      <Form.Item name="store_id" label="门店">
        <StoreSelect style={{ width: '194px' }} placeholder="请选择门店" />
      </Form.Item>
    </Col>
  </>
);
