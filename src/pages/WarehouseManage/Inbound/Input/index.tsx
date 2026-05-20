import { INBOUND_DEVICE_MODEL_OPTIONS } from '@/services/warehouse/inbound/typings.d';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Card, Descriptions, Input, Select, Space, Table } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { BatchInfo } from './components/BatchInfo';
import { useInboundInput } from './hooks/useInboundInput';

const ProductInput: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchUnRecord, setSearchUnRecord] = React.useState<boolean>(false);
  const [searchRecord, setSearchRecord] = React.useState<boolean>(false);
  const [searchUnRecordData, setSearchUnRecordData] = React.useState<any>([]);
  const [searchRecordData, setSearchRecordData] = React.useState<any>([]);

  const {
    record,
    tableData,
    duplicateSNs,
    submitting,
    exporting,
    clearing,
    tableLoading,
    scanValue,
    deviceModel,
    exportUrl,
    columns,
    handleClear,
    setScanValue,
    setDeviceModel,
    handleScan,
    handleExport,
    handleSubmit,
    fetchRecord,
  } = useInboundInput();

  // 分离未录入和已录入的数据
  const unrecordedData = tableData
    .filter((item) => !item.isChecked)
    .map((item) => ({
      ...item,
      disabled: duplicateSNs.includes(item.sn),
    }));

  const recordedData = tableData.filter((item) => item.isChecked);

  const recordedColumns = useMemo(() => {
    const statusIndex = columns.findIndex((col) => col.key === 'isChecked');
    const modelColumn = {
      title: '设备型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (text: string) => text || '-',
    };
    if (statusIndex === -1) {
      return [...columns, modelColumn];
    }
    return [
      ...columns.slice(0, statusIndex),
      modelColumn,
      ...columns.slice(statusIndex),
    ];
  }, [columns]);

  useEffect(() => {
    // 获取入库记录详情
    if (!id) return;
    fetchRecord(id);
  }, [id]);

  return (
    <PageContainer
      header={{
        title: (
          <>
            <ArrowLeftOutlined
              onClick={() => {
                history.back();
              }}
            />{' '}
            商品录入
          </>
        ),
      }}
    >
      <BatchInfo record={record} duplicateSNs={duplicateSNs} />

      <Card title="入库商品数量" style={{ margin: '20px 0' }}>
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
          <Descriptions.Item label="已导出表单：">
            {exportUrl ? (
              <a href={exportUrl} target="_blank" rel="noopener noreferrer">
                已导出（点击下载）
              </a>
            ) : (
              <>未导出</>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="start">
          <Select
            value={deviceModel}
            onChange={setDeviceModel}
            options={INBOUND_DEVICE_MODEL_OPTIONS}
            disabled={duplicateSNs.length > 0}
            style={{ width: 200 }}
          />
          <Input.TextArea
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            disabled={duplicateSNs.length > 0}
            onPressEnter={(e) => {
              e.preventDefault();
              handleScan(scanValue);
            }}
            placeholder={
              duplicateSNs.length > 0
                ? '有重复SN码，请检查上传的Excel表格'
                : '请将扫描枪对准商品条码进行扫描，扫描后会自动确认对应商品'
            }
            autoFocus
            style={{ width: '300px' }}
          />
        </Space>

        <div>
          <Button type="primary" onClick={handleExport} loading={exporting}>
            导出已入库表单
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            onClick={handleClear}
            loading={clearing}
          >
            清除暂存区数据
          </Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Card
            title="未录入设备"
            style={{ width: '49%' }}
            extra={
              <Input.Search
                placeholder="输入SN码搜索"
                style={{ width: 200 }}
                allowClear
                onSearch={(value) => {
                  const searchValue = value.trim().toUpperCase();
                  const filteredData = tableData
                    .filter(
                      (item) =>
                        !item.isChecked &&
                        item.sn.toUpperCase().includes(searchValue),
                    )
                    .map((item) => ({
                      ...item,
                      disabled: duplicateSNs.includes(item.sn),
                    }));
                  setSearchUnRecordData(filteredData);
                  if (!searchValue) {
                    setSearchUnRecord(false);
                  } else {
                    setSearchUnRecord(true);
                  }
                }}
              />
            }
          >
            <Table
              loading={tableLoading}
              columns={columns}
              dataSource={searchUnRecord ? searchUnRecordData : unrecordedData}
              size="small"
              pagination={{
                pageSizeOptions: ['50', '100', '200', '500'],
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ y: 600 }}
              rowClassName={(record) => (record.disabled ? 'disabled-row' : '')}
            />
          </Card>

          <Card
            title="已录入设备"
            style={{ width: '49%' }}
            extra={
              <Input.Search
                placeholder="输入SN码搜索"
                style={{ width: 200 }}
                allowClear
                onSearch={(value) => {
                  const searchValue = value.trim().toUpperCase();
                  const filteredData = tableData
                    .filter(
                      (item) =>
                        item.isChecked &&
                        item.sn.toUpperCase().includes(searchValue),
                    )
                    .map((item) => ({
                      ...item,
                      disabled: duplicateSNs.includes(item.sn),
                    }));
                  setSearchRecordData(filteredData);
                  if (!searchValue) {
                    setSearchRecord(false);
                  } else {
                    setSearchRecord(true);
                  }
                }}
              />
            }
          >
            <Table
              loading={tableLoading}
              columns={recordedColumns}
              dataSource={searchRecord ? searchRecordData : recordedData}
              size="small"
              pagination={{
                pageSizeOptions: ['50', '100', '200', '500'],
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ y: 600 }}
            />
          </Card>
        </div>

        <Space
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '10px',
          }}
        >
          <Button onClick={() => history.back()}>返回</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            提交
          </Button>
        </Space>
      </Space>
    </PageContainer>
  );
};

export default ProductInput;
