import InfiniteSelect from '@/components/BasicComponents/InfiniteSelect';
import { StoreAPI } from '@/services/store/StoreController';
import { StoreItem } from '@/services/store/typing';
import { DefaultOptionType } from 'antd/es/select';
import React, { useEffect, useRef } from 'react';

interface StoreSelectProps {
  value?: string | number;
  onChange?: (value: string | number, option?: DefaultOptionType) => void;
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

    // 在第一页添加"全部门店"选项
    const list =
      page === 1
        ? [{ id: ':storeId', name: '全部门店' }, ...data.store_list]
        : data.store_list;

    return {
      list,
      total: data.meta.total_count + (page === 1 ? 1 : 0),
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

  // 当 value 是 ':storeId' 时显示"全部门店"
  const displayValue = value === ':storeId' ? '全部门店' : value;
  const displayPlaceholder = value === ':storeId' ? '全部门店' : placeholder;

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
