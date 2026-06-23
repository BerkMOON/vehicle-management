import { MachineAuditResult } from '@/services/audit/typings';
import { Descriptions, Tag } from 'antd';
import React from 'react';

interface MachineAuditResultDisplayProps {
  result?: MachineAuditResult;
  /** 紧凑模式：用于审核页视频下方单行展示 */
  compact?: boolean;
}

function formatScore(score?: number): string {
  if (score === undefined || score === null) return '-';
  return `${score / 100}分`;
}

function PassTag({ passed }: { passed?: boolean }) {
  if (passed === undefined) return <>-</>;
  return passed ? (
    <Tag color="success">通过</Tag>
  ) : (
    <Tag color="error">未通过</Tag>
  );
}

const SUB_SCORE_ITEMS: {
  key: keyof Pick<MachineAuditResult, 'imu' | 'video' | 'audio'>;
  label: string;
}[] = [
  { key: 'imu', label: 'IMU' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
];

const MachineAuditResultDisplay: React.FC<MachineAuditResultDisplayProps> = ({
  result,
  compact = false,
}) => {
  if (!result) {
    return null;
  }

  if (compact) {
    return (
      <div>
        <div>
          审核任务评分：{formatScore(result.overall_score)}（0 ~ 100分）
        </div>
        <div style={{ marginTop: 4, color: '#666' }}>
          {SUB_SCORE_ITEMS.map((item) => (
            <span key={item.key} style={{ marginRight: 16 }}>
              {item.label}：{formatScore(result[item.key]?.score)}{' '}
              <PassTag passed={result[item.key]?.passed} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Descriptions column={2}>
      <Descriptions.Item label="综合评分">
        {formatScore(result.overall_score)}（0 ~ 100分）
      </Descriptions.Item>
      {SUB_SCORE_ITEMS.map((item) => (
        <Descriptions.Item key={item.key} label={`${item.label}评分`}>
          {formatScore(result[item.key]?.score)}{' '}
          <PassTag passed={result[item.key]?.passed} />
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
};

export default MachineAuditResultDisplay;
