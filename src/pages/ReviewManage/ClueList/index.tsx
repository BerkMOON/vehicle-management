import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { AuditAPI } from '@/services/audit/AuditController';
import type {
  AuditClueItem,
  AuditClueListParams,
} from '@/services/audit/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Col, Form, Input, Result } from 'antd';
import React, { useRef } from 'react';

const ClueList: React.FC = () => {
  const { isLogin, clueList } = useAccess();
  const clueListAccess = clueList();
  const baseListRef = useRef<BaseListPageRef>(null);

  const columns = [
    {
      title: '线索ID',
      dataIndex: 'clue_id',
      key: 'clue_id',
      render: (text: string, record: AuditClueItem) => (
        <a
          href={`/review/clue/${record.clue_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      ),
    },
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: '设备号',
      dataIndex: 'sn',
      key: 'sn',
    },
    {
      title: '线索上报时间',
      dataIndex: 'report_time',
      key: 'report_time',
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
    </>
  );

  const fetchClueData = async (params: AuditClueListParams) => {
    const { data } = await AuditAPI.getClueList(params);
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!clueListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <BaseListPage
      ref={baseListRef}
      title="线索列表"
      columns={columns}
      searchFormItems={searchFormItems}
      fetchData={fetchClueData}
    />
  );
};

export default ClueList;
