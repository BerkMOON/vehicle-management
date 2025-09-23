import { INBOUND_STATUS } from '@/services/warehouse/inbound/typings.d';
import { Col, DatePicker, Form, Input, Select } from 'antd';
import DeviceTypeSelect from '../Components/DeivceTypeSelect';
import HandlerSelect from '../Components/HandlerSelect';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="name" label="入库批次名称">
        <Input placeholder="请输入库批次名称" allowClear />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="creator_id" label="处理人">
        <HandlerSelect type="inbound" style={{ width: '200px' }} />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="status" label="状态">
        <Select
          style={{ width: '200px' }}
          placeholder="请选择状态"
          allowClear
          options={[
            { label: '录入中', value: INBOUND_STATUS.PENDING },
            { label: '提交中', value: INBOUND_STATUS.COMMITING },
            { label: '已入库', value: INBOUND_STATUS.COMPLETED },
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
      <Form.Item name="time_range" label="入库时间">
        <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
      </Form.Item>
    </Col>
  </>
);
