import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import DeleteForm from '@/components/BasicComponents/DeleteForm';
import { COMMON_STATUS } from '@/constants';
import { useModalControl } from '@/hooks/useModalControl';
import { OtaAPI } from '@/services/ota/OTAController';
import {
  OtaItem,
  OtaParams,
  OtaType,
  UPGRADE_TYPE,
} from '@/services/ota/typings.d';
import { filterValues } from '@/utils/format';
import { Form } from 'antd';
import { ColumnType } from 'antd/es/table';
import { useRef, useState } from 'react';
import { getColumns } from '../columns';
import { OtaForm, OtaPublishForm, OtaUpdataForm } from '../opreatorForm';
import { searchForm } from '../searchForm';

const DEFAULT_SEARCH_PARAMS = {
  status: COMMON_STATUS.ACTIVE,
  upgrade_type: UPGRADE_TYPE.FULL_GRAY,
  module_type: OtaType.Firmware,
};

const FullGrayList: React.FC = () => {
  const [form] = Form.useForm();
  const baseListRef = useRef<BaseListPageRef>(null);
  const [selectedOta, setSelectedOta] = useState<OtaItem | null>(null);
  const createOrModifyModal = useModalControl();
  const publishModifyModal = useModalControl();
  const deleteModal = useModalControl();

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    ota?: OtaItem,
  ) => {
    if (ota) {
      setSelectedOta(ota);
    } else {
      setSelectedOta(null);
    }
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen: handleModalOpen,
    deleteModal: deleteModal,
    createOrModifyModal: createOrModifyModal,
    customModal: publishModifyModal,
  });

  const fetchVersionData = async (params: OtaParams) => {
    const { data } = await OtaAPI.getOtaUpdataList({
      ...params,
      upgrade_type: UPGRADE_TYPE.FULL_GRAY,
    });
    return {
      list: data.record_list,
      total: data.meta.total_count,
    };
  };

  const handleFormValues = (record: Record<string, any>) => {
    const values = filterValues(record, ['fileList', 'custom_version']);
    return {
      ...values,
      upgrade_type: UPGRADE_TYPE.FULL_GRAY,
    };
  };

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="全量灰度"
        columns={columns as ColumnType<any>[]}
        searchFormItems={searchForm}
        fetchData={fetchVersionData}
        defaultSearchParams={DEFAULT_SEARCH_PARAMS}
        createButton={{
          text: '新建全量灰度',
          onClick: () => handleModalOpen(createOrModifyModal),
        }}
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedOta(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '全量灰度发布',
          successMsg: `${selectedOta ? '修改' : '创建'}全量灰度成功`,
        }}
        api={selectedOta ? OtaAPI.updateOtaStatus : OtaAPI.createOtaUpdate}
        record={selectedOta}
        idMapKey="record_id"
        ownForm={selectedOta ? undefined : form}
        operatorFields={handleFormValues}
      >
        {selectedOta ? <OtaUpdataForm /> : <OtaForm form={form} />}
      </CreateOrModifyForm>
      <CreateOrModifyForm
        modalVisible={publishModifyModal.visible}
        onCancel={() => {
          publishModifyModal.close();
          setSelectedOta(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        text={{
          title: '灰度发布',
          successMsg: '修改灰度成功',
        }}
        api={OtaAPI.otaRelease}
        record={selectedOta}
        idMapKey="record_id"
      >
        {OtaPublishForm}
      </CreateOrModifyForm>
      <DeleteForm
        modalVisible={deleteModal.visible}
        onCancel={deleteModal.close}
        refresh={() => baseListRef.current?.getData()}
        params={{
          record_id: selectedOta?.id || '',
          status: COMMON_STATUS.DELETED,
        }}
        name="OTA升级项"
        api={OtaAPI.deleteVersion}
      />
    </>
  );
};

export default FullGrayList;
