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

const AbnormalClueList: React.FC = () => {
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
          href={`/review/abnormalClue/${record.clue_id}?needAuditResult=false`}
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
      title: '异常原因',
      dataIndex: 'reason',
      key: 'reason',
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
    const { data } = await AuditAPI.getAbnormalClueList(params);
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
      title="异常线索列表"
      columns={columns}
      searchFormItems={searchFormItems}
      fetchData={fetchClueData}
    />
  );
};

export default AbnormalClueList;
