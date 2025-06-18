import { AUDIT_RESULT } from '@/constants';
import { AuditAPI } from '@/services/audit/AuditController';
import { AuditTagItem } from '@/services/audit/typings';
import { isMobile } from '@/utils/useragent';
import { Select, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface TagSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  groupType?: AUDIT_RESULT; // 审核标签组类型
}

export const TagSelect: React.FC<TagSelectProps> = ({
  value,
  onChange,
  placeholder = '请选择标签',
  disabled = false,
  style,
  groupType,
}) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: number }[]>(
    [],
  );

  const fetchTags = async (groupType: AUDIT_RESULT) => {
    setLoading(true);
    try {
      const { data } = await AuditAPI.getAuditTag(groupType);
      const tagOptions = data.tag_list.map((tag: AuditTagItem) => ({
        label: tag.tag_name,
        value: tag.tag_id,
      }));
      setOptions(tagOptions);
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupType && !disabled) {
      fetchTags(groupType);
    }
  }, [groupType, disabled]);

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch={!isMobile}
      optionFilterProp="label"
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : null}
      maxTagCount="responsive"
    />
  );
};
