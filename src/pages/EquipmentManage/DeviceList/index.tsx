import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import { useModalControl } from '@/hooks/useModalControl';
import { DeviceAPI } from '@/services/device/DeviceController';
import { DeviceList } from '@/services/device/typings';
import { Navigate, useAccess } from '@umijs/max';
import React, { useRef, useState } from 'react';
import { getColumns } from './colums';
import { UpdateDeviceForm } from './opreatorForm';
import { searchForm } from './searchForm';

const TableList: React.FC = () => {
  const { isLogin } = useAccess();
  const baseListRef = useRef<BaseListPageRef>(null);
  const updateModal = useModalControl();
  const [selectedDevice, setSelectedDevice] = useState<DeviceList | null>(null);

  const handleModalOpen = (
    modalControl: ReturnType<typeof useModalControl>,
    device: DeviceList,
  ) => {
    setSelectedDevice(device);
    modalControl.open();
  };

  const columns = getColumns({
    handleModalOpen,
    updateModal,
  });

  const fetchUserData = async (params: any) => {
    const { data } = await DeviceAPI.getDeviceList(params);
    return {
      list: data.device_list,
      total: data.meta.total_count,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  const searchParamsTransform = (params: any) => {
    const { bind_time, onset_time, ...rest } = params;
    return {
      ...rest,
      bind_start_time: bind_time?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      bind_end_time: bind_time?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      onset_start_time: onset_time?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      onset_end_time: onset_time?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
  };

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="设备列表页面"
        columns={columns as any}
        searchFormItems={searchForm}
        searchParamsTransform={searchParamsTransform}
        fetchData={fetchUserData}
      />
      <CreateOrModifyForm
        modalVisible={updateModal.visible}
        onCancel={() => {
          updateModal.close();
          setSelectedDevice(null);
        }}
        refresh={() => baseListRef.current?.getData()}
        api={DeviceAPI.updateDevice}
        text={{ title: '修改设备信息', successMsg: '修改设备信息成功' }}
        record={selectedDevice}
        idMapKey="sn"
        idMapValue="sn"
      >
        <UpdateDeviceForm />
      </CreateOrModifyForm>
    </>
  );
};

export default TableList;
