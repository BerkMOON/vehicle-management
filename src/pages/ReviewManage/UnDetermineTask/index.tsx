import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import HandlerSelect from '@/components/BusinessComponents/HandlerSelect';
import { AUDIT_RESULT_CODE } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import type {
  AuditTaskItem,
  AuditTaskListParams,
} from '@/services/audit/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Col, Form, Input, Result, Select } from 'antd';
import React, { useRef } from 'react';

const TaskList: React.FC = () => {
  const { isLogin, taskList } = useAccess();
  const taskListAccess = taskList();
  const baseListRef = useRef<BaseListPageRef>(null);

  const columns = [
    {
      title: '线索ID',
      dataIndex: 'clue_id',
      key: 'clue_id',
      render: (text: string, record: AuditTaskItem) => (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`/review/undetermineTask/${record.clue_id}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: '设备号',
      dataIndex: 'sn',
      key: 'sn',
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
    },
    {
      title: '状态',
      dataIndex: ['status', 'name'],
      key: 'status',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
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
        <Form.Item name="clue_id" label="线索ID">
          <Input placeholder="请输入线索ID" allowClear />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="device_id" label="设备ID">
          <Input placeholder="请输入设备ID" allowClear />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item name="handler_id" label="处理人">
          <HandlerSelect />
        </Form.Item>
      </Col>
      <Col>
        <Form.Item hidden name="status" label="状态">
          <Select
            options={[
              {
                label: '待确定',
                value: AUDIT_RESULT_CODE.UNDETERMINE,
              },
            ]}
          />
        </Form.Item>
      </Col>
    </>
  );

  const fetchTaskData = async (params: AuditTaskListParams) => {
    const { data } = await AuditAPI.getTaskList(params);
    return {
      list: data.task_list,
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
      title="待确定任务列表"
      columns={columns}
      searchFormItems={searchFormItems}
      fetchData={fetchTaskData}
      defaultSearchParams={{
        status: AUDIT_RESULT_CODE.UNDETERMINE,
      }}
    />
  );
};

export default TaskList;
