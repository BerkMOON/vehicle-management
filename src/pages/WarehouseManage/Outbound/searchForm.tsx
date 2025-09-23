import CompanySelect from '@/components/BusinessComponents/CompanySelect';
import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { INBOUND_STATUS } from '@/services/warehouse/inbound/typings.d';
import { Col, DatePicker, Form, Input, Select } from 'antd';
import DeviceTypeSelect from '../Components/DeivceTypeSelect';
import HandlerSelect from '../Components/HandlerSelect';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="name" label="批次名称">
        <Input placeholder="请输入批次名称" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="status" label="状态">
        <Select
          style={{ width: '140px' }}
          placeholder="请选择状态"
          allowClear
          options={[
            { label: '录入中', value: INBOUND_STATUS.PENDING },
            { label: '提交中', value: INBOUND_STATUS.COMMITING },
            { label: '已出库', value: INBOUND_STATUS.COMPLETED },
          ]}
        />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="device_type" label="设备类型">
        <DeviceTypeSelect />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="creator_id" label="处理人">
        <HandlerSelect type="outbound" style={{ width: '200px' }} />
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
      <Form.Item name="time_range" label="出库时间">
        <RangePicker showTime />
      </Form.Item>
    </Col>
  </>
);
