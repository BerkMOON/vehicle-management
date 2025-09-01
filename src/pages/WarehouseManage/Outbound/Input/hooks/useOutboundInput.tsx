import { SuccessCode } from '@/constants';
import { OutboundAPI } from '@/services/warehouse/outbound/OutboundController';
import type { OutboundRecordItem } from '@/services/warehouse/outbound/typings';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Descriptions, message, Modal } from 'antd';
import { useState } from 'react';

export const useOutboundInput = () => {
  const [record, setRecord] = useState<OutboundRecordItem | null>(null);
  const [stageRecord, setStageRecord] = useState<string[]>([]);
  const [tableData, setTableData] = useState<{ sn: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scanValue, setScanValue] = useState('');

  const columns = [
    {
      title: 'SN码',
      dataIndex: 'sn',
      key: 'sn',
    },
  ];

  const showConfirm = (recordList: string[], id: string) => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: '保留录入数据?',
        icon: <ExclamationCircleFilled />,
        content: '检测到此批次曾经录入过数据，是否保留录入数据?',
        onOk() {
          setTableData(recordList.map((item) => ({ sn: item })));
          resolve(true);
        },
        onCancel() {
          OutboundAPI.clearStagingRecord({ batch_id: Number(id) });
          resolve(false);
        },
      });
    });
  };

  const recordDevice = async (stageRecord: { sn: string }) => {
    try {
      const res = await OutboundAPI.createStagingRecord({
        batch_id: Number(record?.id),
        sn: stageRecord.sn,
      });
      if (res.response_status.code !== SuccessCode.SUCCESS) {
        message.error(res.response_status.msg);
        return false;
      }
      setTableData((prevData) => [...prevData, stageRecord]);
      message.success('货物录入成功');
      return true;
    } catch (error) {
      message.error('货物录入失败');
      return false;
    }
  };

  const handleSubmitInfo = async () => {
    if (!record?.id) {
      message.error('出库记录ID不存在');
      return;
    }

    setSubmitting(true);
    try {
      await OutboundAPI.commitStagingRecord({
        batch_id: Number(record?.id),
      });
      message.success('商品出库成功');
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
      title: '是否确认出库？',
      icon: <ExclamationCircleFilled />,
      content: (
        <>
          <Descriptions column={1}>
            <Descriptions.Item label="出库商品数量：">
              {tableData.length}
            </Descriptions.Item>
          </Descriptions>
          {'请确认出库信息是否正确'}
        </>
      ),
      footer: () => (
        <>
          <Button type="default" onClick={() => Modal.destroyAll()}>
            取消
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmitInfo}
          >
            确认出库
          </Button>
        </>
      ),
    });
  };

  const handleScan = async (value: string) => {
    if (!value.trim()) return;

    const formatValue = value.trim().toUpperCase();

    await recordDevice({ sn: formatValue });

    setScanValue('');
  };

  const fetchRecord = async (id: string) => {
    try {
      const { data } = await OutboundAPI.getOutboundDetail({
        batch_id: Number(id),
      });
      setRecord(data);

      const {
        data: { record_list },
      } = await OutboundAPI.getStagingRecord({
        batch_id: Number(id),
      });

      if (record_list.length > 0) {
        const confirmed = await showConfirm(record_list, id);
        if (confirmed) {
          setTableData((prevData) =>
            prevData.map((item) => ({
              ...item,
              isChecked: record_list.includes(item.sn),
            })),
          );
        }
        setStageRecord(record_list);
      }
    } catch (error) {
      message.error('获取入库记录失败');
    }
  };

  return {
    record,
    stageRecord,
    tableData,
    columns,
    submitting,
    scanValue,
    setScanValue,
    handleScan,
    handleSubmit,
    fetchRecord,
  };
};
