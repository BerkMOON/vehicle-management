import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { ReturnProcessStatus } from '@/services/warehouse/storage/typings.d';
import { Col, DatePicker, Form, Input, Select } from 'antd';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="id" label="退货id">
        <Input placeholder="请输入退货id" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="sn" label="SN码">
        <Input placeholder="请输入SN码" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="process_status" label="处理状态">
        <Select
          style={{ width: '160px' }}
          placeholder="请选择处理状态"
          allowClear
          options={[
            { label: '待处理', value: ReturnProcessStatus.PENDING },
            { label: '已退厂', value: ReturnProcessStatus.TO_VENDOR },
            { label: '已重新入库', value: ReturnProcessStatus.RE_INBOUND },
            { label: '历史单', value: ReturnProcessStatus.HISTORICAL },
          ]}
        />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="company_id" label="公司">
        <CompanySelect style={{ width: '200px' }} />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="store_id" label="门店">
        <StoreSelect style={{ width: '200px' }} />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="remark" label="备注">
        <Input placeholder="备注" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="returnTimeRange" label="退货时间">
        <RangePicker showTime />
      </Form.Item>
    </Col>
  </>
);
