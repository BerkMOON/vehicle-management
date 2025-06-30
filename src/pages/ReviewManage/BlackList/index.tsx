import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import DeleteForm from '@/components/BasicComponents/DeleteForm';
import { useModalControl } from '@/hooks/useModalControl';
import { AuditAPI } from '@/services/audit/AuditController';
import type { BlackListInfo } from '@/services/audit/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Button, Form, Input, Result } from 'antd';
import React, { useRef, useState } from 'react';

const BlackList: React.FC = () => {
  const { isLogin, clueList } = useAccess();
  const clueListAccess = clueList();
  const baseListRef = useRef<BaseListPageRef>(null);
  const deleteModal = useModalControl();
  const addModal = useModalControl();
  const [blackItem, setBlackItem] = useState<BlackListInfo | null>(null);

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    blackItem?: BlackListInfo,
  ) => {
    if (blackItem) {
      setBlackItem(blackItem);
    } else {
      setBlackItem(null);
    }
    modalControl.open();
  };

  const columns = [
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
      render: (text: string, record: BlackListInfo) => (
        <a
          href={`/review/clue/${record.device_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'set_time',
      key: 'set_time',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BlackListInfo) => (
        <>
          <Button
            type="link"
            onClick={() => handleModalOpen(deleteModal, record)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  const fetchClueData = async () => {
    const { data } = await AuditAPI.getBlackList();
    return {
      list: data.item_list,
      total: data.item_list.length,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!clueListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="黑名单列表"
        columns={columns}
        fetchData={fetchClueData}
        createButton={{
          text: '新增黑名单',
          onClick: () => handleModalOpen(addModal),
        }}
      />
      <DeleteForm
        modalVisible={deleteModal.visible}
        onCancel={deleteModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{ device_id: blackItem?.device_id || '' }}
        name="黑名单设备"
        api={AuditAPI.deleteBlackDevice}
      />
      <CreateOrModifyForm
        modalVisible={addModal.visible}
        onCancel={() => {
          addModal.close();
          setBlackItem(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '添加设备到黑名单',
          successMsg: `添加设备到黑名单成功`,
        }}
        api={AuditAPI.addBlackDevice}
      >
        <Form.Item
          name="device_id"
          label="设备ID"
          rules={[{ required: true, message: '请输入设备ID' }]}
        >
          <Input placeholder="请输入设备ID" allowClear />
        </Form.Item>
      </CreateOrModifyForm>
    </>
  );
};

export default BlackList;
