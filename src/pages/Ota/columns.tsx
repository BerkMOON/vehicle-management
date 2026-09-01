import { ModalControl } from '@/hooks/useModalControl';
import type { OtaItem } from '@/services/ota/typings.d';
import { ColumnsProps } from '@/types/common';
import { Divider } from 'antd';

export const getColumns = (props: ColumnsProps<OtaItem>) => {
  const { handleModalOpen, deleteModal, createOrModifyModal, customModal } =
    props;
  return [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '设备型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '状态',
      dataIndex: ['status', 'name'],
      key: 'status',
    },
    {
      title: '灰度比例',
      dataIndex: 'release_range',
      key: 'release_range',
      render: (release_range: number) => `${release_range}%`,
    },
    {
      title: '升级类型',
      dataIndex: ['upgrade_type', 'name'],
      key: 'upgrade_type',
    },
    {
      title: '上传者',
      dataIndex: 'handler_name',
      key: 'handler_name',
    },
    {
      title: 'md5',
      dataIndex: 'md5',
      key: 'md5',
    },
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: '文件地址',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '修改时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
    },
    {
      title: '描述',
      dataIndex: 'ext',
      key: 'ext',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      render: (_: any, record: OtaItem) => (
        <>
          <a
            onClick={() => handleModalOpen(customModal as ModalControl, record)}
          >
            灰度发布
          </a>
          <Divider type="vertical" />
          <a onClick={() => handleModalOpen(createOrModifyModal, record)}>
            更新Ota信息
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => handleModalOpen(deleteModal as ModalControl, record)}
          >
            删除
          </a>
        </>
      ),
    },
  ];
};
