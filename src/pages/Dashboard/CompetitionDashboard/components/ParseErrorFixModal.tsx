import {
  Alert,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo } from 'react';
import { TABLE_TYPE_LABEL } from '../constants';
import { CompetitionDashboardService } from '../services/competitionService';
import { ParseErrorFixInput, ParseErrorRow } from '../types';
import { cleanVin } from '../utils/vin';

interface ParseErrorFixModalProps {
  open: boolean;
  record: ParseErrorRow | null;
  submitting: boolean;
  onSubmit: (input: ParseErrorFixInput) => void;
  onCancel: () => void;
}

const ParseErrorFixModal: React.FC<ParseErrorFixModalProps> = ({
  open,
  record,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<{
    storeId: string;
    tableType: ParseErrorFixInput['tableType'];
    businessDate: dayjs.Dayjs;
    vin: string;
    installedFlag?: string;
    remark?: string;
  }>();

  const config = CompetitionDashboardService.getConfig();

  const storeOptions = useMemo(
    () =>
      config.stores
        .filter((store) => store.active)
        .map((store) => ({ label: store.name, value: store.id })),
    [config.stores],
  );

  const tableTypeOptions = [
    { label: TABLE_TYPE_LABEL.new_car, value: 'new_car' as const },
    { label: TABLE_TYPE_LABEL.entry_check, value: 'entry_check' as const },
  ];

  useEffect(() => {
    if (!open || !record) return;
    const parsedDate = record.businessDate?.trim();
    form.setFieldsValue({
      storeId: record.storeId,
      tableType: record.tableType,
      businessDate: parsedDate ? dayjs(parsedDate) : undefined,
      vin: record.rawVin || '',
      installedFlag: record.installedFlag,
      remark: record.remark,
    });
  }, [open, record, form]);

  const vinValue = Form.useWatch('vin', form);
  const vinPreview = useMemo(() => {
    if (!vinValue?.trim()) return null;
    return cleanVin(vinValue);
  }, [vinValue]);

  const handleOk = async () => {
    if (!record) return;
    const values = await form.validateFields();
    onSubmit({
      errorId: record.id,
      storeId: values.storeId,
      tableType: values.tableType,
      businessDate: values.businessDate.format('YYYY-MM-DD'),
      vin: values.vin,
      installedFlag: values.installedFlag,
      remark: values.remark,
    });
  };

  return (
    <Modal
      title="修正解析失败行"
      open={open}
      width={560}
      okText="确认入库"
      cancelText="取消"
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      {record && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              文件 <Typography.Text code>{record.fileName}</Typography.Text> 第{' '}
              {record.rowNo} 行：{record.reason}
            </span>
          }
          description={
            record.rawBusinessDate ? (
              <span>
                原始日期：{record.rawBusinessDate}
                {record.rawVin ? ` · 原始车架号：${record.rawVin}` : ''}
              </span>
            ) : record.rawVin ? (
              <span>原始车架号：{record.rawVin}</span>
            ) : undefined
          }
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          label="门店"
          name="storeId"
          rules={[{ required: true, message: '请选择门店' }]}
        >
          <Select
            options={storeOptions}
            placeholder="选择门店"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item
          label="表类型"
          name="tableType"
          rules={[{ required: true, message: '请选择表类型' }]}
        >
          <Select options={tableTypeOptions} placeholder="选择表类型" />
        </Form.Item>
        <Form.Item
          label="业务日期"
          name="businessDate"
          rules={[{ required: true, message: '请选择业务日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="车架号 (VIN)"
          name="vin"
          rules={[
            { required: true, message: '请填写车架号' },
            {
              validator: (_, value) => {
                const result = cleanVin(value);
                if (!result.valid) {
                  return Promise.reject(
                    new Error(result.reason || '车架号无效'),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          extra={
            vinPreview?.valid ? (
              <Typography.Text type="success">
                纠正后：{vinPreview.vin}
              </Typography.Text>
            ) : vinPreview?.reason ? (
              <Typography.Text type="danger">
                {vinPreview.reason}
              </Typography.Text>
            ) : null
          }
        >
          <Input placeholder="17 位车架号" maxLength={32} />
        </Form.Item>
        <Form.Item label="安装标记" name="installedFlag">
          <Input placeholder="如：是 / 否 / 已安装" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ParseErrorFixModal;
