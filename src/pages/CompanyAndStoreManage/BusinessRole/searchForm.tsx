import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import RoleSelect from '@/components/BusinessComponents/RoleSelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, Form, Input } from 'antd';

export const searchForm = (
  <>
    <Col>
      <Form.Item name="username" label="用户姓名">
        <Input placeholder="请输入用户姓名" allowClear />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="company_id" label="公司">
        <CompanySelect style={{ width: '194px' }} placeholder="请选择公司" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="store_id" label="门店">
        <StoreSelect style={{ width: '194px' }} placeholder="请选择门店" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="role" label="角色">
        <RoleSelect
          style={{ width: '194px' }}
          placeholder="请选择角色"
          isBusinessRole={true}
        />
      </Form.Item>
    </Col>
  </>
);
