import { TagSelect } from '@/components/BusinessComponents/TagSelect/TagSelect';
import { AUDIT_LEVEL, AUDIT_RESULT } from '@/constants';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { AuditTaskDetail, AuditTaskParams } from '@/services/audit/typings';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Card, Form, Input, Radio, Result, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import styles from './index.scss';

const AuditPage: React.FC = () => {
  const { isLogin, auditVideo } = useAccess();
  const auditVideoAccess = auditVideo();
  const [auditTaskDetail, setAuditTaskDetail] = useState<AuditTaskDetail>();
  const [form] = Form.useForm();
  const groupType = Form.useWatch('audit_result', form);
  const [polling, setPolling] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isStart, setIsStart] = useState(true);

  const { run: getAuditTaskDetail } = useRequest(AuditAPI.getAuditTaskDetail, {
    showError: false,
    onSuccess: (data) => {
      setAuditTaskDetail(data);
    },
  });

  useEffect(() => {
    // 创建音频元素
    audioRef.current = new Audio(
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    );
    audioRef.current.load();
  }, []);

  // 修改轮询成功的回调
  const { run } = useRequest(AuditAPI.getAuditInfo, {
    polling,
    pollingInterval: 3000,
    showError: false,
    onSuccess: (data) => {
      if (data?.clue_id) {
        setPolling(false);
        if (soundEnabled) {
          audioRef.current?.play();
        }
        getAuditTaskDetail({
          clue_id: data.clue_id,
          needRecordDetail: true,
        });
      }
    },
  });

  const { loading: auditTaskLoading, run: auditTaskRun } = useRequest<
    AuditTaskParams,
    null
  >(AuditAPI.auditTask, {
    successMsg: '审核完成',
    onSuccess: () => {
      setAuditTaskDetail(undefined);
      console.log('审核完成', '===', isStart);
      if (isStart) {
        setPolling(true);
        run(null);
      }
      form.resetFields();
    },
  });

  // 组件卸载时清除轮询
  useEffect(() => {
    setPolling(isStart);
  }, [isStart]);

  // 开始接单
  useEffect(() => {
    run(null);

    return () => {
      setPolling(false);
    };
  }, []);

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!auditVideoAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const onFinish = async (values: AuditTaskParams) => {
    return await auditTaskRun({
      task_id: auditTaskDetail?.id || 0,
      audit_result: values.audit_result,
      clue_id: auditTaskDetail?.clue_id || '',
      level: values?.level || '',
      note: values?.note || '',
      tag_id_list: values?.tag_id_list || [],
    });
  };

  return (
    <PageContainer
      header={{
        title: '审核页面',
        breadcrumb: {},
        extra: [
          <Button
            key="sound"
            type={soundEnabled ? 'primary' : 'default'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? '关闭提示音' : '开启提示音'}
          </Button>,
          <Button
            key="polling"
            type={isStart ? 'primary' : 'default'}
            onClick={() => setIsStart(!isStart)}
          >
            {isStart ? '停止接单' : '开始接单'}
          </Button>,
        ],
      }}
    >
      {auditTaskDetail ? (
        <div className={styles.container}>
          <Card title="视频内容" style={{ marginBottom: 24 }}>
            <ReactPlayer
              className={styles.player}
              url={auditTaskDetail?.video_url}
              controls
              // playbackRate={2}
            />
            <div style={{ marginTop: 12 }}>
              触发时间点：{parseVideoTime(auditTaskDetail?.video_path)}
            </div>
          </Card>
          <Form
            form={form}
            name="login"
            initialValues={{ remember: true }}
            style={{ width: 350, marginTop: 30 }}
            onFinish={onFinish}
          >
            <Form.Item
              label="审核通过"
              name="audit_result"
              rules={[{ required: true, message: '请选择审核结果' }]}
            >
              <Radio.Group>
                <Radio value={AUDIT_RESULT.APPROVED}>通过</Radio>
                <Radio value={AUDIT_RESULT.REJECTED}>拒绝</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="审核评级"
              name="level"
              rules={[
                {
                  required: groupType === AUDIT_RESULT.APPROVED,
                  message: '请选择审核评级',
                },
              ]}
            >
              <Radio.Group>
                <Radio value={AUDIT_LEVEL.A}>AAAA</Radio>
                <Radio value={AUDIT_LEVEL.B}>AAA</Radio>
                <Radio value={AUDIT_LEVEL.C}>AA</Radio>
                <Radio value={AUDIT_LEVEL.D}>A</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="审核备注" name="note">
              <Input.TextArea placeholder="请输入审核详情"></Input.TextArea>
            </Form.Item>

            <Form.Item
              label="审核标签"
              name="tag_id_list"
              rules={[{ required: true, message: '请选择审核标签' }]}
            >
              <TagSelect groupType={groupType} />
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
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          {isStart ? (
            <Spin size="large">
              <Result status="warning" title="请等待审核任务"></Result>
            </Spin>
          ) : (
            <Result title="已停止接单" />
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default AuditPage;
