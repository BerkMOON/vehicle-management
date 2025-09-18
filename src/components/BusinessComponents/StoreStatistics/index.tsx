import { SuccessCode } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import { BusinessTaskParams } from '@/services/audit/typings.d';
import { DeviceAPI } from '@/services/device/DeviceController';
import {
  CarOutlined,
  ClusterOutlined,
  DeleteColumnOutlined,
  ReloadOutlined,
  SisternodeOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Spin, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';

interface AllStoreData {
  taskCount: number;
  deviceTotal: number;
  deviceActivated: number;
  deviceUnactivated: number;
  deviceBound: number;
  deviceUnbound: number;
  unUsedCount: number;
}

interface StoreStatisticsProps {
  storeId: number | string;
  storeName: string;
  loading?: boolean;
  dateRange?: {
    startTime?: string;
    endTime?: string;
  } | null;
  onClick?: (storeId: number | string, storeName: string) => void;
  onTaskCountChange?: (count: number) => void;
  onAllDataChange?: (data: AllStoreData) => void;
}

interface DeviceStats {
  activated: number;
  unactivated: number;
  bound: number;
  unbound: number;
  total: number;
  unUsed: number;
}

interface LoadingStates {
  taskCount: boolean;
  deviceTotal: boolean;
  deviceActivated: boolean;
  deviceBound: boolean;
  deviceUnused: boolean;
}

const pageParams = {
  page: 1,
  limit: 1,
};

const StoreStatistics: React.FC<StoreStatisticsProps> = ({
  storeId,
  storeName,
  dateRange,
  onClick,
  onTaskCountChange,
  onAllDataChange,
}) => {
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    activated: 0,
    unactivated: 0,
    bound: 0,
    unbound: 0,
    total: 0,
    unUsed: 0,
  });
  const [taskCount, setTaskCount] = useState(0);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    taskCount: false,
    deviceTotal: false,
    deviceActivated: false,
    deviceBound: false,
    deviceUnused: false,
  });

  // 获取设备总数和激活状态
  const fetchDeviceTotal = async () => {
    setLoadingStates((prev) => ({
      ...prev,
      deviceTotal: true,
      deviceActivated: true,
    }));
    try {
      const [unactivedRes, activedRes, allRes] = await Promise.all([
        DeviceAPI.getDeviceList({
          report_status: 'unreported',
          store_id: storeId,
          ...pageParams,
        }),
        DeviceAPI.getDeviceList({
          report_status: 'reported',
          store_id: storeId,
          onset_start_time: dateRange?.startTime,
          onset_end_time: dateRange?.endTime,
          ...pageParams,
        }),
        DeviceAPI.getDeviceList({
          store_id: storeId,
          ...pageParams,
        }),
      ]);

      const total = allRes.data.meta.total_count;
      const activated = activedRes.data.meta.total_count;
      const unactivated = unactivedRes.data.meta.total_count;

      setDeviceStats((prev) => {
        const newStats = {
          ...prev,
          total,
          activated,
          unactivated,
        };

        // 传递所有数据
        if (onAllDataChange) {
          onAllDataChange({
            taskCount,
            deviceTotal: newStats.total,
            deviceActivated: newStats.activated,
            deviceUnactivated: newStats.unactivated,
            deviceBound: newStats.bound,
            deviceUnbound: newStats.unbound,
            unUsedCount: newStats.unUsed,
          });
        }

        return newStats;
      });
    } catch (error) {
      console.error(`获取门店 ${storeName} 设备总数和激活数据失败:`, error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        deviceTotal: false,
        deviceActivated: false,
      }));
    }
  };

  // 获取设备绑定状态
  const fetchDeviceBound = async () => {
    setLoadingStates((prev) => ({
      ...prev,
      deviceBound: true,
      deviceUnused: true,
    }));
    try {
      const [boundRes, initRes, unUsedRes] = await Promise.all([
        DeviceAPI.getDeviceList({
          status: 'bound',
          report_status: 'reported',
          store_id: storeId,
          ...pageParams,
          onset_start_time: dateRange?.startTime,
          onset_end_time: dateRange?.endTime,
        }),
        DeviceAPI.getDeviceList({
          status: 'init',
          report_status: 'reported',
          store_id: storeId,
          ...pageParams,
          onset_start_time: dateRange?.startTime,
          onset_end_time: dateRange?.endTime,
        }),
        DeviceAPI.getUnusedDeviceList({
          page: 1,
          limit: 1,
          store_id: String(storeId),
        }),
      ]);

      const bound = boundRes.data.meta.total_count;
      const unbound = initRes.data.meta.total_count;
      const unUsed = unUsedRes.data.meta.total_count;

      setDeviceStats((prev) => {
        const newStats = {
          ...prev,
          bound,
          unbound,
          unUsed,
        };

        // 传递所有数据
        if (onAllDataChange) {
          onAllDataChange({
            taskCount,
            deviceTotal: newStats.total,
            deviceActivated: newStats.activated,
            deviceUnactivated: newStats.unactivated,
            deviceBound: newStats.bound,
            deviceUnbound: newStats.unbound,
            unUsedCount: newStats.unUsed,
          });
        }

        return newStats;
      });
    } catch (error) {
      console.error(`获取门店 ${storeName} 设备绑定数据失败:`, error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        deviceBound: false,
        deviceUnused: false,
      }));
    }
  };

  const fetchTaskCount = async () => {
    setLoadingStates((prev) => ({ ...prev, taskCount: true }));
    try {
      const params: BusinessTaskParams = {
        ...pageParams,
        status: 'all',
        store_id: Number(storeId),
      };

      // 添加时间筛选参数
      if (dateRange?.startTime) {
        params.start_time = dateRange.startTime;
      }
      if (dateRange?.endTime) {
        params.end_time = dateRange.endTime;
      }

      const auditResponse = await AuditAPI.getBTaskList(params);
      const count =
        auditResponse.response_status.code === SuccessCode.SUCCESS
          ? auditResponse.data.meta.total_count
          : 0;

      setTaskCount(count);
      if (onTaskCountChange) {
        onTaskCountChange(count);
      }

      // 同时传递所有数据
      if (onAllDataChange) {
        onAllDataChange({
          taskCount: count,
          deviceTotal: deviceStats.total,
          deviceActivated: deviceStats.activated,
          deviceUnactivated: deviceStats.unactivated,
          deviceBound: deviceStats.bound,
          deviceUnbound: deviceStats.unbound,
          unUsedCount: deviceStats.unUsed,
        });
      }
    } catch (error) {
      console.error(`获取门店 ${storeName} 工单数据失败:`, error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, taskCount: false }));
    }
  };

  const refreshData = () => {
    if (storeId) {
      // 重置所有数据
      setTaskCount(0);
      setDeviceStats({
        activated: 0,
        unactivated: 0,
        bound: 0,
        unbound: 0,
        total: 0,
        unUsed: 0,
      });

      // 并发启动所有请求
      fetchTaskCount();
      fetchDeviceTotal();
      fetchDeviceBound();
    }
  };

  useEffect(() => {
    refreshData();
  }, [storeId, dateRange]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return (
    <Card
      title={storeName}
      size="small"
      hoverable
      onClick={() => onClick?.(storeId, storeName)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            refreshData();
          }}
          loading={isAnyLoading}
          title="刷新数据"
        />
      }
    >
      <Row gutter={16}>
        <Col span={12}>
          <Spin spinning={loadingStates.taskCount} size="small">
            <Statistic
              title="工单总数"
              value={loadingStates.taskCount ? '-' : taskCount}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
          </Spin>
        </Col>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceTotal} size="small">
            <Statistic
              title="设备总数"
              value={loadingStates.deviceTotal ? '-' : deviceStats.total}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
          </Spin>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceActivated} size="small">
            <Statistic
              title="已安装"
              value={
                loadingStates.deviceActivated ? '-' : deviceStats.activated
              }
              prefix={<ClusterOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '14px' }}
            />
          </Spin>
        </Col>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceActivated} size="small">
            <Statistic
              title="未安装"
              value={
                loadingStates.deviceActivated ? '-' : deviceStats.unactivated
              }
              prefix={<DeleteColumnOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: '14px' }}
            />
          </Spin>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceBound} size="small">
            <Statistic
              title="安装绑定"
              value={loadingStates.deviceBound ? '-' : deviceStats.bound}
              prefix={<SisternodeOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '14px' }}
            />
          </Spin>
        </Col>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceBound} size="small">
            <Statistic
              title="安装未绑定"
              value={loadingStates.deviceBound ? '-' : deviceStats.unbound}
              prefix={<DeleteColumnOutlined />}
              valueStyle={{ color: '#faad14', fontSize: '14px' }}
            />
          </Spin>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Spin spinning={loadingStates.deviceUnused} size="small">
            <Statistic
              title="失效设备"
              value={loadingStates.deviceUnused ? '-' : deviceStats.unUsed}
              prefix={<DeleteColumnOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: '14px' }}
            />
          </Spin>
        </Col>
      </Row>
    </Card>
  );
};

export default StoreStatistics;
