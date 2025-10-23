import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { AuditAPI } from '@/services/audit/AuditController';
import type { HighTaskItem, HighTaskParams } from '@/services/audit/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Col, DatePicker, Form, Input, InputNumber, Result } from 'antd';
import React, { useRef } from 'react';

const { RangePicker } = DatePicker;
const TaskList: React.FC = () => {
  const { isLogin, taskList } = useAccess();
  const taskListAccess = taskList();
  const baseListRef = useRef<BaseListPageRef>(null);

  const columns = [
    {
      title: '线索ID',
      dataIndex: 'clue_id',
      key: 'clue_id',
      render: (text: string, record: HighTaskItem) => (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`/review/task/${record.clue_id}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: '设备ID号',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: '总分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      render: (text: number) => (text / 100).toFixed(2),
    },
    {
      title: '子分数',
      dataIndex: 'sub_scores',
      key: 'sub_scores',
      render: (sub_scores: any) => {
        return (
          <ul>
            {JSON.parse(sub_scores || '')?.map((item: any, index: number) => (
              <li key={index}>
                {item.name}: {(item.score / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tag: any) => {
        return (
          <ul>
            {JSON.parse(tag || '')?.map((item: any, index: number) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '更新时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
    },
  ];

  const searchFormItems = (
    <>
      <Col>
        <Form.Item name="device_id" label="设备ID">
          <Input placeholder="请输入设备ID" allowClear />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="min_score" label="最低分">
          <InputNumber
            placeholder="请输入最低分"
            min={0}
            max={100}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="max_score" label="最高分">
          <InputNumber
            placeholder="请输入最高分"
            min={0}
            max={100}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="timeRange" label="工单时间">
          <RangePicker style={{ width: '400px' }} showTime />
        </Form.Item>
      </Col>
    </>
  );

  const searchParamsTransform = (params: any) => {
    const { timeRange, min_score, max_score, ...rest } = params;
    return {
      ...rest,
      start_time: timeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      end_time: timeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      min_score: min_score ? (Number(min_score) * 100).toFixed(0) : undefined,
      max_score: max_score ? (Number(max_score) * 100).toFixed(0) : undefined,
    };
  };

  const fetchTaskData = async (params: HighTaskParams) => {
    const { data } = await AuditAPI.listMachineResult(params);
    return {
      list: data.result_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!taskListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <BaseListPage
      ref={baseListRef}
      title="高分线索列表"
      columns={columns}
      searchFormItems={searchFormItems}
      fetchData={fetchTaskData}
      searchParamsTransform={searchParamsTransform}
    />
  );
};

export default TaskList;
