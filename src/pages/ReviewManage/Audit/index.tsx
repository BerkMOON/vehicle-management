import audioUrl from '@/assets/audio/tips.mp3';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { AuditTaskDetail } from '@/services/audit/typings';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Card, Popconfirm, Result, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import AuditForm from '../Components/AuditForm';
import MachineAuditResultDisplay from '../Components/MachineAuditResultDisplay';
import MpegTsVideoPlayer from '../Components/MpegTsVideoPlayer';
import styles from './index.scss';

/** react-player 的 File 模式不识别 .ts；裸 TS 需 mpegts.js（MSE）播放 */
const isMpegTsSource = (videoUrl: string, videoPath?: string) => {
  const check = (s: string) => /\.ts($|\?|#)/i.test(s);
  return check(videoUrl) || (!!videoPath && check(videoPath));
};

const AuditPage: React.FC = () => {
  const { isLogin, auditVideo } = useAccess();
  const auditVideoAccess = auditVideo();
  const [auditTaskDetail, setAuditTaskDetail] = useState<AuditTaskDetail>();
  const [polling, setPolling] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isStart, setIsStart] = useState(true);
  const [pendingCount, setPendingCount] = useState<number | undefined>();

  const { run: fetchPendingCount, loading: pendingCountLoading } = useRequest(
    AuditAPI.countPendingTasks,
    {
      showError: false,
      onSuccess: (data) => {
        setPendingCount(data?.pending_task_num);
      },
    },
  );

  const { run: getAuditTaskDetail } = useRequest(AuditAPI.getAuditTaskDetail, {
    showError: false,
    onSuccess: (data) => {
      setAuditTaskDetail(data);
    },
  });
  const { run: addBlackDevice, loading: addBlackLoading } = useRequest(
    AuditAPI.addBlackDevice,
    {
      successMsg: '设备拉黑成功',
    },
  );

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

  const handleQuickBlack = async () => {
    if (!auditTaskDetail?.device_id) return;
    await addBlackDevice({ device_id: auditTaskDetail.device_id });
  };

  return (
    <PageContainer
      header={{
        title: '审核页面',
        breadcrumb: {},
        extra: [
          pendingCount !== undefined && (
            <span key="pending" style={{ marginRight: 16 }}>
              待审核数量：{pendingCount}
            </span>
          ),
          <Button
            key="pending"
            loading={pendingCountLoading}
            onClick={() => fetchPendingCount(undefined)}
          >
            查询待审核队列
          </Button>,
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
            {isMpegTsSource(
              auditTaskDetail.video_url,
              auditTaskDetail.video_path,
            ) ? (
              <MpegTsVideoPlayer
                url={auditTaskDetail.video_url}
                className={styles.player}
              />
            ) : (
              <ReactPlayer
                className={styles.player}
                url={auditTaskDetail.video_url}
                controls
              />
            )}
            <div style={{ marginTop: 12 }}>
              触发时间点：{parseVideoTime(auditTaskDetail?.video_path)}
            </div>
            <MachineAuditResultDisplay
              compact
              result={auditTaskDetail?.machine_audit_result}
            />
            <div>设备SN：{auditTaskDetail?.sn || '-'}</div>
            <div style={{ marginTop: 12 }}>
              <Popconfirm
                title="确认拉黑该设备吗？"
                description="拉黑后该设备将进入黑名单。"
                okText="确认"
                cancelText="取消"
                onConfirm={handleQuickBlack}
                disabled={!auditTaskDetail?.device_id}
              >
                <Button
                  danger
                  loading={addBlackLoading}
                  disabled={!auditTaskDetail?.device_id}
                >
                  快速拉黑
                </Button>
              </Popconfirm>
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
