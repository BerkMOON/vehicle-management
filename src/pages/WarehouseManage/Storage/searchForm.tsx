import { StorageStatus } from '@/services/warehouse/storage/typings.d';
import { Col, DatePicker, Form, Input, Select } from 'antd';
import DeviceTypeSelect from '../Components/DeivceTypeSelect';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="inbound_batch_id" label="入库批次">
        <Input placeholder="请输入入库批次Id" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="outbound_batch_id" label="出库批次">
        <Input placeholder="请输入出库批次Id" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="sn" label="SN码">
        <Input placeholder="请输入SN码" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="icc_id" label="ICCID号">
        <Input placeholder="请输入ICCID号" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="device_type" label="设备类型">
        <DeviceTypeSelect />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="status" label="状态">
        <Select
          style={{ width: '200px' }}
          placeholder="请选择状态"
          allowClear
          options={[
            { label: '在库', value: StorageStatus.IN },
            { label: '已出库', value: StorageStatus.OUT },
            { label: '已退货', value: StorageStatus.RETURNED },
          ]}
        />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="inbound_time_range" label="入库时间">
        <RangePicker showTime />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item name="outbound_time_range" label="出库时间">
        <RangePicker showTime />
      </Form.Item>
    </Col>
  </>
);
