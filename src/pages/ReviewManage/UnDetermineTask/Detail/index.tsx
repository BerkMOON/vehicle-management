import { AUDIT_RESULT_CODE } from '@/constants';
import { useRequest } from '@/hooks/useRequest';
import { AuditAPI } from '@/services/audit/AuditController';
import { parseVideoTime } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { Navigate, useAccess, useParams } from '@umijs/max';
import { Card, Result, Spin } from 'antd';
import React from 'react';
import ReactPlayer from 'react-player';
import AuditForm from '../../Components/AuditForm';
import MachineAuditResultDisplay from '../../Components/MachineAuditResultDisplay';

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
                {detail?.machine_audit_result && (
                  <Card
                    title="机审评分"
                    style={{ marginTop: 24, width: '100%' }}
                  >
                    <MachineAuditResultDisplay
                      result={detail.machine_audit_result}
                    />
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
