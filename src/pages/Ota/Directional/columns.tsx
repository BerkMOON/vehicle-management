import { DirectionalOtaItem, OtaType } from '@/services/ota/typings.d';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

const { Text } = Typography;

export type LocalDirectionalItem = DirectionalOtaItem & {
  _localKey: string;
};

interface DirectionalColumnsProps {
  canSave: boolean;
  allItems: LocalDirectionalItem[];
  onMove: (record: LocalDirectionalItem, direction: 'up' | 'down') => void;
  onEdit: (record: LocalDirectionalItem) => void;
  onCopy: (record: LocalDirectionalItem) => void;
  onDelete: (record: LocalDirectionalItem) => void;
}

export const getColumns = ({
  canSave,
  allItems,
  onMove,
  onEdit,
  onCopy,
  onDelete,
}: DirectionalColumnsProps) => [
  {
    title: '优先级',
    key: 'priority',
    render: (_: unknown, record: LocalDirectionalItem) =>
      allItems.findIndex((i) => i._localKey === record._localKey) + 1,
  },
  {
    title: '型号',
    dataIndex: 'model',
    key: 'model',
  },
  {
    title: '模块',
    dataIndex: 'module_type',
    key: 'module_type',
    render: (type: OtaType) =>
      type === OtaType.Firmware ? '固件' : '碰撞算法',
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    render: (text: string) => text || <Text type="secondary">保存后生成</Text>,
  },
  {
    title: '文件名',
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
  },
  {
    title: '文件地址',
    dataIndex: 'path',
    key: 'path',
    ellipsis: true,
  },
  {
    title: '设备数',
    key: 'device_count',
    render: (_: unknown, record: LocalDirectionalItem) =>
      record.device_ids?.length || 0,
  },
  {
    title: '设备 ID',
    dataIndex: 'device_ids',
    key: 'device_ids',
    render: (ids: string[]) => (
      <div style={{ maxHeight: 80, overflow: 'auto' }}>
        {(ids || []).slice(0, 5).map((id) => (
          <div key={id}>{id}</div>
        ))}
        {(ids || []).length > 5 ? `…共 ${ids.length} 台` : null}
      </div>
    ),
  },
  {
    title: '描述',
    dataIndex: 'ext',
    key: 'ext',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right' as const,
    render: (_: unknown, record: LocalDirectionalItem) => {
      const index = allItems.findIndex((i) => i._localKey === record._localKey);
      if (!canSave) {
        return (
          <Text type="secondary">
            {(record.device_ids || []).length} 台设备
          </Text>
        );
      }
      return (
        <Space size={0} wrap>
          <Button
            type="link"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index <= 0}
            onClick={() => onMove(record, 'up')}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index >= allItems.length - 1}
            onClick={() => onMove(record, 'down')}
          >
            下移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(record)}
          >
            复制
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          >
            删除
          </Button>
        </Space>
      );
    },
  },
];
