import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import DeleteForm from '@/components/BasicComponents/DeleteForm';
import { useModalControl } from '@/hooks/useModalControl';
import { OutboundAPI } from '@/services/warehouse/outbound/OutboundController';
import {
  OutboundRecordItem,
  OutboundRecordParams,
} from '@/services/warehouse/outbound/typings.d';
import { filterValues } from '@/utils/format';
import { Form } from 'antd';
import React, { useRef, useState } from 'react';
import { getColumns } from './columns';
import { OutboundForm } from './operatorForm';
import { searchForm } from './searchForm';

const OutboundList: React.FC = () => {
  const [form] = Form.useForm();
  const baseListRef = useRef<BaseListPageRef>(null);
  const createOrModifyModal = useModalControl();
  const deleteModal = useModalControl();
  const [selectedOutboundRecord, setSelectedOutboundRecord] =
    useState<OutboundRecordItem | null>(null);

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    outboundRecord?: OutboundRecordItem,
  ) => {
    if (outboundRecord) {
      setSelectedOutboundRecord(outboundRecord);
    } else {
      setSelectedOutboundRecord(null);
    }
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen: handleModalOpen,
    createOrModifyModal,
    deleteModal,
  });

  const fetchOutboundData = async (params: OutboundRecordParams) => {
    const { data } = await OutboundAPI.getOutboundRecords(params);
    return {
      list: data.batch_list,
      total: data.meta.total_count,
    };
  };

  const handleFormValues = (record: Record<string, any>) => {
    const values = filterValues(record, []);
    return {
      ...values,
    };
  };

  const searchParamsTransform = (params: any) => {
    const { time_range, ...rest } = params;
    return {
      ...rest,
      start_time: time_range?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      end_time: time_range?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
  };

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="出库记录"
        columns={columns}
        searchFormItems={searchForm}
        fetchData={fetchOutboundData}
        searchParamsTransform={searchParamsTransform}
        createButton={{
          text: '新建出库记录',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedOutboundRecord(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '出库记录',
          successMsg: `${selectedOutboundRecord ? '修改' : '创建'}出库记录成功`,
        }}
        api={
          selectedOutboundRecord
            ? OutboundAPI.updateOutboundRecord
            : OutboundAPI.createOutboundRecord
        }
        ownForm={form}
        operatorFields={handleFormValues}
        record={selectedOutboundRecord}
        idMapKey="batch_id"
      >
        <OutboundForm form={form} isEdit={!!selectedOutboundRecord} />
      </CreateOrModifyForm>
      <DeleteForm
        modalVisible={deleteModal.visible}
        onCancel={deleteModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{
          batch_id: selectedOutboundRecord?.id,
        }}
        name="用户"
        api={OutboundAPI.deleteRecord}
      />
    </>
  );
};

export default OutboundList;
