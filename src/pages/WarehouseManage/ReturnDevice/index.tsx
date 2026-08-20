import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import { SuccessCode } from '@/constants';
import { useModalControl } from '@/hooks/useModalControl';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type {
  ReturnItem,
  StorageParams,
} from '@/services/warehouse/storage/typings';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Navigate, useAccess } from '@umijs/max';
import { Modal, Result, TableProps, message } from 'antd';
import React, { useRef } from 'react';
import { getColumns } from './columns';
import { createAndModifyForm } from './opreatorForm';
import { searchForm } from './searchForm';

const ReturnDevice: React.FC = () => {
  const { isLogin, returnList } = useAccess();
  const returnListAccess = returnList();
  const baseListRef = useRef<BaseListPageRef>(null);
  const createOrModifyModal = useModalControl();

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
  ) => {
    modalControl.open();
  };

  const refresh = () => baseListRef.current?.getData();

  const handleToVendor = (record: ReturnItem) => {
    if (!record.id) return;
    Modal.confirm({
      title: '确认退厂？',
      icon: <ExclamationCircleFilled />,
      content: `确认将 SN「${
        record.snapshot?.sn || record.sn
      }」退还给厂家？退厂后仓管列表将不再显示该设备。`,
      onOk: async () => {
        try {
          const res = await StorageAPI.returnToVendor({ id: record.id! });
          if (res.response_status.code !== SuccessCode.SUCCESS) {
            message.error(res.response_status.msg || '退厂失败');
            return;
          }
          message.success('退厂成功');
          refresh();
        } catch {
          message.error('退厂失败');
        }
      },
    });
  };

  const handleReInbound = (record: ReturnItem) => {
    if (!record.id) return;
    Modal.confirm({
      title: '确认重新入库？',
      icon: <ExclamationCircleFilled />,
      content: `确认将 SN「${
        record.snapshot?.sn || record.sn
      }」重新入库？成功后设备将回到在库状态。`,
      onOk: async () => {
        try {
          const res = await StorageAPI.returnReInbound({ id: record.id! });
          if (res.response_status.code !== SuccessCode.SUCCESS) {
            message.error(res.response_status.msg || '重新入库失败');
            return;
          }
          message.success('重新入库成功');
          refresh();
        } catch {
          message.error('重新入库失败');
        }
      },
    });
  };

  const columns = getColumns({
    onToVendor: handleToVendor,
    onReInbound: handleReInbound,
  });

  const fetchStorageData = async (params: StorageParams) => {
    const { data } = await StorageAPI.getReturnList(params);
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!returnListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const searchParamsTransform = (params: any) => {
    const { returnTimeRange, ...rest } = params;
    return {
      ...rest,
      start_time: returnTimeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      end_time: returnTimeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
  };

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="退货登记"
        columns={columns as TableProps<any>['columns']}
        searchFormItems={searchForm}
        fetchData={fetchStorageData}
        searchParamsTransform={searchParamsTransform}
        createButton={{
          text: '新建退货信息',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '退货信息',
          successMsg: '新建退货信息成功',
        }}
        api={StorageAPI.createReturnRecord}
      >
        {createAndModifyForm()}
      </CreateOrModifyForm>
    </>
  );
};

export default ReturnDevice;
