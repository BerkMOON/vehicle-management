import DeviceModelSelect from '@/pages/WarehouseManage/Components/DeviceModelSelect';
import { UPGRADE_MOUDULE_LABEL } from '@/services/ota/typings.d';
import { Col, Form, Select } from 'antd';

export const searchForm = (
  <>
    <Col>
      <Form.Item label="设备型号" name="model">
        <DeviceModelSelect
          style={{ width: '194px' }}
          placeholder="请选择设备型号"
        />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item label="模块类型" name="module_type">
        <Select
          style={{ width: '194px' }}
          placeholder="请选择模块类型"
          allowClear
          options={UPGRADE_MOUDULE_LABEL}
        />
      </Form.Item>
    </Col>
  </>
);
