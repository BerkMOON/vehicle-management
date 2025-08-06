import audioUrl from '@/assets/audio/tips.mp3';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { AuditTaskDetail } from '@/services/audit/typings';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Card, Result, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import AuditForm from '../Components/AuditForm';
import styles from './index.scss';

const AuditPage: React.FC = () => {
  const { isLogin, auditVideo } = useAccess();
  const auditVideoAccess = auditVideo();
  const [auditTaskDetail, setAuditTaskDetail] = useState<AuditTaskDetail>();
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
    audioRef.current = new Audio(audioUrl);
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
          needMachineAuditResult: true,
        });
      }
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

  const onFinish = async () => {
    setAuditTaskDetail(undefined);
    if (isStart) {
      setPolling(true);
      run(null);
    }
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
            />
            <div style={{ marginTop: 12 }}>
              触发时间点：{parseVideoTime(auditTaskDetail?.video_path)}
            </div>
            <div>
              审核任务评分：
              {auditTaskDetail?.machine_audit_result?.overall_score / 100}分(0 ~
              100分)
            </div>
          </Card>
          <AuditForm detail={auditTaskDetail} onFinished={onFinish} />
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
