import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import DeleteForm from '@/components/BasicComponents/DeleteForm';
import { useModalControl } from '@/hooks/useModalControl';
import { InboundAPI } from '@/services/warehouse/inbound/InboundController';
import type {
  InboundRecordItem,
  InboundRecordParams,
} from '@/services/warehouse/inbound/typings';
import { filterValues } from '@/utils/format';
import { Form } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useRef, useState } from 'react';
import { getColumns } from './columns';
import { InboundForm } from './operatorForm';
import { searchForm } from './searchForm';

const InboundList: React.FC = () => {
  const [form] = Form.useForm();
  const baseListRef = useRef<BaseListPageRef>(null);
  const createOrModifyModal = useModalControl();
  const deleteModal = useModalControl();
  const [selectedInboundRecord, setSelectedInboundRecord] =
    useState<InboundRecordItem | null>(null);

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    inboundRecord?: InboundRecordItem,
  ) => {
    if (inboundRecord) {
      setSelectedInboundRecord(inboundRecord);
    } else {
      setSelectedInboundRecord(null);
    }
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen: handleModalOpen,
    createOrModifyModal,
    deleteModal,
  });

  const fetchInboundData = async (params: InboundRecordParams) => {
    const { data } = await InboundAPI.getInboundRecords(params);
    return {
      list: data.batch_list,
      total: data.meta.total_count,
    };
  };

  const handleFormValues = (record: Record<string, any>) => {
    const values = filterValues(record, ['fileList']);
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
        title="入库记录"
        columns={columns as ColumnsType}
        searchFormItems={searchForm}
        fetchData={fetchInboundData}
        searchParamsTransform={searchParamsTransform}
        createButton={{
          text: '新建入库记录',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedInboundRecord(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '入库记录',
          successMsg: `${selectedInboundRecord ? '修改' : '创建'}入库记录成功`,
        }}
        api={
          selectedInboundRecord
            ? InboundAPI.updateInboundRecord
            : InboundAPI.createInboundRecord
        }
        ownForm={form}
        operatorFields={handleFormValues}
        record={selectedInboundRecord}
        idMapKey="batch_id"
      >
        <InboundForm form={form} isEdit={!!selectedInboundRecord}></InboundForm>
      </CreateOrModifyForm>
      <DeleteForm
        modalVisible={deleteModal.visible}
        onCancel={deleteModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{
          batch_id: selectedInboundRecord?.id,
        }}
        name="用户"
        api={InboundAPI.deleteRecord}
      />
    </>
  );
};

export default InboundList;
