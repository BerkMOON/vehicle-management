import { Navigate, useAccess } from '@umijs/max';
import { Result, Tabs } from 'antd';
import React from 'react';
import DirectionalOta from './Directional';
import FullGrayList from './FullGray';

const OtaPage: React.FC = () => {
  const {
    isLogin,
    otaVersion,
    otaDirectionalGetConfig,
    otaDirectionalSetConfig,
  } = useAccess();
  const hasOtaAccess = otaVersion();
  const canViewDirectional = otaDirectionalGetConfig();
  const canSaveDirectional = otaDirectionalSetConfig();

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!hasOtaAccess) {
    return <Result status="403" title="403" subTitle="无权限访问" />;
  }

  const items = [
    {
      key: 'full',
      label: '全量灰度',
      children: <FullGrayList />,
    },
    {
      key: 'directional',
      label: '定向升级',
      children: canViewDirectional ? (
        <DirectionalOta canSave={canSaveDirectional} />
      ) : (
        <Result
          status="403"
          title="403"
          subTitle="无定向配置查看权限，请开通 ota_directional_get_config"
        />
      ),
    },
  ];

  return (
    <Tabs
      defaultActiveKey="full"
      items={items}
      tabBarStyle={{ padding: '0 40px' }}
    />
  );
};

export default OtaPage;
