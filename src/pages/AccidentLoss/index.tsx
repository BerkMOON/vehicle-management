import { AuditAPI } from '@/services/audit/AuditController';
import type { AuditTaskItem } from '@/services/audit/typings';
import EquipmentAPI from '@/services/equipment/EquipmentCotroller';
import type { EquipmentRelationItem } from '@/services/equipment/typings';
import {
  DownloadOutlined,
  InboxOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Divider,
  InputNumber,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;
const { Text } = Typography;

const DEFAULT_WINDOW_DAYS = 60;
/** 全局限流：任意 1 秒内最多发起这么多次 HTTP 请求，避免压垮服务端 */
const HTTP_REQUESTS_PER_SECOND = 10;
const RATE_WINDOW_MS = 1000;

/** 细化判定：区分「疑似我方丢失」与「非系统责任/无法归因」 */
type ResultCategory =
  | 'found' // 系统有通过线索
  | 'no_clue' // 有设备，窗口内无通过线索 → 疑似我方丢失
  | 'no_device' // 未查到 VIN 对应设备
  | 'invalid_time' // 事故时间无效
  | 'query_error'; // 接口失败

const CATEGORY_META: Record<
  ResultCategory,
  { label: string; color: string; suspectOurLoss: boolean }
> = {
  found: {
    label: '未丢失(系统有通过线索)',
    color: 'success',
    suspectOurLoss: false,
  },
  no_clue: {
    label: '疑似我方丢失(有设备无通过线索)',
    color: 'error',
    suspectOurLoss: true,
  },
  no_device: {
    label: '未绑定设备(查无 VIN 设备)',
    color: 'default',
    suspectOurLoss: false,
  },
  invalid_time: {
    label: '事故时间无效',
    color: 'warning',
    suspectOurLoss: false,
  },
  query_error: {
    label: '接口查询失败',
    color: 'warning',
    suspectOurLoss: false,
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ResultCategory[];
/** 默认筛选项：只看「疑似我方丢失」 */
const DEFAULT_FILTER_CATEGORIES: ResultCategory[] = ['no_clue'];

/**
 * 滑动窗口限流：在调用返回前会 await，保证全局「请求开始」频率不超过 maxPerWindow / windowMs
 */
function createSlidingWindowLimiter(maxPerWindow: number, windowMs: number) {
  const timestamps: number[] = [];
  return async function acquire(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const now = Date.now();
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length < maxPerWindow) {
        timestamps.push(now);
        return;
      }
      const wait = timestamps[0] + windowMs - now + 1;
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), Math.max(0, wait));
      });
    }
  };
}

type ParsedRow = {
  key: string;
  seq?: string;
  vin: string;
  plate_no?: string;
  car_model?: string;
  channel?: string;
  receive_time?: string;
  accident_time: string;
  accident_time_dt: string;
  purchase_date?: string;
  installed_eda?: string;
  eda_provided_clue?: string;
  returned_to_store?: string;
  loss_amount?: string;
  outreach_fee?: string;
};

type ResultRow = ParsedRow & {
  matched: boolean;
  category: ResultCategory;
  matched_device_id?: string;
  clue_id?: string;
  status_name?: string;
  approved_time?: string;
  reason?: string;
};

function normalizeHeader(h: string) {
  return String(h || '')
    .replace(/\s+/g, '')
    .replace(/\n/g, '')
    .trim()
    .toLowerCase();
}

function guessColumnIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const needle = normalizeHeader(c);
    if (!needle) continue;
    // 禁止用空表头匹配：'xxx'.includes('') === true，会把标题行误判成表头
    const idx = normalized.findIndex(
      (h) => !!h && (h.includes(needle) || needle.includes(h)),
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

/** 在前若干行中定位表头行（台账标题在第 1 行，表头通常在第 2 行） */
function findHeaderRow(raw: any[][]): { rowIndex: number; headers: string[] } {
  const maxScan = Math.min(raw.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const headers = (raw[i] || []).map((h) => String(h || '').trim());
    const vinIdx = guessColumnIndex(headers, ['车架号', 'vin']);
    const timeIdx = guessColumnIndex(headers, [
      '事故发生时间',
      '事故时间',
      '收到线索日期',
      '收到线索',
    ]);
    // 必须同时具备车架号 + 时间列，避免标题行空单元格误匹配
    if (vinIdx >= 0 && timeIdx >= 0) {
      return { rowIndex: i, headers };
    }
  }
  return { rowIndex: -1, headers: [] };
}

function formatExcelTime(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    return dayjs(value).isValid()
      ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
      : '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel 序列日期（含小数时间）；过小的整数多半是序号而非日期
    if (value > 0 && value < 1000 && Number.isInteger(value)) {
      return '';
    }
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y >= 1990) {
      const dt = dayjs(
        new Date(
          parsed.y,
          parsed.m - 1,
          parsed.d,
          parsed.H || 0,
          parsed.M || 0,
          Math.floor(parsed.S || 0),
        ),
      );
      return dt.isValid() ? dt.format('YYYY-MM-DD HH:mm:ss') : '';
    }
    return '';
  }
  const s = String(value).trim();
  if (!s) return '';
  // 兼容 Excel 展示格式：2026/8/1 9:56
  const normalized = s.replace(/\//g, '-');
  const dt = dayjs(normalized);
  if (dt.isValid()) return dt.format('YYYY-MM-DD HH:mm:ss');
  const dt2 = dayjs(s);
  if (dt2.isValid()) return dt2.format('YYYY-MM-DD HH:mm:ss');
  return '';
}

function cellText(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return dayjs(value).isValid()
      ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
      : '';
  }
  return String(value).trim();
}

/** 优先取第 2 个 sheet（「二」事故车线索台账），否则按名称匹配 */
function pickLedgerSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  const names = wb.SheetNames || [];
  if (names.length >= 2) {
    return wb.Sheets[names[1]];
  }
  const byName = names.find(
    (n) => n.includes('二') || n.includes('台账') || n.includes('线索'),
  );
  if (byName) return wb.Sheets[byName];
  return names[0] ? wb.Sheets[names[0]] : null;
}

async function fetchDeviceIdByVin(vin: string): Promise<string | undefined> {
  if (!vin) return undefined;
  const res = await EquipmentAPI.getEquipmentRelations({
    page: 1,
    limit: 20,
    vin,
  } as any);
  const list: EquipmentRelationItem[] = (res as any)?.data?.relation_list || [];
  const hit = list.find((r) => String(r.vin || '').trim() === vin);
  return hit?.device_id;
}

async function fetchApprovedTasksByDeviceId(
  deviceId: string,
): Promise<AuditTaskItem[]> {
  const res = await AuditAPI.getTaskList({
    page: 1,
    limit: 200,
    clue_id: '',
    handler_id: 0,
    device_id: deviceId,
    status: 1, // 1=通过
    level: '',
  } as any);
  return (res as any)?.data?.task_list || [];
}

function downloadResultsAsExcel(rows: ResultRow[]) {
  if (rows.length === 0) {
    message.warning('暂无结果可下载');
    return;
  }
  const sheetData = rows.map((r) => ({
    序号: r.seq ?? '',
    收到线索日期: r.receive_time ?? '',
    事故发生时间: r.accident_time_dt || r.accident_time,
    线索渠道: r.channel ?? '',
    车架号: r.vin,
    车牌号: r.plate_no ?? '',
    车型: r.car_model ?? '',
    购车日期: r.purchase_date ?? '',
    是否安装易达安: r.installed_eda ?? '',
    易达安是否提供线索_台账: r.eda_provided_clue ?? '',
    车辆是否回厂: r.returned_to_store ?? '',
    定损金额: r.loss_amount ?? '',
    外拓费: r.outreach_fee ?? '',
    设备ID: r.matched_device_id ?? '',
    结果分类: CATEGORY_META[r.category]?.label ?? r.category,
    是否疑似我方丢失: CATEGORY_META[r.category]?.suspectOurLoss ? '是' : '否',
    系统判定: r.matched ? '未丢失(系统有通过线索)' : '丢失/无法归因',
    线索ID: r.clue_id ?? '',
    审核通过时间: r.approved_time ?? '',
    状态: r.status_name ?? '',
    说明: r.reason ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '查询结果');
  const filename = `事故丢失查询结果_${dayjs().format(
    'YYYY-MM-DD_HHmmss',
  )}.xlsx`;
  XLSX.writeFile(wb, filename);
  message.success(`已下载：${filename}`);
}

const AccidentLossPage: React.FC = () => {
  const [windowDays, setWindowDays] = useState<number>(DEFAULT_WINDOW_DAYS);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [filterCategories, setFilterCategories] = useState<ResultCategory[]>(
    DEFAULT_FILTER_CATEGORIES,
  );

  const step = useMemo(() => {
    if (results.length > 0) return 2;
    if (parsedRows.length > 0) return 1;
    return 0;
  }, [parsedRows.length, results.length]);

  const filteredResults = useMemo(() => {
    if (filterCategories.length === 0) return results;
    return results.filter((r) => filterCategories.includes(r.category));
  }, [results, filterCategories]);

  const columns = [
    { title: '序号', dataIndex: 'seq', key: 'seq', width: 70 },
    { title: '车架号(VIN)', dataIndex: 'vin', key: 'vin', width: 180 },
    { title: '车牌号', dataIndex: 'plate_no', key: 'plate_no', width: 110 },
    { title: '车型', dataIndex: 'car_model', key: 'car_model', width: 120 },
    {
      title: '事故发生时间',
      dataIndex: 'accident_time_dt',
      key: 'accident_time_dt',
      width: 170,
    },
    {
      title: '收到线索日期',
      dataIndex: 'receive_time',
      key: 'receive_time',
      width: 170,
    },
    { title: '线索渠道', dataIndex: 'channel', key: 'channel', width: 100 },
    {
      title: '台账-是否安装(仅参考)',
      dataIndex: 'installed_eda',
      key: 'installed_eda',
      width: 140,
    },
    {
      title: '台账-易达安是否提供线索',
      dataIndex: 'eda_provided_clue',
      key: 'eda_provided_clue',
      width: 160,
    },
    {
      title: '设备ID',
      dataIndex: 'matched_device_id',
      key: 'matched_device_id',
      width: 160,
    },
    {
      title: '结果分类',
      dataIndex: 'category',
      key: 'category',
      width: 220,
      render: (c: ResultCategory) => {
        const meta = CATEGORY_META[c];
        return <Tag color={meta?.color}>{meta?.label ?? c}</Tag>;
      },
    },
    {
      title: '疑似我方',
      dataIndex: 'category',
      key: 'suspect',
      width: 90,
      render: (c: ResultCategory) =>
        CATEGORY_META[c]?.suspectOurLoss ? (
          <Text type="danger">是</Text>
        ) : (
          <Text type="secondary">否</Text>
        ),
    },
    { title: '线索ID', dataIndex: 'clue_id', key: 'clue_id', width: 160 },
    {
      title: '审核通过时间',
      dataIndex: 'approved_time',
      key: 'approved_time',
      width: 170,
    },
    { title: '状态', dataIndex: 'status_name', key: 'status_name', width: 100 },
    { title: '说明', dataIndex: 'reason', key: 'reason', width: 280 },
  ];

  const handleExcelFile = async (file: File) => {
    setResults([]);
    setParsedRows([]);
    setFilterCategories(DEFAULT_FILTER_CATEGORIES);
    const isSheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isSheet) {
      message.error('只能上传 xlsx/xls 文件');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheet = pickLedgerSheet(wb);
        if (!sheet) {
          message.error('未找到可用工作表');
          return;
        }

        const raw = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
          defval: '',
        }) as any[][];

        const { rowIndex: headerRowIndex, headers } = findHeaderRow(raw);
        if (headerRowIndex < 0) {
          message.error(
            '未识别到表头（需含「车架号」列）。请确认上传的是第二个 sheet「事故车线索台账」',
          );
          return;
        }

        const vinIdx = guessColumnIndex(headers, ['车架号', 'vin']);
        const accidentIdx = guessColumnIndex(headers, [
          '事故发生时间',
          '事故时间',
          '事故发生',
        ]);
        const receiveIdx = guessColumnIndex(headers, [
          '收到线索日期',
          '收到线索',
          '线索日期',
        ]);
        const seqIdx = guessColumnIndex(headers, ['序号']);
        const plateIdx = guessColumnIndex(headers, ['车牌号', '车牌']);
        const modelIdx = guessColumnIndex(headers, ['车型']);
        const channelIdx = guessColumnIndex(headers, ['线索渠道', '渠道']);
        const purchaseIdx = guessColumnIndex(headers, ['购车日期', '购车']);
        const installedIdx = guessColumnIndex(headers, [
          '是否安装易达安',
          '是否安装',
        ]);
        const providedIdx = guessColumnIndex(headers, [
          '易达安是否提供线索',
          '是否提供线索',
        ]);
        const returnedIdx = guessColumnIndex(headers, [
          '车辆是否回厂',
          '是否回厂',
        ]);
        const amountIdx = guessColumnIndex(headers, ['定损金额', '定损']);
        const feeIdx = guessColumnIndex(headers, ['外拓费']);

        // 时间基准：优先事故发生时间，否则收到线索日期
        const timeIdx = accidentIdx >= 0 ? accidentIdx : receiveIdx;
        if (vinIdx < 0 || timeIdx < 0) {
          message.error(
            '未识别到必填列：车架号、事故发生时间（或收到线索日期）',
          );
          return;
        }

        const rows: ParsedRow[] = raw
          .slice(headerRowIndex + 1)
          .filter((r) => r?.some((v) => String(v ?? '').trim() !== ''))
          .map((r, idx) => {
            const vin = cellText(r[vinIdx]).toUpperCase();
            const accidentRaw = accidentIdx >= 0 ? r[accidentIdx] : r[timeIdx];
            const accident_time_dt = formatExcelTime(accidentRaw);
            const accident_time = accident_time_dt || cellText(accidentRaw);
            return {
              key: String(idx),
              seq: seqIdx >= 0 ? cellText(r[seqIdx]) : undefined,
              vin,
              plate_no: plateIdx >= 0 ? cellText(r[plateIdx]) : undefined,
              car_model: modelIdx >= 0 ? cellText(r[modelIdx]) : undefined,
              channel: channelIdx >= 0 ? cellText(r[channelIdx]) : undefined,
              receive_time:
                receiveIdx >= 0
                  ? formatExcelTime(r[receiveIdx]) || cellText(r[receiveIdx])
                  : undefined,
              accident_time,
              accident_time_dt,
              purchase_date:
                purchaseIdx >= 0
                  ? formatExcelTime(r[purchaseIdx]) || cellText(r[purchaseIdx])
                  : undefined,
              installed_eda:
                installedIdx >= 0 ? cellText(r[installedIdx]) : undefined,
              eda_provided_clue:
                providedIdx >= 0 ? cellText(r[providedIdx]) : undefined,
              returned_to_store:
                returnedIdx >= 0 ? cellText(r[returnedIdx]) : undefined,
              loss_amount: amountIdx >= 0 ? cellText(r[amountIdx]) : undefined,
              outreach_fee: feeIdx >= 0 ? cellText(r[feeIdx]) : undefined,
            };
          })
          .filter((r) => r.vin && r.accident_time_dt);

        if (rows.length === 0) {
          message.warning('未解析到有效数据行（需有车架号与事故发生时间）');
          return;
        }

        setParsedRows(rows);
        message.success(
          `已从「${wb.SheetNames[1] || wb.SheetNames[0]}」解析 ${
            rows.length
          } 行`,
        );
      } catch (err) {
        console.error(err);
        message.error('解析 Excel 失败');
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const runCheck = async () => {
    if (parsedRows.length === 0) {
      message.warning('请先上传并解析 Excel');
      return;
    }
    setLoading(true);
    try {
      const acquire = createSlidingWindowLimiter(
        HTTP_REQUESTS_PER_SECOND,
        RATE_WINDOW_MS,
      );
      const out: ResultRow[] = [];

      for (const row of parsedRows) {
        const base = dayjs(row.accident_time_dt);
        if (!base.isValid()) {
          out.push({
            ...row,
            matched: false,
            category: 'invalid_time',
            reason: '事故发生时间无效，无法查询',
          });
          continue;
        }

        // 是否安装只以 VIN 查设备绑定为准，不采信台账「是否安装易达安」
        const start = base
          .subtract(windowDays, 'day')
          .format('YYYY-MM-DD HH:mm:ss');
        const end = base.format('YYYY-MM-DD HH:mm:ss');

        let deviceId: string | undefined;
        let matchedTask: AuditTaskItem | undefined;
        let queryError = false;
        try {
          await acquire();
          deviceId = await fetchDeviceIdByVin(row.vin);
          if (deviceId) {
            await acquire();
            const tasks = await fetchApprovedTasksByDeviceId(deviceId);
            matchedTask = tasks.find((t) => {
              const approved = dayjs((t as any).create_time);
              if (!approved.isValid()) return false;
              return (
                (approved.isAfter(start) || approved.isSame(start)) &&
                (approved.isBefore(end) || approved.isSame(end))
              );
            });
          }
        } catch (e) {
          console.error('查询失败', e);
          queryError = true;
        }

        if (queryError) {
          out.push({
            ...row,
            matched: false,
            category: 'query_error',
            matched_device_id: deviceId,
            reason: '接口查询失败，需重试后再判定',
          });
          continue;
        }

        if (!deviceId) {
          out.push({
            ...row,
            matched: false,
            category: 'no_device',
            reason: '未查到 VIN 对应设备（以系统绑定为准），不计入疑似我方丢失',
          });
          continue;
        }

        if (matchedTask) {
          out.push({
            ...row,
            matched: true,
            category: 'found',
            matched_device_id: deviceId,
            clue_id: (matchedTask as any)?.clue_id,
            approved_time: (matchedTask as any)?.create_time,
            status_name: (matchedTask as any)?.status?.name,
            reason: `事故发生前${windowDays}天内存在 status=1(通过) 任务`,
          });
        } else {
          out.push({
            ...row,
            matched: false,
            category: 'no_clue',
            matched_device_id: deviceId,
            reason: `有设备，但事故发生前${windowDays}天内未找到 status=1(通过) 任务 → 疑似我方丢失`,
          });
        }
      }

      setResults(out);
      setFilterCategories(DEFAULT_FILTER_CATEGORIES);
      message.success('查询完成');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const byCategory = ALL_CATEGORIES.reduce((acc, c) => {
      acc[c] = results.filter((r) => r.category === c).length;
      return acc;
    }, {} as Record<ResultCategory, number>);
    const suspect = results.filter(
      (r) => CATEGORY_META[r.category]?.suspectOurLoss,
    ).length;
    return {
      total: results.length,
      found: byCategory.found,
      suspect,
      byCategory,
      filtered: filteredResults.length,
    };
  }, [results, filteredResults.length]);

  return (
    <PageContainer header={{ title: '事故丢失处理' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Steps
            current={step}
            items={[
              { title: '上传台账 Excel' },
              { title: '查询系统线索' },
              { title: '查看结果' },
            ]}
          />
          <Divider />
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">
              适配「易达安线索统计」模板：自动读取第 2 个
              sheet（事故车线索台账），按车架号 +
              事故发生时间查询系统是否在窗口内有通过线索。
            </Text>
            <Text type="secondary">
              流程：解析台账 → VIN 查设备（getAllDeviceRelations）→ 按 device_id
              查通过任务（getTaskList status=1）→ 判定是否丢失。
            </Text>
            <Text type="secondary">
              判定细化：仅「有设备且窗口内无通过线索」计为{' '}
              <Text type="danger">疑似我方丢失</Text>
              ；未绑定设备等可筛选排除，不混入丢失归因。是否安装以 VIN
              查系统绑定为准，不采信台账「是否安装」。
            </Text>
          </Space>
          <Space style={{ marginTop: 12 }} wrap>
            <Text strong>时间窗口</Text>
            <InputNumber
              min={1}
              max={365}
              value={windowDays}
              onChange={(v) => setWindowDays(Number(v || DEFAULT_WINDOW_DAYS))}
              addonAfter="天"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={runCheck}
              loading={loading}
              disabled={parsedRows.length === 0}
            >
              开始查询
            </Button>
          </Space>
        </Card>

        <Card title="上传文件">
          <Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleExcelFile as any}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽上传 Excel</p>
            <p className="ant-upload-hint">
              请上传「易达安线索统计」类文件；将读取第 2 个
              sheet，识别列：车架号、事故发生时间、收到线索日期、车牌号、车型等
            </p>
          </Dragger>
          {parsedRows.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                已解析 {parsedRows.length}{' '}
                行，点击“开始查询”按事故发生时间窗口校验。
              </Text>
            </div>
          )}
        </Card>

        {results.length > 0 && (
          <Card title="查询结果">
            <Space wrap style={{ marginBottom: 12 }} align="center">
              <Text>全部：{summary.total}</Text>
              <Text type="success">未丢失：{summary.found}</Text>
              <Text type="danger">疑似我方丢失：{summary.suspect}</Text>
              <Text type="secondary">
                未绑定设备：{summary.byCategory.no_device}
              </Text>
              {(summary.byCategory.invalid_time > 0 ||
                summary.byCategory.query_error > 0) && (
                <Text type="warning">
                  异常：时间无效 {summary.byCategory.invalid_time} / 查询失败{' '}
                  {summary.byCategory.query_error}
                </Text>
              )}
            </Space>
            <Space wrap style={{ marginBottom: 12 }} align="center">
              <Text strong>结果筛选</Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="全部类型"
                style={{ minWidth: 420 }}
                value={filterCategories}
                onChange={(v) => setFilterCategories(v as ResultCategory[])}
                options={ALL_CATEGORIES.map((c) => ({
                  value: c,
                  label: `${CATEGORY_META[c].label}（${summary.byCategory[c]}）`,
                }))}
              />
              <Button
                type="link"
                onClick={() => setFilterCategories(DEFAULT_FILTER_CATEGORIES)}
              >
                仅疑似我方丢失
              </Button>
              <Button type="link" onClick={() => setFilterCategories([])}>
                显示全部
              </Button>
              <Text type="secondary">当前列表：{summary.filtered} 行</Text>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={() => downloadResultsAsExcel(filteredResults)}
              >
                下载当前筛选结果
              </Button>
              <Button
                type="link"
                onClick={() => downloadResultsAsExcel(results)}
              >
                下载全部
              </Button>
            </Space>
            <Table<ResultRow>
              rowKey={(r) => `${r.vin}-${r.accident_time_dt}-${r.seq ?? ''}`}
              columns={columns as any}
              dataSource={filteredResults}
              loading={loading}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20, showSizeChanger: true }}
            />
          </Card>
        )}
      </Space>
    </PageContainer>
  );
};

export default AccidentLossPage;
