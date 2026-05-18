import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, Form, Input } from 'antd';
import React from 'react';

const EntryCollisionSearchForm: React.FC = () => {
  const companyId = Form.useWatch('company_id');

  return (
    <>
      <Col>
        <Form.Item name="company_id" label="公司">
          <CompanySelect style={{ width: '200px' }} placeholder="全部公司" />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="store_id" label="门店">
          <StoreSelect
            style={{ width: '200px' }}
            placeholder="请选择门店"
            companyId={
              companyId !== null && companyId !== '' ? String(companyId) : ''
            }
            disabled={!companyId}
          />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="vin" label="VIN">
          <Input placeholder="请输入 VIN" allowClear />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="sn" label="SN">
          <Input placeholder="请输入 SN" allowClear />
        </Form.Item>
      </Col>
    </>
  );
};

export const searchForm = <EntryCollisionSearchForm />;
