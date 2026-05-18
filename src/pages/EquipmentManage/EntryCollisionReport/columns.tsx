import type { EntryCollisionReportListItem } from '@/services/entryCheck/typings';
import { Image, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export function getColumns(options: {
  onViewDetail: (record: EntryCollisionReportListItem) => void;
}): ColumnsType<EntryCollisionReportListItem> {
  const { onViewDetail } = options;

  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: 'VIN',
      dataIndex: 'vin',
      ellipsis: true,
    },
    {
      title: 'SN',
      dataIndex: 'sn',
      ellipsis: true,
    },
    {
      title: '设备 ID',
      dataIndex: 'device_id',
      ellipsis: true,
    },
    {
      title: '事故时间',
      dataIndex: 'accident_time',
      width: 170,
    },
    {
      title: '工程师',
      dataIndex: 'engineer_name',
      width: 100,
    },
    {
      title: '失效设备',
      dataIndex: 'is_invalid_device',
      width: 96,
      render: (v: boolean) =>
        v ? <Tag color="error">是</Tag> : <Tag color="success">否</Tag>,
    },
    {
      title: '事故照片',
      dataIndex: 'accident_photo_url',
      width: 88,
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{ src: url }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: '上报时间',
      dataIndex: 'ctime',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 88,
      fixed: 'right',
      render: (_, record) => <a onClick={() => onViewDetail(record)}>详情</a>,
    },
  ];
}
