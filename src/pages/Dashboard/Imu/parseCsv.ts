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
 * 支持表头：ts, device_id, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z
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
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`CSV 缺少列: ${name}`);
    return i;
  };

  const iTs = idx('ts');
  const iDeviceId = idx('device_id');
  const iAccX = idx('acc_x');
  const iAccY = idx('acc_y');
  const iAccZ = idx('acc_z');
  const iGyroX = idx('gyro_x');
  const iGyroY = idx('gyro_y');
  const iGyroZ = idx('gyro_z');

  const records: ImuRecord[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',').map(unquote);
    if (cells.length < header.length) continue;
    records.push({
      ts: cells[iTs] ?? '',
      device_id: cells[iDeviceId] ?? '',
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
