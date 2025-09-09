import StoreStatistics from '@/components/BusinessComponents/StoreStatistics';
import PieChart from '@/components/ChartComponents/BaseChart/PieChart';
import { SuccessCode } from '@/constants';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import { CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
} from 'antd';
import { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';

const { RangePicker } = DatePicker;

interface StoreInfo {
  store_id: number | string;
  store_name: string;
}

interface AllStoreData {
  taskCount: number;
  deviceTotal: number;
  deviceActivated: number;
  deviceUnactivated: number;
  deviceBound: number;
  deviceUnbound: number;
}

type FilterField = keyof AllStoreData;

const AuditDashboard: React.FC = () => {
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeList, setStoreList] = useState<StoreInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskCounts, setTaskCounts] = useState<Record<string | number, number>>(
    {},
  );
  const [storeAllData, setStoreAllData] = useState<
    Record<string | number, AllStoreData>
  >({});
  const [filterField, setFilterField] = useState<FilterField>('taskCount');
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const [activeDataFilter, setActiveDataFilter] = useState<{
    field: FilterField;
    min: number | null;
    max: number | null;
  } | null>(null);
  const [activeDateRange, setActiveDateRange] = useState<{
    startTime: string;
    endTime: string;
  } | null>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      // 获取所有门店
      const storeResponse = await StoreAPI.getAllStores({
        page: 1,
        limit: 1000,
        company_id: '2',
      });

      if (storeResponse.response_status.code !== SuccessCode.SUCCESS) {
        throw new Error('获取门店列表失败');
      }

      const stores = storeResponse.data.store_list;
      const storeInfos: StoreInfo[] = stores.map((store: StoreItem) => ({
        store_id: store.id,
        store_name: store.name,
      }));

      setStoreList(storeInfos);
      // 清空任务计数和所有数据
      setTaskCounts({});
      setStoreAllData({});
    } catch (error) {
      console.error('获取门店列表失败:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchStores();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskCountChange = (storeId: string | number, count: number) => {
    setTaskCounts((prev) => ({
      ...prev,
      [storeId]: count,
    }));
  };

  const handleAllDataChange = (
    storeId: string | number,
    data: AllStoreData,
  ) => {
    setStoreAllData((prev) => ({
      ...prev,
      [storeId]: data,
    }));
  };

  const handleStoreClick = (storeId: string | number) => {
    history.push(`/dashboard/store/${storeId}`);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // 原始统计
  const totalTasks = Object.values(taskCounts).reduce(
    (acc, count) => acc + count,
    0,
  );
  const loadedStoresCount = Object.keys(taskCounts).length;

  // 筛选函数（只处理数量筛选，不处理时间）
  const filterStore = (storeId: string | number) => {
    if (!activeDataFilter) return true; // 没有激活的数量筛选条件时不过滤

    const storeData = storeAllData[storeId];
    if (!storeData) return true; // 数据未加载时不过滤

    const fieldValue = storeData[activeDataFilter.field];
    const minValid =
      activeDataFilter.min === null || fieldValue >= activeDataFilter.min;
    const maxValid =
      activeDataFilter.max === null || fieldValue <= activeDataFilter.max;
    return minValid && maxValid;
  };

  // 应用筛选
  const applyFilter = () => {
    // 处理数量筛选（前端过滤，不触发请求）
    if (minValue === null && maxValue === null) {
      setActiveDataFilter(null);
    } else {
      setActiveDataFilter({
        field: filterField,
        min: minValue,
        max: maxValue,
      });
    }

    // 处理时间筛选（需要重新请求数据）
    if (dateRange) {
      const newDateRange = {
        startTime: dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
      };
      // 只有时间范围真正改变时才更新
      if (
        !activeDateRange ||
        activeDateRange.startTime !== newDateRange.startTime ||
        activeDateRange.endTime !== newDateRange.endTime
      ) {
        setActiveDateRange(newDateRange);
      }
    } else {
      if (activeDateRange) {
        setActiveDateRange(null);
      }
    }
  };

  // 重置筛选
  const resetFilter = () => {
    setMinValue(null);
    setMaxValue(null);
    setActiveDataFilter(null);
    setDateRange(null);
    setActiveDateRange(null);
  };

  // 字段选项
  const fieldOptions = [
    { value: 'taskCount', label: '工单总数' },
    { value: 'deviceTotal', label: '设备总数' },
    { value: 'deviceActivated', label: '已安装' },
    { value: 'deviceUnactivated', label: '未安装' },
    { value: 'deviceBound', label: '安装绑定' },
    { value: 'deviceUnbound', label: '安装未绑定' },
  ];

  // 筛选后的门店列表
  const filteredStoreList = storeList.filter((store) =>
    filterStore(store.store_id),
  );

  // 获取门店指定字段的数据值
  const getStoreFieldValue = (
    storeId: string | number,
    field: FilterField,
  ): number => {
    if (field === 'taskCount') {
      return taskCounts[storeId] || 0;
    }
    const storeData = storeAllData[storeId];
    return storeData ? storeData[field] : 0;
  };

  // 为饼图准备数据，根据激活的筛选字段显示对应数据（没有激活筛选时默认显示工单数据）
  const currentDisplayField = activeDataFilter
    ? activeDataFilter.field
    : 'taskCount';
  const chartData = filteredStoreList
    .map((store) => {
      const value = getStoreFieldValue(store.store_id, currentDisplayField);
      return {
        type: store.store_name,
        value: value,
      };
    })
    .filter((item) => item.value > 0); // 只显示有数据的门店

  // 计算筛选后门店的统计数据（根据当前显示字段）
  const filteredTotal = filteredStoreList.reduce(
    (acc, store) =>
      acc + getStoreFieldValue(store.store_id, currentDisplayField),
    0,
  );
  const filteredLoadedStoresCount = filteredStoreList.filter((store) => {
    // 检查该字段数据是否已加载
    if (currentDisplayField === 'taskCount') {
      return taskCounts[store.store_id] !== undefined;
    }
    return storeAllData[store.store_id] !== undefined;
  }).length;

  // 获取筛选字段的中文名称
  const getFieldLabel = (field: FilterField) => {
    return fieldOptions.find((opt) => opt.value === field)?.label || field;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="工单任务看板"
        style={{ marginBottom: '24px' }}
        extra={
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isRefreshing || storesLoading}
            title="刷新数据"
          >
            刷新
          </Button>
        }
      >
        <Card title="数据筛选" size="small" style={{ marginBottom: '16px' }}>
          <Space wrap>
            <span>筛选字段：</span>
            <Select
              value={filterField}
              onChange={setFilterField}
              options={fieldOptions}
              style={{ width: 120 }}
            />
            <span>最小值：</span>
            <InputNumber
              placeholder="不限制"
              value={minValue}
              onChange={setMinValue}
              min={0}
              style={{ width: 100 }}
            />
            <span>最大值：</span>
            <InputNumber
              placeholder="不限制"
              value={maxValue}
              onChange={setMaxValue}
              min={0}
              style={{ width: 100 }}
            />
            <Button type="primary" onClick={applyFilter}>
              确认筛选
            </Button>
            <Button onClick={resetFilter}>重置筛选</Button>
          </Space>
          <div style={{ marginTop: '12px' }}>
            <Space>
              <span>时间范围：</span>
              <RangePicker
                value={dateRange}
                onChange={setDateRange as any}
                placeholder={['开始时间', '结束时间']}
                showTime={{ format: 'HH:mm:ss' }}
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: 400 }}
              />
            </Space>
          </div>
          {(activeDataFilter || activeDateRange) && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f6f8ff',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#1890ff' }}>
                当前筛选:
                {activeDataFilter && (
                  <>
                    {getFieldLabel(activeDataFilter.field)}
                    {activeDataFilter.min !== null &&
                      ` >= ${activeDataFilter.min}`}
                    {activeDataFilter.max !== null &&
                      ` <= ${activeDataFilter.max}`}
                  </>
                )}
                {activeDateRange && (
                  <>
                    {activeDataFilter && '，'}
                    时间范围: {activeDateRange.startTime.slice(0, 16)} ~{' '}
                    {activeDateRange.endTime.slice(0, 16)}
                  </>
                )}
                ，显示 {filteredStoreList.length}/{storeList.length} 个门店
              </span>
            </div>
          )}
        </Card>
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card
              title={`门店${getFieldLabel(currentDisplayField)}分布`}
              style={{ height: '700px' }}
            >
              {chartData.length > 0 ? (
                <div style={{ height: '650px' }}>
                  <PieChart data={chartData} />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '600px',
                    flexDirection: 'column',
                  }}
                >
                  {loadedStoresCount < storeList.length ? (
                    <>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px', color: '#999' }}>
                        正在加载门店数据...
                      </div>
                    </>
                  ) : (
                    <Empty description="暂无工单数据" />
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card>
              <Statistic
                title={
                  activeDataFilter
                    ? `筛选后${getFieldLabel(
                        currentDisplayField,
                      )} (${filteredLoadedStoresCount}/${
                        filteredStoreList.length
                      } 个门店已加载)`
                    : `总工单数 ${
                        loadedStoresCount > 0
                          ? `(${loadedStoresCount}/${storeList.length} 个门店已加载)`
                          : ''
                      }`
                }
                value={activeDataFilter ? filteredTotal : totalTasks}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                suffix={
                  loadedStoresCount < storeList.length ? (
                    <Spin size="small" style={{ marginLeft: '8px' }} />
                  ) : undefined
                }
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {storesLoading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>正在加载门店列表...</div>
          </div>
        </Card>
      ) : storeList.length === 0 ? (
        <Card>
          <Empty description="暂无门店数据" />
        </Card>
      ) : (
        <Row gutter={16}>
          {filteredStoreList.map((store) => (
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4.8}
              xxl={4.8}
              key={store.store_id}
              style={{ marginBottom: '16px' }}
            >
              <StoreStatistics
                storeId={store.store_id}
                storeName={store.store_name}
                dateRange={activeDateRange}
                onClick={handleStoreClick}
                onTaskCountChange={(count) =>
                  handleTaskCountChange(store.store_id, count)
                }
                onAllDataChange={(data) =>
                  handleAllDataChange(store.store_id, data)
                }
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default AuditDashboard;
