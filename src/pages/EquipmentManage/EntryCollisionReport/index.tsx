import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import { SuccessCode } from '@/constants';
import { EntryCheckAPI } from '@/services/entryCheck/EntryCheckController';
import type {
  EntryCollisionReportDetail,
  EntryCollisionReportListItem,
} from '@/services/entryCheck/typings';
import { Navigate, useAccess } from '@umijs/max';
import { Alert, Descriptions, Drawer, Image, Spin, Tag, message } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getColumns } from './columns';
import { searchForm } from './searchForm';

const EntryCollisionReportList: React.FC = () => {
  const { isLogin, equipmentManage } = useAccess();
  const baseListRef = useRef<BaseListPageRef>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<EntryCollisionReportDetail | null>(null);
  const [storeContext, setStoreContext] = useState<{
    company_id?: number | string;
    store_id?: number | string;
  }>({});

  const openDetail = useCallback(
    async (record: EntryCollisionReportListItem) => {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await EntryCheckAPI.getCollisionReportDetail({
          id: record.id,
          ...(storeContext.company_id !== null && storeContext.company_id !== ''
            ? { company_id: storeContext.company_id }
            : {}),
          ...(storeContext.store_id !== null && storeContext.store_id !== ''
            ? { store_id: storeContext.store_id }
            : {}),
        });
        if (res?.response_status?.code === SuccessCode.SUCCESS && res.data) {
          setDetail(res.data);
        } else {
          message.error(res?.response_status?.msg || '获取详情失败');
          setDetailOpen(false);
        }
      } catch {
        message.error('获取详情失败');
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [storeContext],
  );

  const columns = useMemo(
    () => getColumns({ onViewDetail: openDetail }),
    [openDetail],
  );

  const fetchData = async (params: Record<string, unknown>) => {
    const companyId = params.company_id;
    const storeId = params.store_id;

    setStoreContext({
      ...(companyId !== null && companyId !== ''
        ? { company_id: companyId as number | string }
        : {}),
      ...(storeId !== null && storeId !== ''
        ? { store_id: storeId as number | string }
        : {}),
    });

    const { page, limit, vin, sn } = params;
    const res = await EntryCheckAPI.listCollisionReports({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      ...(companyId !== null && companyId !== ''
        ? { company_id: companyId as number | string }
        : {}),
      ...(storeId !== null && storeId !== ''
        ? { store_id: storeId as number | string }
        : {}),
      vin: (vin as string) || undefined,
      sn: (sn as string) || undefined,
    });

    if (res?.response_status?.code !== SuccessCode.SUCCESS) {
      message.error(res?.response_status?.msg || '查询失败');
      return { list: [], total: 0 };
    }

    return {
      list: res.data?.item_list ?? [],
      total: res.data?.meta?.total_count ?? 0,
    };
  };

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  if (!equipmentManage) {
    return (
      <Alert
        type="warning"
        message="无设备管理权限，无法访问碰撞线索查询"
        showIcon
      />
    );
  }

  return (
    <>
      <BaseListPage
        ref={baseListRef}
        title="碰撞线索查询"
        columns={columns}
        searchFormItems={searchForm}
        fetchData={fetchData}
      />

      <Drawer
        title="碰撞线索详情"
        width={520}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : detail ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="VIN">
                {detail.vin || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="SN">
                {detail.sn || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="设备 ID">
                {detail.device_id || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="事故时间">
                {detail.accident_time || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="工程师">
                {detail.engineer_name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="失效设备">
                {detail.is_invalid_device ? (
                  <Tag color="error">是</Tag>
                ) : (
                  <Tag color="success">否</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间">
                {detail.ctime || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {detail.mtime || '—'}
              </Descriptions.Item>
            </Descriptions>
            {detail.accident_photo_url ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  事故照片
                  <Image
                    src={detail.accident_photo_url}
                    style={{ maxWidth: '100%' }}
                    preview={{ src: detail.accident_photo_url }}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
};

export default EntryCollisionReportList;
