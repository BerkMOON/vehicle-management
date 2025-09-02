import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import { useModalControl } from '@/hooks/useModalControl';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import type { StorageParams } from '@/services/warehouse/storage/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Result, TableProps } from 'antd';
import React, { useRef } from 'react';
import { getColumns } from './columns';
import { createAndModifyForm } from './opreatorForm';
import { searchForm } from './searchForm';

const ReturnDevice: React.FC = () => {
  const { isLogin, returnList } = useAccess();
  const returnListAccess = returnList();
  const baseListRef = useRef<BaseListPageRef>(null);
  const columns = getColumns();
  const createOrModifyModal = useModalControl();

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
  ) => {
    modalControl.open();
  };

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
