import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { downloadVideoAsMp4, isMpegTsSource } from '@/utils/downloadVideo';
import { parseVideoTime } from '@/utils/format';
import { DownloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess, useParams, useSearchParams } from '@umijs/max';
import { Button, Card, Descriptions, Result, Spin, message } from 'antd';
import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import MachineAuditResultDisplay from '../../Components/MachineAuditResultDisplay';
import MpegTsVideoPlayer from '../../Components/MpegTsVideoPlayer';

const TaskDetail: React.FC = () => {
  const { clueId } = useParams<{ clueId: string }>();
  const [searchParams] = useSearchParams();
  const needAuditResult = searchParams.has('needAuditResult')
    ? searchParams.get('needAuditResult') === 'true'
    : true; // 默认true
  const isHighTask = searchParams.has('isHighTask');
  const { isLogin, taskDetail } = useAccess();
  const taskDetailAccess = taskDetail();
  const [downloading, setDownloading] = useState(false);

  const { loading, data: detail } = useRequest(AuditAPI.getAuditTaskDetail, {
    immediate: true,
    immediateParams: {
      clue_id: clueId || '',
      needRecordDetail: true,
      needAuditResult,
      needMachineAuditResult: needAuditResult,
    },
  });

  const handleDownloadVideo = async () => {
    if (!detail?.video_url) {
      message.warning('暂无可下载视频');
      return;
    }
    setDownloading(true);
    const hide = message.loading(
      isMpegTsSource(detail.video_url, detail.video_path)
        ? '正在转换 TS 为 MP4，请稍候…'
        : '正在下载视频…',
      0,
    );
    try {
      await downloadVideoAsMp4({
        videoUrl: detail.video_url,
        videoPath: detail.video_path,
        clueId: detail.clue_id,
      });
      message.success('下载成功');
    } catch (error: any) {
      message.error(error?.message || '下载失败');
    } finally {
      hide();
      setDownloading(false);
    }
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!taskDetailAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <PageContainer
      header={{
        title: '详情',
      }}
    >
      <Spin spinning={loading}>
        <Card>
          {detail?.video_url && (
            <Card
              title="视频内容"
              style={{ marginBottom: 24 }}
              extra={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={downloading}
                  onClick={handleDownloadVideo}
                >
                  下载视频
                </Button>
              }
            >
              {isMpegTsSource(detail.video_url, detail.video_path) ? (
                <MpegTsVideoPlayer url={detail.video_url} />
              ) : (
                <ReactPlayer
                  url={detail.video_url}
                  controls
                  playbackRate={isHighTask ? 1.25 : 2}
                />
              )}
              <Descriptions style={{ marginTop: 8 }} column={2}>
                <Descriptions.Item label="触发时间点">
                  {parseVideoTime(detail?.video_path)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card title="任务信息">
            <Descriptions column={2}>
              <Descriptions.Item label="任务ID">{detail?.id}</Descriptions.Item>
              <Descriptions.Item label="线索ID">
                {detail?.clue_id}
              </Descriptions.Item>
              <Descriptions.Item label="数据文件">
                <a
                  href={detail?.data_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  碰撞数据文件(点击下载)
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="设备号">{detail?.sn}</Descriptions.Item>
              <Descriptions.Item label="设备ID">
                {detail?.device_id}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {detail?.handler_name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {detail?.status?.name}
              </Descriptions.Item>
              <Descriptions.Item label="等级">
                {detail?.level}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {detail?.create_time}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {detail?.modify_time}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {needAuditResult && (
            <Card title="审核结果" style={{ marginTop: 24 }}>
              <Descriptions column={2}>
                <Descriptions.Item label="审核结果">
                  {detail?.status.name}
                </Descriptions.Item>
                <Descriptions.Item label="审核标签">
                  {detail?.tag_list?.map((tag) => tag).join(', ')}
                </Descriptions.Item>
                <Descriptions.Item label="审核备注">
                  {detail?.note}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {needAuditResult && detail?.machine_audit_result && (
            <Card title="机审评分" style={{ marginTop: 24 }}>
              <MachineAuditResultDisplay result={detail.machine_audit_result} />
            </Card>
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default TaskDetail;
