import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import type { TableProps } from 'antd';
import { Button, Form, Row, Space, Table } from 'antd';
import { random } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

interface BaseListPageProps<T = any, U = any> {
  title: string | React.ReactNode;
  columns: TableProps<T>['columns'];
  searchFormItems?: React.ReactNode;
  searchParamsTransform?: (params: any) => any;
  defaultSearchParams?: U;
  fetchData: (params: { page: number; limit: number } & U) => Promise<{
    list: T[];
    total: number;
  }>;
  createButton?: {
    text: string;
    onClick: () => void;
  };
  extraButtons?: React.ReactNode;
}

export interface BaseListPageRef {
  getData: () => void;
}

const formStyle: React.CSSProperties = {
  maxWidth: 'none',
  borderRadius: '8px',
  marginBottom: '16px',
};

const BaseListPage = forwardRef<BaseListPageRef, BaseListPageProps>(
  (props, ref) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [form] = Form.useForm();
    const {
      title,
      columns,
      searchFormItems,
      searchParamsTransform,
      defaultSearchParams = {} as any,
      fetchData,
      createButton,
      extraButtons,
    } = props;

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [pageInfo, setPageInfo] = useState({
      page: 1,
      limit: 10,
      total: 0,
    });

    const fetchTableData = useCallback(
      async (params: { page: number; limit: number } & any) => {
        setLoading(true);
        try {
          const result = await fetchData(params);
          setData(result.list);
          setPageInfo({
            page: params.page,
            limit: params.limit,
            total: result.total,
          });
        } catch (error) {
          console.error('获取数据失败:', error);
        } finally {
          setLoading(false);
        }
      },
      [fetchData],
    );

    // 修改 URL 参数处理的 effect
    useEffect(() => {
      const urlParams: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        urlParams[key] = value;
      });

      form.setFieldsValue(urlParams);
      fetchTableData({
        page: 1,
        limit: pageInfo.limit,
        ...urlParams,
        ...defaultSearchParams,
      });
    }, []);

    const handleSearch = useCallback(
      (values: any) => {
        // 更新 URL 参数
        const newParams = new URLSearchParams();
        Object.entries(values).forEach(([key, value]) => {
          if (value) {
            newParams.set(key, value as string);
          }
        });
        newParams.set('page', '1'); // 搜索时重置为第一页
        newParams.set('limit', pageInfo.limit.toString());
        setSearchParams(newParams);

        let searchParams = { ...values };
        if (searchParamsTransform) {
          searchParams = searchParamsTransform(values);
        }

        // 执行搜索
        fetchTableData({ page: 1, limit: pageInfo.limit, ...searchParams });
      },
      [fetchTableData, pageInfo.limit, setSearchParams],
    );

    const handlePageChange = useCallback(
      (page: number, pageSize: number) => {
        let formValues = form.getFieldsValue();
        if (searchParamsTransform) {
          formValues = searchParamsTransform(formValues);
        }
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', page.toString());
        newParams.set('limit', pageSize.toString());
        setSearchParams(newParams);

        fetchTableData({
          page,
          limit: pageSize,
          ...formValues,
        });
      },
      [fetchTableData, form, searchParams, setSearchParams],
    );

    const handleReset = useCallback(() => {
      form.resetFields();
      // 清空 URL 参数
      setSearchParams(new URLSearchParams());
      fetchTableData({
        page: 1,
        limit: pageInfo.limit,
        ...defaultSearchParams,
      });
    }, [
      form,
      defaultSearchParams,
      fetchTableData,
      pageInfo.limit,
      setSearchParams,
    ]);

    useImperativeHandle(ref, () => ({
      getData: () => {
        let formValues = form.getFieldsValue();
        if (searchParamsTransform) {
          formValues = searchParamsTransform(formValues);
        }
        fetchTableData({
          page: pageInfo.page,
          limit: pageInfo.limit,
          ...formValues,
        });
      },
    }));

    return (
      <PageContainer header={{ title }}>
        {searchFormItems && (
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
            initialValues={defaultSearchParams}
            style={formStyle}
          >
            <Row gutter={[16, 16]}>{searchFormItems}</Row>
            <div style={{ textAlign: 'right', width: '100%', marginTop: 16 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </div>
          </Form>
        )}

        <div style={{ marginBottom: 16 }}>
          <Space>
            {createButton && (
              <Button type="primary" onClick={createButton.onClick}>
                {createButton.text}
              </Button>
            )}
            <Button
              type="primary"
              onClick={() =>
                fetchTableData({
                  page: pageInfo.page,
                  limit: pageInfo.limit,
                  ...form.getFieldsValue(),
                })
              }
            >
              刷新
            </Button>
            {extraButtons}
          </Space>
        </div>

        <Table<any>
          loading={loading}
          rowKey={(record) => {
            return (
              (record.id || record.role_id || record.user_id) + random(1000)
            );
          }}
          columns={columns}
          dataSource={data}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pageInfo.page,
            pageSize: pageInfo.limit,
            total: pageInfo.total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </PageContainer>
    );
  },
);

export default BaseListPage;
