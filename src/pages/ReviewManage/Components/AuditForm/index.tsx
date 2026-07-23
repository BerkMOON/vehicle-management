import { TagSelect } from '@/components/BusinessComponents/TagSelect/TagSelect';
import {
  AUDIT_LEVEL,
  AUDIT_RESULT,
  OCCUR_TIME_TYPE,
  OCCUR_TIME_TYPE_OPTIONS,
} from '@/constants';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import {
  AuditTaskDetail,
  AuditTaskParams,
  OccurTimeType,
} from '@/services/audit/typings';
import { Button, DatePicker, Form, Input, Radio, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

interface AuditFormComponentProps {
  onFinished: () => Promise<void>;
  detail: AuditTaskDetail;
  disabledDeter?: boolean;
}

interface AuditFormValues
  extends Omit<AuditTaskParams, 'task_id' | 'clue_id' | 'occur_time'> {
  occur_time?: Dayjs;
}

const AuditForm: React.FC<AuditFormComponentProps> = ({
  onFinished,
  detail,
  disabledDeter = false,
}) => {
  const [form] = Form.useForm<AuditFormValues>();
  const groupType = Form.useWatch('audit_result', form);
  const occurTimeType = Form.useWatch('occur_time_type', form);
  const isApproved = groupType === AUDIT_RESULT.APPROVED;

  const { loading: auditTaskLoading, run: auditTaskRun } = useRequest<
    AuditTaskParams,
    null
  >(AuditAPI.auditTask, {
    successMsg: '审核完成',
    onSuccess: () => {
      form.resetFields();
      onFinished?.();
    },
  });

  const onFinish = async (values: AuditFormValues) => {
    const payload: AuditTaskParams = {
      task_id: detail?.id || 0,
      audit_result: values.audit_result,
      clue_id: detail?.clue_id || '',
      level: values?.level || '',
      note: values?.note || '',
      tag_id_list: values?.tag_id_list || [],
    };

    if (values.audit_result === AUDIT_RESULT.APPROVED) {
      payload.occur_time_type = values.occur_time_type as OccurTimeType;
      if (values.occur_time_type === OCCUR_TIME_TYPE.WITHIN) {
        payload.occur_time = values.occur_time?.format('YYYY-MM-DD HH:mm:ss');
      }
    }

    return await auditTaskRun(payload);
  };

  return (
    <Form
      form={form}
      name="audit"
      style={{ width: 380, marginTop: 30 }}
      onFinish={onFinish}
      onValuesChange={(changed) => {
        if (
          'audit_result' in changed &&
          changed.audit_result !== AUDIT_RESULT.APPROVED
        ) {
          form.setFieldsValue({
            occur_time_type: undefined,
            occur_time: undefined,
          });
        }
        if (
          'occur_time_type' in changed &&
          changed.occur_time_type !== OCCUR_TIME_TYPE.WITHIN
        ) {
          form.setFieldsValue({ occur_time: undefined });
        }
      }}
    >
      <Form.Item
        label="审核通过"
        name="audit_result"
        rules={[{ required: true, message: '请选择审核结果' }]}
      >
        <Radio.Group>
          <Radio value={AUDIT_RESULT.APPROVED}>通过</Radio>
          <Radio value={AUDIT_RESULT.REJECTED}>拒绝</Radio>
          {!disabledDeter && (
            <Radio value={AUDIT_RESULT.UNDETERMINE}>待确定</Radio>
          )}
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="审核评级"
        name="level"
        rules={[
          {
            required: isApproved,
            message: '请选择审核评级',
          },
        ]}
      >
        <Radio.Group disabled={groupType === AUDIT_RESULT.UNDETERMINE}>
          <Radio value={AUDIT_LEVEL.A}>AAAA</Radio>
          <Radio value={AUDIT_LEVEL.B}>AAA</Radio>
          <Radio value={AUDIT_LEVEL.C}>AA</Radio>
          <Radio value={AUDIT_LEVEL.D}>A</Radio>
        </Radio.Group>
      </Form.Item>

      {isApproved && (
        <>
          <Form.Item
            label="线索发生时间"
            name="occur_time_type"
            rules={[{ required: true, message: '请选择线索发生时间位置' }]}
          >
            <Radio.Group options={OCCUR_TIME_TYPE_OPTIONS} />
          </Form.Item>
          {(detail?.begin_time || detail?.end_time) && (
            <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
              视频时间段：{detail?.begin_time || '-'} ~{' '}
              {detail?.end_time || '-'}
            </Typography.Paragraph>
          )}
          {occurTimeType === OCCUR_TIME_TYPE.WITHIN && (
            <Form.Item
              label="具体发生时间"
              name="occur_time"
              rules={[
                { required: true, message: '请选择具体发生时间' },
                {
                  validator: (_, value?: Dayjs) => {
                    if (!value) return Promise.resolve();
                    if (!value.isValid()) {
                      return Promise.reject(
                        new Error('发生时间格式需为 YYYY-MM-DD HH:mm:ss'),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择发生时间"
                disabledDate={(current) => {
                  if (!current) return false;
                  const begin = detail?.begin_time
                    ? dayjs(detail.begin_time)
                    : null;
                  const end = detail?.end_time ? dayjs(detail.end_time) : null;
                  if (begin?.isValid() && current.isBefore(begin, 'day')) {
                    return true;
                  }
                  if (end?.isValid() && current.isAfter(end, 'day')) {
                    return true;
                  }
                  return false;
                }}
              />
            </Form.Item>
          )}
        </>
      )}

      <Form.Item label="审核备注" name="note">
        <Input.TextArea
          placeholder="请输入审核详情"
          disabled={groupType === AUDIT_RESULT.UNDETERMINE}
        ></Input.TextArea>
      </Form.Item>

      <Form.Item
        label="审核标签"
        name="tag_id_list"
        rules={[
          {
            required: groupType !== AUDIT_RESULT.UNDETERMINE,
            message: '请选择审核标签',
          },
        ]}
      >
        <TagSelect
          groupType={groupType}
          disabled={groupType === AUDIT_RESULT.UNDETERMINE}
        />
      </Form.Item>

      <Form.Item>
        <Button
          loading={auditTaskLoading}
          block
          type="primary"
          htmlType="submit"
        >
          确认
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AuditForm;
