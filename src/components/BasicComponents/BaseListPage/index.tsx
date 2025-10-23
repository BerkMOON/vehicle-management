import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import type { TableProps } from 'antd';
import { Button, Form, Row, Space, Table } from 'antd';
import dayjs from 'dayjs';
// import { random } from 'lodash';
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

      // 处理日期字段的恢复
      const processedParams = { ...urlParams };
      Object.keys(processedParams).forEach((key) => {
        const value = processedParams[key];
        // 检查是否是时间范围字段（通常包含 time 或 Range 关键词）
        if (
          (key.toLowerCase().includes('time') ||
            key.toLowerCase().includes('range')) &&
          typeof value === 'string'
        ) {
          try {
            // 尝试解析为日期数组
            const dates = value.split(',');
            if (dates.length === 2) {
              const parsedDates = dates.map((dateStr) => {
                const trimmed = decodeURIComponent(dateStr.trim());

                // 优先尝试我们的标准格式 YYYY-MM-DD HH:mm:ss
                let parsed = dayjs(trimmed, 'YYYY-MM-DD HH:mm:ss');

                // 如果标准格式失败，尝试默认解析
                if (!parsed.isValid()) {
                  parsed = dayjs(trimmed);
                }

                // 如果还是失败，尝试通过 JavaScript Date 构造函数（兼容 GMT 格式）
                if (!parsed.isValid()) {
                  try {
                    const jsDate = new Date(trimmed);
                    if (!isNaN(jsDate.getTime())) {
                      parsed = dayjs(jsDate);
                    }
                  } catch (e) {
                    console.warn(`Failed to parse date: ${trimmed}`);
                  }
                }

                return parsed.isValid() ? parsed : null;
              });

              // 只有当两个日期都有效时才设置
              if (parsedDates.every((date) => date !== null)) {
                processedParams[key] = parsedDates;
              }
            }
          } catch (error) {
            // 如果解析失败，保持原值
            console.warn(`Failed to parse date range for ${key}:`, error);
          }
        }
      });

      form.setFieldsValue(processedParams);

      // 使用处理后的参数进行数据请求
      let requestParams = { ...processedParams };
      if (searchParamsTransform) {
        requestParams = searchParamsTransform(processedParams);
      }

      fetchTableData({
        page: 1,
        limit: pageInfo.limit,
        ...requestParams,
        ...defaultSearchParams,
      });
    }, []);

    const handleSearch = useCallback(
      (values: any) => {
        // 更新 URL 参数
        const newParams = new URLSearchParams();
        Object.entries(values).forEach(([key, value]) => {
          if (value) {
            // 特殊处理日期范围
            if (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] &&
              value[1]
            ) {
              // 检查是否是 dayjs 对象
              if (typeof value[0] === 'object' && value[0].format) {
                // 使用 YYYY-MM-DD HH:mm:ss 格式，更简洁且易于解析
                newParams.set(
                  key,
                  `${value[0].format('YYYY-MM-DD HH:mm:ss')},${value[1].format(
                    'YYYY-MM-DD HH:mm:ss',
                  )}`,
                );
              } else {
                newParams.set(key, value.join(','));
              }
            } else {
              newParams.set(key, value as string);
            }
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

        // 更新 URL 参数，包括表单数据
        const newParams = new URLSearchParams();
        Object.entries(formValues).forEach(([key, value]) => {
          if (value) {
            // 特殊处理日期范围
            if (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] &&
              value[1]
            ) {
              // 检查是否是 dayjs 对象
              if (typeof value[0] === 'object' && value[0].format) {
                // 使用 YYYY-MM-DD HH:mm:ss 格式，更简洁且易于解析
                newParams.set(
                  key,
                  `${value[0].format('YYYY-MM-DD HH:mm:ss')},${value[1].format(
                    'YYYY-MM-DD HH:mm:ss',
                  )}`,
                );
              } else {
                newParams.set(key, value.join(','));
              }
            } else {
              newParams.set(key, value as string);
            }
          }
        });
        newParams.set('page', page.toString());
        newParams.set('limit', pageSize.toString());
        setSearchParams(newParams);

        if (searchParamsTransform) {
          formValues = searchParamsTransform(formValues);
        }
        fetchTableData({
          page,
          limit: pageSize,
          ...formValues,
        });
      },
      [fetchTableData, form, setSearchParams, searchParamsTransform],
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
