import InfiniteSelect from '@/components/BasicComponents/InfiniteSelect';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import React, { useEffect, useRef } from 'react';

interface StoreSelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  companyId?: string;
  edit?: boolean;
  style?: React.CSSProperties;
}

const StoreSelect: React.FC<StoreSelectProps> = ({
  value,
  onChange,
  placeholder = '请选择门店',
  companyId = '',
  disabled = false,
  style,
}) => {
  const ref = useRef<any>(null);
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

    return {
      list: data.store_list,
      total: data.meta.total_count,
    };
  };

  const formatOption = (store: StoreItem) => ({
    label: `${store.name}`,
    value: store.id,
  });

  useEffect(() => {
    if (companyId && ref.current) {
      ref.current.resetData(); // 重新加载数据
    }
  }, [companyId]);

  return (
    <InfiniteSelect
      ref={ref}
      placeholder={placeholder}
      value={value}
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
