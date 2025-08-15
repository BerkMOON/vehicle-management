import { AUDIT_RESULT_CODE } from '@/constants';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess, useParams } from '@umijs/max';
import { Card, Descriptions, Result, Spin } from 'antd';
import React from 'react';
import ReactPlayer from 'react-player';
import AuditForm from '../../Components/AuditForm';

const TaskDetail: React.FC = () => {
  const { clueId } = useParams<{ clueId: string }>();
  const { isLogin, taskDetail } = useAccess();
  const taskDetailAccess = taskDetail();

  const {
    loading,
    data: detail,
    run,
  } = useRequest(AuditAPI.getAuditTaskDetail, {
    immediate: true,
    immediateParams: {
      clue_id: clueId || '',
      needRecordDetail: true,
      needAuditResult: true,
      needMachineAuditResult: true,
    },
  });

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!taskDetailAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const onFinish = async () => {
    await run({
      clue_id: clueId || '',
      needRecordDetail: true,
      needAuditResult: true,
    });
  };

  return (
    <PageContainer
      header={{
        title: '待确认任务审核',
      }}
    >
      <Spin spinning={loading}>
        {detail?.video_url && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Card
              title="视频内容"
              style={{
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReactPlayer url={detail.video_url} controls playbackRate={2} />
                <div style={{ marginTop: 12 }}>
                  触发时间点：{parseVideoTime(detail?.video_path)}
                </div>
                {detail?.machine_audit_result?.overall_score && (
                  <Card title="审核评分" style={{ marginTop: 24 }}>
                    <Descriptions column={4}>
                      <Descriptions.Item label="审核评分">
                        {detail?.machine_audit_result?.overall_score / 100}分(0
                        ~ 100分)
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
              </div>
            </Card>
            {detail?.status.code === AUDIT_RESULT_CODE.UNDETERMINE && (
              <AuditForm
                disabledDeter={true}
                detail={detail}
                onFinished={onFinish}
              />
            )}
          </div>
        )}
      </Spin>
    </PageContainer>
  );
};

export default TaskDetail;
