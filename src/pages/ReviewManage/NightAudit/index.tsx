import { NightAuditAPI } from '@/services/audit/nightAudit/NightAuditController';
import type { NightAuditStatus } from '@/services/audit/nightAudit/typings';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  TimePicker,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_TIMEZONE,
  RULE_LAYER_LABEL,
  WEEKDAY_OPTIONS,
  createOrderedEndRules,
  createOrderedStartRules,
  formValuesToPayload,
  rulesToFormValues,
  validateWindowRules,
  type NightAuditFormValues,
} from './utils';

const { Text, Paragraph } = Typography;
const STATUS_POLL_INTERVAL = 10000;

const NightAudit: React.FC = () => {
  const { isLogin, nightAudit, nightAuditConfig } = useAccess();
  const hasViewAccess = nightAudit();
  const hasConfigAccess = nightAuditConfig();

  const [form] = Form.useForm<NightAuditFormValues>();
  const [pageLoading, setPageLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [togglingDisabled, setTogglingDisabled] = useState(false);
  const [status, setStatus] = useState<NightAuditStatus | null>(null);
  const [rulesVersion, setRulesVersion] = useState<string>();
  const [disabled, setDisabled] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { response_status, data } = await NightAuditAPI.getStatus();
      if (response_status.code === 200) {
        setStatus(data);
        setDisabled(data.disabled);
      }
    } catch {
      // 状态轮询失败时静默，避免频繁弹窗
    }
  }, []);

  const fetchWindowRules = useCallback(async () => {
    const { response_status, data } = await NightAuditAPI.getWindowRules();
    if (response_status.code !== 200) {
      message.error(response_status.msg || '获取时间窗口规则失败');
      return;
    }
    setRulesVersion(data.version);
    form.setFieldsValue(rulesToFormValues(data));
  }, [form]);

  const loadPageData = useCallback(async () => {
    setPageLoading(true);
    try {
      await Promise.all([fetchStatus(), fetchWindowRules()]);
    } finally {
      setPageLoading(false);
    }
  }, [fetchStatus, fetchWindowRules]);

  useEffect(() => {
    if (hasViewAccess) {
      loadPageData();
    }
  }, [hasViewAccess, loadPageData]);

  useEffect(() => {
    if (!hasViewAccess) return undefined;

    let timer: number | undefined;

    const stopPolling = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const startPolling = () => {
      stopPolling();
      fetchStatus();
      timer = window.setInterval(fetchStatus, STATUS_POLL_INTERVAL);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus, hasViewAccess]);

  const handleToggleDisabled = async (checked: boolean) => {
    setTogglingDisabled(true);
    try {
      const { response_status } = await NightAuditAPI.setDisabled({
        disabled: !checked,
      });
      if (response_status.code !== 200) {
        message.error(response_status.msg || '设置启停开关失败');
        return;
      }
      message.success(checked ? '夜间审核已开启' : '夜间审核已暂停');
      setDisabled(!checked);
      await fetchStatus();
    } catch {
      message.error('设置启停开关失败');
    } finally {
      setTogglingDisabled(false);
    }
  };

  const handleSaveRules = async () => {
    try {
      const values = await form.validateFields();
      const payload = formValuesToPayload(values);
      const error = validateWindowRules(payload);
      if (error) {
        message.error(error);
        return;
      }

      setSavingRules(true);
      const { response_status, data } = await NightAuditAPI.setWindowRules(
        payload,
      );
      if (response_status.code !== 200) {
        message.error(response_status.msg || '保存时间窗口规则失败');
        return;
      }
      message.success('时间窗口规则已保存');
      setRulesVersion(data.version);
      form.setFieldsValue(rulesToFormValues(data));
      await fetchStatus();
    } catch {
      // 表单校验失败时 antd 会自行提示
    } finally {
      setSavingRules(false);
    }
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!hasViewAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <PageContainer title="夜间审核配置">
      <Spin spinning={pageLoading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="状态看板">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <Text type="secondary">总开关</Text>
                  <div style={{ marginTop: 8 }}>
                    <Badge
                      status={status?.disabled ? 'default' : 'processing'}
                      text={status?.disabled ? '已暂停' : '已开启'}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <Text type="secondary">窗口状态</Text>
                  <div style={{ marginTop: 8 }}>
                    <Badge
                      status={status?.windowActive ? 'success' : 'default'}
                      text={status?.windowActive ? '窗口生效中' : '窗口未生效'}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <Text type="secondary">当前命中规则</Text>
                  <div style={{ marginTop: 8 }}>
                    {status
                      ? `${
                          RULE_LAYER_LABEL[status.ruleLayer] || status.ruleLayer
                        } / ${status.ruleName}`
                      : '-'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <Text type="secondary">健康状态</Text>
                  <div style={{ marginTop: 8 }}>
                    <Badge
                      status={status?.healthy ? 'success' : 'error'}
                      text={status?.healthy ? '正常' : '异常'}
                    />
                  </div>
                </Card>
              </Col>
            </Row>

            <Descriptions
              style={{ marginTop: 16 }}
              column={{ xs: 1, sm: 2, md: 3 }}
              size="small"
            >
              <Descriptions.Item label="Worker 配置">
                {status?.workerEnabled ? '已启用' : '未启用'}
              </Descriptions.Item>
              <Descriptions.Item label="最近执行时间">
                {status?.lastRunAt
                  ? dayjs(status.lastRunAt).format('YYYY-MM-DD HH:mm:ss')
                  : '暂无记录'}
              </Descriptions.Item>
              <Descriptions.Item label="规则版本">
                {rulesVersion || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {hasConfigAccess && (
            <Card title="启停控制">
              <Space>
                <Switch
                  checked={!disabled}
                  loading={togglingDisabled}
                  onChange={handleToggleDisabled}
                />
                <Text>
                  {disabled
                    ? '夜间审核已暂停，窗口内也不执行'
                    : '夜间审核已开启，受时间窗口约束'}
                </Text>
              </Space>
            </Card>
          )}

          <Card
            title="时间窗口配置"
            extra={
              hasConfigAccess ? (
                <Button
                  type="primary"
                  loading={savingRules}
                  onClick={handleSaveRules}
                >
                  保存规则
                </Button>
              ) : null
            }
          >
            <Paragraph type="secondary">
              规则命中优先级：特殊日期覆盖 &gt; 排班规则（同层按优先级取高）&gt;
              默认窗口。默认窗口与排班规则要求开始时间小于结束时间；特殊日期覆盖仍支持跨午夜区间。
            </Paragraph>

            <Form
              form={form}
              layout="vertical"
              disabled={!hasConfigAccess}
              initialValues={{
                timezone: DEFAULT_TIMEZONE,
                default: { start: null, end: null },
                schedule: [],
                overrides: [],
              }}
            >
              <Form.Item name="timezone" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="时区">
                <Input value={DEFAULT_TIMEZONE} disabled />
              </Form.Item>

              <Card title="默认窗口" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={['default', 'start']}
                      label="开始时间"
                      dependencies={[['default', 'end']]}
                      rules={createOrderedStartRules(['default', 'end'])}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['default', 'end']}
                      label="结束时间"
                      dependencies={[['default', 'start']]}
                      rules={createOrderedEndRules(['default', 'start'])}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="排班规则" style={{ marginBottom: 16 }}>
                <Form.List name="schedule">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={key}
                          size="small"
                          style={{ marginBottom: 12 }}
                          extra={
                            hasConfigAccess ? (
                              <Button
                                type="link"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                              >
                                删除
                              </Button>
                            ) : null
                          }
                        >
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'name']}
                                label="规则名称"
                                rules={[
                                  { required: true, message: '请输入规则名称' },
                                ]}
                              >
                                <Input placeholder="如 weekend" />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'priority']}
                                label="优先级"
                                initialValue={0}
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'weekdays']}
                                label="星期"
                                rules={[
                                  { required: true, message: '请选择星期' },
                                ]}
                              >
                                <Checkbox.Group options={WEEKDAY_OPTIONS} />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'start']}
                                label="开始时间"
                                dependencies={[['schedule', name, 'end']]}
                                rules={createOrderedStartRules([
                                  'schedule',
                                  name,
                                  'end',
                                ])}
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'end']}
                                label="结束时间"
                                dependencies={[['schedule', name, 'start']]}
                                rules={createOrderedEndRules([
                                  'schedule',
                                  name,
                                  'start',
                                ])}
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      {hasConfigAccess && (
                        <Button
                          type="dashed"
                          onClick={() => add({ priority: 0, weekdays: [] })}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加排班规则
                        </Button>
                      )}
                    </>
                  )}
                </Form.List>
              </Card>

              <Card title="特殊日期覆盖">
                <Form.List name="overrides">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={key}
                          size="small"
                          style={{ marginBottom: 12 }}
                          extra={
                            hasConfigAccess ? (
                              <Button
                                type="link"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                              >
                                删除
                              </Button>
                            ) : null
                          }
                        >
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'name']}
                                label="规则名称"
                                rules={[
                                  { required: true, message: '请输入规则名称' },
                                ]}
                              >
                                <Input placeholder="如 holiday" />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'priority']}
                                label="优先级"
                                initialValue={0}
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'dates']}
                                label="日期列表"
                                rules={[
                                  { required: true, message: '请输入日期' },
                                ]}
                                extra="格式 YYYY-MM-DD，多个日期用回车或逗号分隔，全局不可重复"
                              >
                                <Select
                                  mode="tags"
                                  placeholder="如 2026-10-01"
                                  tokenSeparators={[',', ' ']}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item
                            {...restField}
                            name={[name, 'closed']}
                            valuePropName="checked"
                            initialValue={false}
                          >
                            <Checkbox>当日关闭夜间审核</Checkbox>
                          </Form.Item>
                          <Form.Item noStyle shouldUpdate>
                            {() => {
                              const closed = form.getFieldValue([
                                'overrides',
                                name,
                                'closed',
                              ]);
                              if (closed) return null;
                              return (
                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'start']}
                                      label="开始时间"
                                      rules={[
                                        {
                                          required: true,
                                          message: '请选择开始时间',
                                        },
                                      ]}
                                    >
                                      <TimePicker
                                        format="HH:mm"
                                        style={{ width: '100%' }}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'end']}
                                      label="结束时间"
                                      rules={[
                                        {
                                          required: true,
                                          message: '请选择结束时间',
                                        },
                                      ]}
                                    >
                                      <TimePicker
                                        format="HH:mm"
                                        style={{ width: '100%' }}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              );
                            }}
                          </Form.Item>
                        </Card>
                      ))}
                      {hasConfigAccess && (
                        <Button
                          type="dashed"
                          onClick={() =>
                            add({ priority: 0, dates: [], closed: false })
                          }
                          block
                          icon={<PlusOutlined />}
                        >
                          添加特殊日期规则
                        </Button>
                      )}
                    </>
                  )}
                </Form.List>
              </Card>
            </Form>
          </Card>
        </Space>
      </Spin>
    </PageContainer>
  );
};

export default NightAudit;
