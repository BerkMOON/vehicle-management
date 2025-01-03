import InfiniteSelect from '@/components/BasicComponents/InfiniteSelect';
import { CompanyAPI } from '@/services/company/CompanyController';
import React from 'react';

interface CompanySelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const CompanySelect: React.FC<CompanySelectProps> = ({
  value,
  onChange,
  placeholder = '请选择公司',
  disabled = false,
  style,
}) => {
  const fetchCompany = async ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => {
    const { data } = await CompanyAPI.getAllCompanies({
      page,
      limit: pageSize,
    });

    return {
      list: data.company_list,
      total: data.meta.total_count,
    };
  };

  const formatOption = (company: any) => ({
    label: `${company.name}`,
    value: company.id,
  });

  return (
    <InfiniteSelect
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      fetchData={fetchCompany}
      formatOption={formatOption}
      allowClear
      showSearch
      optionFilterProp="label"
    />
  );
};

export default CompanySelect;
