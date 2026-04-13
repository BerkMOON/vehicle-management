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
  Space,
  Steps,
  Table,
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
  vin: string;
  device_id?: string;
  in_time: string; // 原始字符串
  in_time_dt?: string; // 标准化 YYYY-MM-DD HH:mm:ss
};

type ResultRow = ParsedRow & {
  matched: boolean; // 是否找到“通过”的任务/线索
  matched_device_id?: string; // VIN 关联出来的 device_id
  clue_id?: string;
  status_name?: string;
  approved_time?: string;
  reason?: string;
};

function normalizeHeader(h: string) {
  return String(h || '')
    .trim()
    .toLowerCase();
}

function guessColumnIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.findIndex((h) => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function formatExcelTime(value: any): string {
  if (value === null) return '';
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
  const s = String(value).trim();
  if (!s) return '';
  // 尝试解析常见格式
  const dt = dayjs(s);
  if (dt.isValid()) return dt.format('YYYY-MM-DD HH:mm:ss');
  return s;
}

async function fetchDeviceIdByVin(vin: string): Promise<string | undefined> {
  if (!vin) return undefined;
  const res = await EquipmentAPI.getEquipmentRelations({
    page: 1,
    limit: 20,
    // typings 里未声明，但后端通常支持 vin 条件；这里按实际接口能力传递
    vin,
  } as any);
  const list: EquipmentRelationItem[] = (res as any)?.data?.relation_list || [];
  const hit = list.find((r) => String(r.vin || '').trim() === vin);
  return hit?.device_id;
}

function downloadResultsAsExcel(rows: ResultRow[]) {
  if (rows.length === 0) {
    message.warning('暂无结果可下载');
    return;
  }
  const sheetData = rows.map((r) => ({
    车架号: r.vin,
    进店时间: r.in_time_dt ?? '',
    设备ID: r.matched_device_id ?? '',
    是否丢失: r.matched ? '未丢失' : '丢失',
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

const AccidentLossPage: React.FC = () => {
  const [windowDays, setWindowDays] = useState<number>(DEFAULT_WINDOW_DAYS);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);

  const step = useMemo(() => {
    if (results.length > 0) return 2;
    if (parsedRows.length > 0) return 1;
    return 0;
  }, [parsedRows.length, results.length]);

  const columns = [
    { title: '车架号(VIN)', dataIndex: 'vin', key: 'vin', width: 220 },
    {
      title: '进店时间',
      dataIndex: 'in_time_dt',
      key: 'in_time_dt',
      width: 180,
    },
    {
      title: '设备ID',
      dataIndex: 'matched_device_id',
      key: 'matched_device_id',
      width: 180,
    },
    {
      title: '是否丢失',
      dataIndex: 'matched',
      key: 'matched',
      width: 120,
      render: (v: boolean) =>
        v ? (
          <Text type="success">未丢失</Text>
        ) : (
          <Text type="danger">丢失</Text>
        ),
    },
    { title: '线索ID', dataIndex: 'clue_id', key: 'clue_id', width: 180 },
    {
      title: '审核通过时间',
      dataIndex: 'approved_time',
      key: 'approved_time',
      width: 180,
    },
    { title: '状态', dataIndex: 'status_name', key: 'status_name', width: 140 },
    { title: '说明', dataIndex: 'reason', key: 'reason', width: 260 },
  ];

  const handleExcelFile = async (file: File) => {
    setResults([]);
    setParsedRows([]);
    const isSheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isSheet) {
      message.error('只能上传 xlsx/xls 文件');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: '',
        }) as any[][];

        const headers = (raw?.[0] || []).map((h) => String(h || '').trim());
        const vinIdx = guessColumnIndex(headers, ['车架号', 'vin']);
        const deviceIdx = guessColumnIndex(headers, [
          '设备号',
          'device',
          'device_id',
        ]);
        const timeIdx = guessColumnIndex(headers, [
          '进店时间',
          '进店',
          '时间',
          'in_time',
        ]);

        if (vinIdx < 0 || timeIdx < 0) {
          message.error('未识别到必填列：车架号(VIN)、进店时间');
          return;
        }

        const rows: ParsedRow[] = raw
          .slice(1)
          .filter((r) => r?.some((v) => String(v || '').trim() !== ''))
          .map((r, idx) => {
            const vin = String(r[vinIdx] || '').trim();
            const device_id =
              deviceIdx >= 0 ? String(r[deviceIdx] || '').trim() : '';
            const in_time = String(r[timeIdx] || '').trim();
            const in_time_dt = formatExcelTime(r[timeIdx]);
            return {
              key: String(idx),
              vin,
              device_id: device_id || undefined,
              in_time,
              in_time_dt: in_time_dt || undefined,
            };
          })
          .filter((r) => r.vin && r.in_time_dt);

        setParsedRows(rows);
        message.success(`解析成功：${rows.length} 行`);
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
        const base = dayjs(row.in_time_dt);
        const start = base
          .subtract(windowDays, 'day')
          .format('YYYY-MM-DD HH:mm:ss');
        const end = base.format('YYYY-MM-DD HH:mm:ss');

        let deviceId: string | undefined;
        let matchedTask: AuditTaskItem | undefined;
        try {
          await acquire();
          deviceId = await fetchDeviceIdByVin(row.vin);
          if (!deviceId) continue;

          await acquire();
          const tasks = await fetchApprovedTasksByDeviceId(deviceId);
          // 在进店时间窗口内，是否存在 status=1(通过) 的任务
          matchedTask = tasks.find((t) => {
            const approved = dayjs((t as any).create_time);
            if (!approved.isValid()) return false;
            return (
              (approved.isAfter(start) || approved.isSame(start)) &&
              (approved.isBefore(end) || approved.isSame(end))
            );
          });
        } catch (e) {
          console.error('查询失败', e);
        }

        if (!deviceId) continue;

        out.push({
          ...row,
          matched: Boolean(matchedTask),
          matched_device_id: deviceId,
          clue_id: (matchedTask as any)?.clue_id,
          approved_time: (matchedTask as any)?.create_time,
          status_name: (matchedTask as any)?.status?.name,
          reason: matchedTask
            ? `进店前${windowDays}天内存在 status=1(通过) 任务`
            : `进店前${windowDays}天内未找到 status=1(通过) 任务`,
        });
      }

      setResults(out);
      message.success('查询完成');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = results.length;
    const ok = results.filter((r) => r.matched).length;
    return { total, ok, lost: total - ok };
  }, [results]);

  return (
    <PageContainer header={{ title: '事故丢失处理' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Steps
            current={step}
            items={[
              { title: '上传 Excel' },
              { title: '查询线索' },
              { title: '查看结果' },
            ]}
          />
          <Divider />
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">
              流程：上传 Excel → VIN 查设备（getAllDeviceRelations）→ 按
              device_id 查通过任务（getTaskList status=1）→ 判断是否丢失。
            </Text>
            <Text type="secondary">
              判定：若在「进店时间前 {windowDays} 天 ~
              进店时间」内存在通过任务，则为 <Text type="success">未丢失</Text>
              ；否则为 <Text type="danger">丢失</Text>。
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
              需要包含列：车架号(VIN)、进店时间；可选列：设备号
            </p>
          </Dragger>
          {parsedRows.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                已解析 {parsedRows.length} 行，点击“开始查询”执行校验。
              </Text>
            </div>
          )}
        </Card>

        {results.length > 0 && (
          <Card title="查询结果">
            <Space wrap style={{ marginBottom: 12 }} align="center">
              <Text>总计：{summary.total}</Text>
              <Text type="success">未丢失：{summary.ok}</Text>
              <Text type="danger">丢失：{summary.lost}</Text>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={() => downloadResultsAsExcel(results)}
              >
                下载查询结果
              </Button>
            </Space>
            <Table<ResultRow>
              rowKey={(r) => `${r.vin}-${r.in_time_dt}`}
              columns={columns as any}
              dataSource={results}
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
