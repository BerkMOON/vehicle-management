import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const EntryInspectionSearchForm: React.FC = () => {
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
        <Form.Item name="vin" label="车架号">
          <Input placeholder="请输入车架号" allowClear />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item
          name="record_date"
          label="日期"
          getValueFromEvent={(d) =>
            d ? dayjs(d).format('YYYY-MM-DD') : undefined
          }
          getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
        >
          <DatePicker
            allowClear
            placeholder="选择日期"
            style={{ width: '200px' }}
          />
        </Form.Item>
      </Col>
    </>
  );
};

export const searchForm = <EntryInspectionSearchForm />;
