import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess, useParams, useSearchParams } from '@umijs/max';
import { Card, Descriptions, Result, Spin } from 'antd';
import React from 'react';
import ReactPlayer from 'react-player';

const TaskDetail: React.FC = () => {
  const { clueId } = useParams<{ clueId: string }>();
  const [searchParams] = useSearchParams();
  const needAuditResult = searchParams.has('needAuditResult')
    ? searchParams.get('needAuditResult') === 'true'
    : true; // 默认true
  const { isLogin, taskDetail } = useAccess();
  const taskDetailAccess = taskDetail();

  const { loading, data: detail } = useRequest(AuditAPI.getAuditTaskDetail, {
    immediate: true,
    immediateParams: {
      clue_id: clueId || '',
      needRecordDetail: true,
      needAuditResult,
      needMachineAuditResult: needAuditResult,
    },
  });

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
            <Card title="视频内容" style={{ marginBottom: 24 }}>
              <ReactPlayer url={detail.video_url} controls playbackRate={2} />
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

          {needAuditResult && detail?.machine_audit_result?.overall_score && (
            <Card title="审核评分" style={{ marginTop: 24 }}>
              <Descriptions column={2}>
                <Descriptions.Item label="审核评分">
                  {detail?.machine_audit_result?.overall_score / 100}分(0 ~
                  100分)
                </Descriptions.Item>
                <Descriptions.Item label="审核子评分">
                  <div>
                    {detail?.machine_audit_result?.sub_scores?.map(
                      (subScore) => (
                        <div key={subScore.code}>
                          {subScore.name}: {subScore.score / 100}分(
                          {subScore.weight}分权重)
                        </div>
                      ),
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="审核标签">
                  <div>
                    {detail?.machine_audit_result?.tags?.map((tag) => (
                      <div key={tag.code}>{tag.name}</div>
                    ))}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default TaskDetail;
