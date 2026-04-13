export interface ImuRecord {
  ts: string; // 东八区本地时间字符串，例如 2026-02-27 13:00:00.061
  device_id: string;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
}

/**
 * 解析 IMU CSV 文本为 ImuRecord[]
 * 支持表头：
 * - 时间：ts（字符串）或 timestamp（时间戳，秒或毫秒）
 * - 其它：device_id, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z
 * 单元格可为双引号包裹
 */
export function parseCsvToImuRecords(text: string): ImuRecord[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return [];

  const unquote = (s: string) => s.replace(/^"|"$/g, '').trim();
  const header = lines[0].split(',').map(unquote);
  const headerLower = header.map((h) => h.toLowerCase());

  const findIndex = (names: string[]) => {
    for (const n of names) {
      const i = headerLower.indexOf(n.toLowerCase());
      if (i !== -1) return i;
    }
    return -1;
  };

  const iTs = findIndex(['ts']);
  const iTimestamp = iTs === -1 ? findIndex(['timestamp']) : -1;
  if (iTs === -1 && iTimestamp === -1) {
    throw new Error('CSV 缺少列: ts 或 timestamp');
  }

  const iDeviceId = findIndex(['device_id']);
  const iAccX = findIndex(['acc_x']);
  const iAccY = findIndex(['acc_y']);
  const iAccZ = findIndex(['acc_z']);
  const iGyroX = findIndex(['gyro_x']);
  const iGyroY = findIndex(['gyro_y']);
  const iGyroZ = findIndex(['gyro_z']);

  if ([iAccX, iAccY, iAccZ, iGyroX, iGyroY, iGyroZ].some((i) => i === -1)) {
    throw new Error(
      'CSV 缺少必要列: acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z',
    );
  }

  const parseTimestamp = (raw: string): string => {
    const s = raw.trim();
    if (!s) return '';
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    // 判断是秒还是毫秒级时间戳：小于 1e11 视为秒
    const ms = n < 1e11 ? n * 1000 : n;
    return new Date(ms).toISOString();
  };

  const records: ImuRecord[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',').map(unquote);
    if (cells.length < header.length) continue;
    const tsRaw =
      iTs !== -1
        ? cells[iTs] ?? ''
        : iTimestamp !== -1
        ? cells[iTimestamp] ?? ''
        : '';
    records.push({
      ts: iTimestamp !== -1 && iTs === -1 ? parseTimestamp(tsRaw) : tsRaw,
      device_id: iDeviceId !== -1 ? cells[iDeviceId] ?? '' : '',
      acc_x: Number(cells[iAccX]) || 0,
      acc_y: Number(cells[iAccY]) || 0,
      acc_z: Number(cells[iAccZ]) || 0,
      gyro_x: Number(cells[iGyroX]) || 0,
      gyro_y: Number(cells[iGyroY]) || 0,
      gyro_z: Number(cells[iGyroZ]) || 0,
    });
  }
  return records;
}
