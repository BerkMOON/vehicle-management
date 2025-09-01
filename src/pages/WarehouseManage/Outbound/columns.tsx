import { ModalControl } from '@/hooks/useModalControl';
import { INBOUND_STATUS_CODE } from '@/services/warehouse/inbound/typings.d';
import { OutboundRecordItem } from '@/services/warehouse/outbound/typings.d';
import { StorageAPI } from '@/services/warehouse/storage/StorageController';
import { StorageItem } from '@/services/warehouse/storage/typings';
import { ColumnsProps } from '@/types/common';
import { fetchAllPaginatedData } from '@/utils/request';
import { history } from '@umijs/max';
import { Button, message } from 'antd';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

export const getColumns = (props: ColumnsProps<OutboundRecordItem>) => {
  const { handleModalOpen, createOrModifyModal, deleteModal } = props;

  const handleExport = async (record: OutboundRecordItem) => {
    try {
      const allRecords: StorageItem[] = await fetchAllPaginatedData(
        StorageAPI.getStorageList,
        { outbound_batch_id: Number(record.id) },
        {
          pageSize: 100,
          responseKey: 'record_list',
        },
      );

      // 转换数据格式
      const exportData = allRecords.map((item, key) => ({
        '': key + 1,
        SN码: item.sn,
        扫码日期: dayjs(record.modify_time).format('YYYY年MM月DD日'),
        设备型号: item.device_model,
        所属客户: `${record.company_name}${record.store_name}`,
        供应商: '北京达安数智科技有限公司',
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();

      // 添加标题行
      const title = `易达安通用型记录仪${record.company_name}${
        record.store_name
      }${dayjs(record.modify_time).format('YYYY年MM月DD日')}出库单`;
      const ws = XLSX.utils.aoa_to_sheet([[title], []]); // 添加标题和空行

      // 将数据添加到工作表
      XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A2' }); // 从第3行开始添加数据

      // 计算数据最后一行的位置
      const lastRow = allRecords.length + 3; // 标题行 + 空行 + 数据行数

      // 添加签收信息行（居中对齐）
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            '                            签收人：                      签收日期：',
          ],
        ],
        { origin: `A${lastRow}` },
      );

      // 设置标题行的样式（合并单元格）
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // 合并第一行的所有列
        // 合并签收信息行的单元格
        {
          s: { r: allRecords.length + 2, c: 0 },
          e: { r: allRecords.length + 2, c: 5 },
        }, // 合并整行
      ];

      // 设置所有单元格居中对齐
      const centerStyle = {
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        font: {
          name: '微软雅黑',
          sz: 11,
        },
      };

      // 设置标题样式
      const titleStyle = {
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        font: {
          name: '微软雅黑',
          sz: 11,
          bold: true,
        },
      };

      // 设置标题样式
      if (ws['A1']) {
        ws['A1'].s = titleStyle;
      }

      // 设置所有数据单元格的样式
      for (let r = 1; r <= allRecords.length + 3; r++) {
        for (let c = 0; c <= 5; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (ws[cellRef]) {
            ws[cellRef].s = centerStyle;
          }
        }
      }

      // 设置单元格样式
      if (!ws['!cols']) ws['!cols'] = [];
      ws['!cols'] = [
        { wch: 4 }, // 编号列宽
        { wch: 20 }, // SN码列宽
        { wch: 15 }, // 扫码日期列宽
        { wch: 25 }, // 设备型号列宽
        { wch: 25 }, // 所属客户列宽
        { wch: 30 }, // 供应商列宽
      ];

      // 设置行高
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 30 }; // 设置标题行高

      // 为每一行设置行高
      for (let i = 1; i <= allRecords.length + 3; i++) {
        ws['!rows'][i] = { hpt: 25 }; // 设置数据行高
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // 生成文件名
      const fileName = `易达安通用型记录仪${record.company_name}${
        record.store_name
      }${dayjs(record.modify_time).format('YYYY.M.D')}出库单.xlsx`;

      // 下载文件
      XLSX.writeFile(wb, fileName);

      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  return [
    {
      title: '批次ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '出库批次名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '出库公司',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: '出库门店',
      dataIndex: 'store_name',
      key: 'store_name',
    },

    {
      title: '出库时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
    },
    {
      title: '状态',
      dataIndex: ['status', 'name'],
      key: 'status',
    },
    {
      title: '出库人',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: '备注',
      dataIndex: 'extra',
      key: 'extra',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OutboundRecordItem) => (
        <>
          {record.status.code === INBOUND_STATUS_CODE.PENDING ? (
            <>
              <Button
                type="link"
                onClick={() =>
                  handleModalOpen(deleteModal as ModalControl, record)
                }
              >
                删除批次
              </Button>
              <Button
                type="link"
                onClick={() => handleModalOpen(createOrModifyModal, record)}
              >
                修改
              </Button>
              <Button
                type="link"
                onClick={() =>
                  history.push(`/warehouse/outbound/input/${record.id}`)
                }
              >
                商品出库
              </Button>
            </>
          ) : (
            <>
              <Button type="link" onClick={() => handleExport(record)}>
                导出
              </Button>
              <Button
                type="link"
                onClick={() =>
                  history.push(`/warehouse/outbound/detail/${record.id}`)
                }
              >
                详情
              </Button>
            </>
          )}
        </>
      ),
    },
  ];
};
