import BaseListPage, {
  BaseListPageRef,
} from '@/components/BasicComponents/BaseListPage';
import CreateOrModifyForm from '@/components/BasicComponents/CreateOrModifyForm';
import { SuccessCode } from '@/constants';
import { useModalControl } from '@/hooks/useModalControl';
import { OtaAPI } from '@/services/ota/OTAController';
import {
  DIRECTIONAL_ERROR_CODE,
  DirectionalOtaItem,
  OtaType,
} from '@/services/ota/typings.d';
import { ResponseInfoType } from '@/types/common';
import { filterValues } from '@/utils/format';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  message,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import { ColumnType } from 'antd/es/table';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getColumns, LocalDirectionalItem } from './columns';
import {
  buildDirectionalVersion,
  DirectionalForm,
  extractVersionSuffix,
} from './operatorForm';
import { searchForm } from './searchForm';

const { Text, Paragraph } = Typography;

const createLocalKey = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseDeviceIds = (raw: string | string[]): string[] => {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(raw.map((s) => String(s).trim()).filter(Boolean)),
    );
  }
  const list = raw
    .split(/[,\n，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
};

const toFormRecord = (item: LocalDirectionalItem) => {
  const suffix = extractVersionSuffix(item.version);
  return {
    ...item,
    device_ids: (item.device_ids || []).join(','),
    custom_version: !!suffix,
    version: suffix || '',
    fileList: item.filename
      ? [{ uid: '-1', name: item.filename, status: 'done' as const }]
      : [],
  };
};

const DirectionalOta: React.FC<{ canSave: boolean }> = ({ canSave }) => {
  const [form] = Form.useForm();
  const baseListRef = useRef<BaseListPageRef>(null);
  const allItemsRef = useRef<LocalDirectionalItem[]>([]);

  const [allItems, setAllItems] = useState<LocalDirectionalItem[]>([]);
  const [modifyTime, setModifyTime] = useState('');
  const [handlerName, setHandlerName] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LocalDirectionalItem | null>(
    null,
  );

  const createOrModifyModal = useModalControl();

  const syncAllItems = useCallback((items: LocalDirectionalItem[]) => {
    allItemsRef.current = items;
    setAllItems(items);
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const { response_status, data } = await OtaAPI.getDirectionalConfig();
      if (response_status.code !== SuccessCode.SUCCESS) {
        message.error(response_status.msg || '获取定向配置失败');
        return;
      }
      const items = (data.items || []).map((item) => ({
        ...item,
        _localKey: item.id || createLocalKey(),
      }));
      syncAllItems(items);
      setModifyTime(data.modify_time || '');
      setHandlerName(data.handler_name || '');
      setDirty(false);
      // 等 state/ref 更新后再刷列表
      setTimeout(() => baseListRef.current?.getData(), 0);
    } catch {
      message.error('获取定向配置失败');
    } finally {
      setConfigLoading(false);
    }
  }, [syncAllItems]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const fetchListData = useCallback(
    async (params: {
      page: number;
      limit: number;
      model?: string;
      module_type?: OtaType;
    }) => {
      const { page, limit, model, module_type } = params;
      const filtered = allItemsRef.current.filter((item) => {
        if (model && item.model !== model) return false;
        if (module_type && item.module_type !== module_type) return false;
        return true;
      });
      const start = (page - 1) * limit;
      return {
        list: filtered.slice(start, start + limit),
        total: filtered.length,
      };
    },
    [],
  );

  const refreshList = () => {
    baseListRef.current?.getData();
  };

  const handleModalOpen = (item?: LocalDirectionalItem) => {
    if (item) {
      setSelectedItem(item);
      form.setFieldsValue(toFormRecord(item));
    } else {
      setSelectedItem(null);
      form.resetFields();
      form.setFieldsValue({
        module_type: OtaType.Firmware,
        custom_version: false,
        device_ids: '',
        ext: '',
      });
    }
    createOrModifyModal.open();
  };

  const handleCopy = (item: LocalDirectionalItem) => {
    const copied: LocalDirectionalItem = {
      ...item,
      id: undefined,
      version: '',
      _localKey: createLocalKey(),
      ext: item.ext ? `${item.ext}（复制）` : '复制规则',
    };
    syncAllItems([copied, ...allItemsRef.current]);
    setDirty(true);
    message.success('已复制到列表顶部，请确认后保存');
    refreshList();
  };

  const handleDelete = (item: LocalDirectionalItem) => {
    Modal.confirm({
      title: '确认删除该规则？',
      content: '删除仅改本地列表，需点击「保存配置」才会生效。',
      onOk: () => {
        syncAllItems(
          allItemsRef.current.filter((i) => i._localKey !== item._localKey),
        );
        setDirty(true);
        refreshList();
      },
    });
  };

  const moveItem = (item: LocalDirectionalItem, direction: 'up' | 'down') => {
    const prev = [...allItemsRef.current];
    const index = prev.findIndex((i) => i._localKey === item._localKey);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= prev.length) return;
    [prev[index], prev[target]] = [prev[target], prev[index]];
    syncAllItems(prev);
    setDirty(true);
    refreshList();
  };

  const applyLocalItem = async (
    values: Record<string, any>,
  ): Promise<ResponseInfoType<null>> => {
    if (!values.path || !values.filename || !values.md5) {
      message.error('请先上传升级包文件');
      return Promise.reject('missing file');
    }

    const deviceIds = parseDeviceIds(values.device_ids || '');
    if (!deviceIds.length) {
      message.error('请填写定向设备 ID');
      return Promise.reject('empty devices');
    }
    if (deviceIds.length > 2000) {
      message.error('单条设备数不能超过 2000');
      return Promise.reject('too many devices');
    }

    const model =
      typeof values.model === 'string' ? values.model.trim() : values.model;

    let version = '';
    if (values.custom_version && values.version) {
      version = buildDirectionalVersion(
        model,
        values.module_type,
        values.version,
      );
    } else if (
      selectedItem &&
      values.path === selectedItem.path &&
      values.md5 === selectedItem.md5
    ) {
      // 未换包且未勾选自定义：保留原 version
      version = selectedItem.version || '';
    }

    const nextItem: LocalDirectionalItem = {
      _localKey: selectedItem?._localKey || createLocalKey(),
      id: selectedItem?.id,
      model,
      module_type: values.module_type,
      version,
      filename: values.filename,
      path: values.path,
      md5: values.md5,
      device_ids: deviceIds,
      ext: values.ext || '',
    };

    if (selectedItem) {
      syncAllItems(
        allItemsRef.current.map((item) =>
          item._localKey === selectedItem._localKey ? nextItem : item,
        ),
      );
    } else {
      syncAllItems([nextItem, ...allItemsRef.current]);
    }
    setDirty(true);

    return {
      response_status: {
        code: SuccessCode.SUCCESS,
        msg: '',
        extension: { key: '', value: '' },
      },
      data: null,
    };
  };

  const handleFormValues = (record: Record<string, any>) =>
    filterValues(record, ['fileList']);

  const buildPayloadItems = (
    items: LocalDirectionalItem[],
  ): DirectionalOtaItem[] =>
    items.map((item) => {
      const payload: DirectionalOtaItem = {
        model: item.model,
        module_type: item.module_type,
        filename: item.filename,
        path: item.path,
        md5: item.md5,
        device_ids: item.device_ids,
        ext: item.ext || '',
      };
      if (item.id) payload.id = item.id;
      if (item.version) payload.version = item.version;
      return payload;
    });

  const handleSave = async (allowEmpty = false) => {
    const items = allItemsRef.current;
    if (items.length > 200) {
      message.error('规则条数不能超过 200');
      return;
    }

    if (!items.length && !allowEmpty) {
      Modal.confirm({
        title: '确认清空全部定向规则？',
        content: '清空后设备将不再命中定向升级，仅走全量灰度。',
        onOk: () => handleSave(true),
      });
      return;
    }

    setSaving(true);
    try {
      const { response_status, data } = await OtaAPI.setDirectionalConfig({
        allow_empty: allowEmpty || items.length === 0,
        expected_modify_time: modifyTime,
        items: buildPayloadItems(items),
      });

      if (response_status.code === SuccessCode.SUCCESS) {
        const next = (data.items || []).map((item) => ({
          ...item,
          _localKey: item.id || createLocalKey(),
        }));
        syncAllItems(next);
        setModifyTime(data.modify_time || '');
        setHandlerName(data.handler_name || '');
        setDirty(false);
        message.success('定向配置已保存');
        refreshList();
        return;
      }

      if (response_status.code === DIRECTIONAL_ERROR_CODE.CONFLICT) {
        message.error('配置已被他人更新，已为你重新拉取，请核对后再保存');
        await loadConfig();
        return;
      }
      if (response_status.code === DIRECTIONAL_ERROR_CODE.EMPTY_WITHOUT_ALLOW) {
        Modal.confirm({
          title: '确认清空全部定向规则？',
          onOk: () => handleSave(true),
        });
        return;
      }
      message.error(response_status.msg || '保存失败');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = getColumns({
    canSave,
    allItems,
    onMove: moveItem,
    onEdit: (record) => handleModalOpen(record),
    onCopy: handleCopy,
    onDelete: handleDelete,
  });

  const titleNode = (
    <Space wrap>
      <span>定向升级</span>
      {dirty ? <Tag color="orange">有未保存改动</Tag> : null}
      <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
        最近修改：{modifyTime || '暂无'}
        {handlerName ? ` / ${handlerName}` : ''}
      </Text>
    </Space>
  );

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ margin: '0 24px 16px' }}
        message="定向升级说明"
        description={
          <Paragraph style={{ marginBottom: 0 }}>
            上传文件只改本地规则，<Text strong>必须再点「保存配置」</Text>
            设备才会看到。列表越靠前优先级越高。筛选只影响表格展示，保存会提交完整规则。
          </Paragraph>
        }
      />
      <BaseListPage
        ref={baseListRef}
        title={titleNode}
        columns={columns as ColumnType<any>[]}
        searchFormItems={searchForm}
        fetchData={fetchListData}
        createButton={
          canSave
            ? {
                text: '新增规则',
                onClick: () => handleModalOpen(),
              }
            : undefined
        }
        extraButtons={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={configLoading}
              onClick={loadConfig}
            >
              重新拉取
            </Button>
            {canSave && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => handleSave()}
              >
                保存配置
              </Button>
            )}
          </Space>
        }
      />
      <CreateOrModifyForm
        modalVisible={createOrModifyModal.visible}
        onCancel={() => {
          createOrModifyModal.close();
          setSelectedItem(null);
          form.resetFields();
        }}
        refresh={() => {
          createOrModifyModal.close();
          setSelectedItem(null);
          refreshList();
        }}
        text={{
          title: selectedItem ? '编辑定向规则' : '新增定向规则',
          successMsg: selectedItem
            ? '已更新到本地列表，请点击保存配置'
            : '已加入本地列表，请点击保存配置',
        }}
        api={applyLocalItem}
        record={selectedItem ? toFormRecord(selectedItem) : undefined}
        idMapKey="_localKey"
        idMapValue="_localKey"
        ownForm={form}
        operatorFields={handleFormValues}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="此处确认不会立即下发，需在页面点击「保存配置」"
        />
        <DirectionalForm form={form} isEdit={!!selectedItem} />
      </CreateOrModifyForm>
    </>
  );
};

export default DirectionalOta;
