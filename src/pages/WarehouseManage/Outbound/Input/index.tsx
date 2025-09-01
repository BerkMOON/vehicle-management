import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Input, Space, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { BatchInfo } from './components/BatchInfo';
import InboundSelector from './components/InboundSelector';
import { useOutboundInput } from './hooks/useOutboundInput';

const ProductInput: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectorVisible, setSelectorVisible] = useState(false);

  const {
    record,
    tableData,
    columns,
    submitting,
    scanValue,
    setScanValue,
    handleScan,
    handleSubmit,
    fetchRecord,
  } = useOutboundInput();

  useEffect(() => {
    if (id) {
      fetchRecord(id);
    }
  }, [id]);

  const handleInboundConfirm = (snList: string[]) => {
    // 将获取到的SN号批量填入扫描输入框
    const snText = snList.join('\n');
    setScanValue(snText);

    console.log(snList);

    // 批量扫描处理
    snList.forEach((sn) => {
      handleScan(sn);
    });

    setSelectorVisible(false);
    message.success(`已导入${snList.length}个SN号`);
  };

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
      <BatchInfo record={record} tableData={tableData} />
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.TextArea
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onPressEnter={(e) => {
            e.preventDefault();
            handleScan(scanValue);
          }}
          placeholder={
            '请将扫描枪对准商品条码进行扫描，扫描后会自动确认对应商品'
          }
          autoFocus
          style={{ width: '300px' }}
        />
        {/* <Button onClick={() => setSelectorVisible(true)}>筛选入库单</Button> */}
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content', y: 400 }}
        />

        <Space style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => history.back()}>返回</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            提交
          </Button>
        </Space>
      </Space>

      <InboundSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={handleInboundConfirm}
      />
    </PageContainer>
  );
};

export default ProductInput;
