import type { EntryInspectionLogListItem } from '@/services/entryCheck/typings';
import type { ColumnsType } from 'antd/es/table';

export const columns: ColumnsType<EntryInspectionLogListItem> = [
  { title: 'ID', dataIndex: 'id' },
  { title: '公司', dataIndex: 'company_name' },
  { title: '门店', dataIndex: 'store_name' },
  { title: '工程师', dataIndex: 'business_user_name' },
  { title: '车架号', dataIndex: 'vin' },
  { title: '首次上传', dataIndex: 'ctime' },
  { title: '最后更新', dataIndex: 'mtime' },
];
