import { Table, type TableProps } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

interface BaseTableProps<T = any> {
  columns: TableProps<T>['columns'];
  fetchData: (params: { page: number; limit: number } & any) => Promise<{
    list: T[];
    total: number;
  }>;
  searchParams?: any;
  defaultPage?: number;
  defaultPageSize?: number;
}

export interface BaseTableRef {
  refresh: (params?: any) => void;
}

const BaseTable = forwardRef<BaseTableRef, BaseTableProps>((props, ref) => {
  const {
    columns,
    fetchData,
    searchParams = {},
    defaultPage = 1,
    defaultPageSize = 10,
  } = props;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pageInfo, setPageInfo] = useState({
    page: defaultPage,
    limit: defaultPageSize,
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

  useEffect(() => {
    fetchTableData({
      page: pageInfo.page,
      limit: pageInfo.limit,
      ...searchParams,
    });
  }, []);

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      fetchTableData({
        page,
        limit: pageSize,
        ...searchParams,
      });
    },
    [fetchTableData, searchParams],
  );

  useImperativeHandle(ref, () => ({
    refresh: (params?: any) => {
      fetchTableData({
        page: pageInfo.page,
        limit: pageInfo.limit,
        ...searchParams,
        ...params,
      });
    },
  }));

  return (
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
  );
});

export default BaseTable;
