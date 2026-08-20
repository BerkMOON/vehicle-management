import audioUrl from '@/assets/audio/tips.mp3';
import { SuccessCode } from '@/constants';
import { InboundAPI } from '@/services/warehouse/inbound/InboundController';
import type {
  InboundRecordItem,
  TableItem,
} from '@/services/warehouse/inbound/typings.d';
import { OssAPI } from '@/services/warehouse/oss/OSSController';
import { OssSence } from '@/services/warehouse/oss/typings.d';
import { isHuiyingModel } from '@/services/warehouse/storage/typings.d';
import { fetchAllPaginatedData } from '@/utils/request';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Descriptions, message, Modal } from 'antd';
import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { parseExcelData } from '../utils/excelParser';

/** 判断暂存区记录是否命中某行（汇影空 SN 时服务端生成 HY+device_id） */
const isStagedMatch = (item: TableItem, stagedList: string[]) => {
  if (item.sn && stagedList.includes(item.sn)) return true;
  if (item.imei && stagedList.includes(`HY${item.imei}`)) return true;
  return false;
};

export const useInboundInput = () => {
  const [record, setRecord] = useState<InboundRecordItem | null>(null);
  const [stageRecord, setStageRecord] = useState<string[]>([]);
  const [tableData, setTableData] = useState<TableItem[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [duplicateSNs, setDuplicateSNs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    audioRef.current.load();
  }, []);

  const batchModel = record?.model || '';

  const showConfirm = (recordList: string[], id: string) => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: '保留录入数据?',
        icon: <ExclamationCircleFilled />,
        content: '检测到此批次曾经录入过数据，是否保留录入数据?',
        onOk() {
          setTableData((prevData) =>
            prevData.map((item) => ({
              ...item,
              isChecked: isStagedMatch(item, recordList),
            })),
          );
          resolve(true);
        },
        onCancel() {
          InboundAPI.clearStagingRecord({ batch_id: Number(id) });
          resolve(false);
        },
      });
    });
  };

  const recordDevice = async (stageRecord: TableItem) => {
    if (!batchModel) {
      message.error('批次缺少设备型号，无法录入');
      return false;
    }
    try {
      const sn = stageRecord.sn?.trim() || '';
      // 汇影允许空 SN；海振必须有 SN
      if (!isHuiyingModel(batchModel) && !sn) {
        message.error('请扫描设备 SN 码');
        return false;
      }
      const res = await InboundAPI.createStagingRecord({
        batch_id: Number(record?.id),
        sn: sn || undefined,
        icc_id: stageRecord.iccid,
        device_id: stageRecord.imei,
        device_model: stageRecord.device_model,
        scan_date: stageRecord.scan_date,
        model: batchModel,
      });
      if (res.response_status.code !== SuccessCode.SUCCESS) {
        message.error(res.response_status.msg);
        return false;
      }
      message.success('商品录入成功');
      return true;
    } catch (error) {
      message.error('商品录入失败');
      return false;
    }
  };

  const handleCheck = async (row: TableItem) => {
    const success = await recordDevice(row);
    if (success) {
      setTableData((prevData) =>
        prevData.map((item) =>
          item.key === row.key
            ? { ...item, isChecked: true, model: batchModel }
            : item,
        ),
      );
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const exportData = tableData.map((item) => ({
      SN码: item.sn,
      IMEI号: item.imei,
      ICCID号: item.iccid,
      扫码日期: item.scan_date,
      设备型号: item.device_model,
      产品型号: item.model ?? batchModel,
      所属客户: item.customer,
      是否已录入: item.isChecked ? '是' : '否',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    try {
      const {
        data: { policy, signature, ossAccessKeyId, host, dir },
      } = await OssAPI.getOSSConfig(OssSence.Result);

      const formData = new FormData();
      formData.append('policy', policy);
      formData.append('signature', signature);
      formData.append('OSSAccessKeyId', ossAccessKeyId);
      formData.append('success_action_status', '200');

      const fileName = `${record?.name}_${new Date().getTime()}.xlsx`;
      const key = `${dir}${fileName}`;
      formData.append('key', key);
      formData.append('file', blob, fileName);

      await fetch(host, {
        method: 'POST',
        body: formData,
      });

      message.success('文件已导出并上传成功');
      XLSX.writeFile(wb, `${record?.name}.xlsx`);

      setExportUrl(key);
      setExporting(false);
    } catch (error) {
      message.error('文件上传失败');
      XLSX.writeFile(wb, `${record?.name}.xlsx`);
      setExporting(false);
    }
  };

  const handleSubmitInfo = async () => {
    if (!record?.id) {
      message.error('入库记录ID不存在');
      return;
    }

    if (!exportUrl) {
      message.error('请先导出数据到OSS');
      return;
    }

    setSubmitting(true);
    try {
      await InboundAPI.commitStagingRecord({
        batch_id: Number(record?.id),
        result_excel_path: exportUrl,
      });
      message.success('商品录入成功');
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
      Modal.destroyAll();
      history.back();
    }
  };

  const handleSubmit = async () => {
    Modal.confirm({
      width: 500,
      title: '是否确认入库？',
      icon: <ExclamationCircleFilled />,
      content: (
        <>
          <Descriptions column={3}>
            <Descriptions.Item label="全部商品：">
              {tableData.length}
            </Descriptions.Item>
            <Descriptions.Item label="已确认商品：">
              {tableData.filter((item) => item.isChecked).length}
            </Descriptions.Item>
            <Descriptions.Item label="未确认商品：">
              {tableData.filter((item) => !item.isChecked).length}
            </Descriptions.Item>
          </Descriptions>
          {tableData.filter((item) => !item.isChecked).length > 0
            ? '检测到此批次还有未提交商品，应入库数量不对，是否确认入库？'
            : '入库商品数量无误，是否确认入库？'}
        </>
      ),
      footer: () => (
        <>
          <Button
            type={
              tableData.filter((item) => !item.isChecked).length > 0
                ? 'primary'
                : 'default'
            }
            onClick={() => Modal.destroyAll()}
          >
            取消
          </Button>
          <Button
            type={
              tableData.filter((item) => !item.isChecked).length > 0
                ? 'default'
                : 'primary'
            }
            loading={submitting}
            onClick={handleSubmitInfo}
          >
            确认入库
          </Button>
        </>
      ),
    });
  };

  const findUncheckedRow = (formatValue: string) => {
    const bySn = tableData.findIndex(
      (item) => item.sn === formatValue && !item.isChecked,
    );
    if (bySn !== -1) return bySn;

    // 汇影：可用 IMEI 匹配（Excel SN 可为空）
    if (isHuiyingModel(batchModel)) {
      return tableData.findIndex(
        (item) =>
          !item.isChecked &&
          item.imei &&
          item.imei.toUpperCase() === formatValue,
      );
    }
    return -1;
  };

  const handleScan = async (value: string) => {
    if (!value.trim()) return;

    const formatValue = value.trim().toUpperCase();
    const foundIndex = findUncheckedRow(formatValue);

    if (foundIndex !== -1) {
      await handleCheck(tableData[foundIndex]);
    } else {
      audioRef.current?.play();
      Modal.warning({
        title: '未找到匹配的未确认商品',
        content: isHuiyingModel(batchModel)
          ? '请确认输入的 SN / IMEI 是否正确，或者 excel 中是否存在该商品'
          : '请确认输入的SN码是否正确，或者excel中是否存在该商品',
      });
    }

    setScanValue('');
  };

  const fetchRecord = async (id: string) => {
    try {
      setTableLoading(true);
      const { data } = await InboundAPI.getInboundDetail({
        batch_id: Number(id),
      });
      setRecord(data);
      if (data?.excel_file_url) {
        const result = await parseExcelData(data.excel_file_url);
        if (result) {
          const { tableData, columns, duplicateSNs } = result;
          setTableData(tableData);
          setColumns(columns);
          setDuplicateSNs(duplicateSNs);
        }
      }

      const allRecords: string[] = await fetchAllPaginatedData(
        InboundAPI.getStagingRecord,
        { batch_id: Number(id) },
        {
          pageSize: 100,
          responseKey: 'record_list',
        },
      );

      if (allRecords.length > 0) {
        const confirmed = await showConfirm(allRecords, id);
        if (confirmed) {
          setTableData((prevData) =>
            prevData.map((item) => ({
              ...item,
              isChecked: isStagedMatch(item, allRecords),
            })),
          );
        }
        setStageRecord(allRecords);
      }
      setTableLoading(false);
    } catch (error) {
      message.error('获取入库记录失败');
      setTableLoading(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await InboundAPI.clearStagingRecord({ batch_id: Number(record?.id) });
      setTableData((prevData) =>
        prevData.map((item) => ({
          ...item,
          isChecked: false,
        })),
      );
      setClearing(false);
    } catch (error) {
      message.error('清除失败');
      setClearing(false);
    }
  };

  return {
    record,
    stageRecord,
    tableData,
    columns,
    duplicateSNs,
    submitting,
    exporting,
    clearing,
    scanValue,
    exportUrl,
    tableLoading,
    setScanValue,
    handleCheck,
    handleScan,
    handleExport,
    handleSubmit,
    fetchRecord,
    handleClear,
  };
};
