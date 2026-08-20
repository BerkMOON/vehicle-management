import InfiniteSelect from '@/components/BasicComponents/InfiniteSelect';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import { DefaultOptionType } from 'antd/es/select';
import React, { useEffect, useRef } from 'react';

const ALL_STORES_VALUE = ':storeId';

interface StoreSelectProps {
  value?: string | number;
  onChange?: (value: string | number, option?: DefaultOptionType) => void;
  placeholder?: string;
  disabled?: boolean;
  companyId?: string;
  edit?: boolean;
  style?: React.CSSProperties;
  /** 是否在列表首项展示「全部门店」，默认不展示 */
  includeAllStores?: boolean;
}

const StoreSelect: React.FC<StoreSelectProps> = ({
  value,
  onChange,
  placeholder = '请选择门店',
  companyId = '',
  disabled = false,
  style,
  includeAllStores = false,
}) => {
  const ref = useRef<any>(null);
  const [key, setKey] = React.useState(0);
  const fetchStore = async ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => {
    const { data } = await StoreAPI.getAllStores({
      page,
      limit: pageSize,
      company_id: companyId,
    });

    const allStoresOption =
      includeAllStores && page === 1
        ? [{ id: ALL_STORES_VALUE, name: '全部门店' }]
        : [];

    return {
      list: [...allStoresOption, ...data.store_list],
      total: data.meta.total_count + allStoresOption.length,
    };
  };

  const formatOption = (store: StoreItem) => ({
    label: `${store.name}`,
    value: store.id,
  });

  useEffect(() => {
    if (companyId && ref.current) {
      setKey((prev) => prev + 1);
      ref.current.resetData(); // 重新加载数据
    }
  }, [companyId]);

  const isAllStoresValue = includeAllStores && value === ALL_STORES_VALUE;
  const displayValue = isAllStoresValue ? '全部门店' : value;
  const displayPlaceholder = isAllStoresValue ? '全部门店' : placeholder;

  return (
    <InfiniteSelect
      key={key}
      ref={ref}
      placeholder={displayPlaceholder}
      value={displayValue}
      onChange={onChange}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      fetchData={fetchStore}
      formatOption={formatOption as any}
      allowClear
      showSearch
      optionFilterProp="label"
    />
  );
};

export default StoreSelect;
