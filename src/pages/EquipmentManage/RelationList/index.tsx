import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import ChangeStatusForm from '@/components/BasicComponents/ChangeStatusForm';
import { COMMON_STATUS, COMMON_STATUS_CODE } from '@/constants';
import { useModalControl } from '@/hooks/useModalControl';
import EquipmentAPI from '@/services/equipment/EquipmentCotroller';
import type {
  EquipmentRelationItem,
  EquipmentRelationParams,
} from '@/services/equipment/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Result } from 'antd';
import React, { useRef, useState } from 'react';
import { getColumns } from './colums';
import CreateOrModifyForm from './opreatorForm';
import { searchForm } from './searchForm';

const DEFAULT_SEARCH_PARAMS = {
  b_status: COMMON_STATUS.ACTIVE,
};

const RelationList: React.FC = () => {
  const { isLogin, equipmentRelationList } = useAccess();
  const equipmentRelationListAccess = equipmentRelationList();
  const baseListRef = useRef<BaseListPageRef>(null);
  const createOrModifyModal = useModalControl();
  const changeStatusModal = useModalControl();
  const [selectedEquipmentRelation, setSelectedEquipmentRelation] =
    useState<EquipmentRelationItem | null>(null);

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    EquipmentRelation?: EquipmentRelationItem,
  ) => {
    if (EquipmentRelation) {
      setSelectedEquipmentRelation(EquipmentRelation);
    } else {
      setSelectedEquipmentRelation(null);
    }
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen: handleModalOpen,
    changeStatusModal: changeStatusModal,
    createOrModifyModal: createOrModifyModal,
  });

  const fetchEquipmentRelationData = async (
    params: EquipmentRelationParams,
  ) => {
    const { data } = await EquipmentAPI.getEquipmentRelations(params);
    return {
      list: data.relation_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!equipmentRelationListAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="设备关联列表"
        columns={columns as any}
        searchFormItems={searchForm}
        fetchData={fetchEquipmentRelationData}
        defaultSearchParams={DEFAULT_SEARCH_PARAMS}
        createButton={{
          text: '新建设备关联',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <ChangeStatusForm
        modalVisible={changeStatusModal.visible}
        onCancel={changeStatusModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{
          relation_id: selectedEquipmentRelation?.id || '',
          device_id: selectedEquipmentRelation?.device_id || '',
          status:
            selectedEquipmentRelation?.b_status.code ===
            COMMON_STATUS_CODE.ACTIVE
              ? COMMON_STATUS.DELETED
              : COMMON_STATUS.ACTIVE,
        }}
        name="设备关联"
        api={EquipmentAPI.updateEquipmentRelationStatus}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedEquipmentRelation(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '设备关联',
          successMsg: `${
            selectedEquipmentRelation ? '修改' : '创建'
          }设备关联成功`,
        }}
        api={
          selectedEquipmentRelation
            ? EquipmentAPI.updateEquipmentRelation
            : EquipmentAPI.createEquipmentRelation
        }
        record={selectedEquipmentRelation}
        idMapKey="relation_id"
      ></CreateOrModifyForm>
    </>
  );
};

export default RelationList;
