import StoreSelect from '@/components/BusinessComponents/StoreSelect';
import { Col, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export const searchForm = (
  <>
    <Col>
      <Form.Item name="store_id" label="门店">
        <StoreSelect style={{ width: '194px' }} placeholder="请选择门店" />
      </Form.Item>
    </Col>
    <Col>
      <Form.Item
        name="dateRange"
        label="时间范围"
        initialValue={[
          dayjs().startOf('isoWeek').subtract(7, 'day'),
          dayjs().endOf('isoWeek').subtract(7, 'day'),
        ]}
      >
        <RangePicker
          style={{ width: '280px' }}
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
        />
      </Form.Item>
    </Col>
  </>
);
