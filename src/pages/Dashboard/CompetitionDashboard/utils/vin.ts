const CHINESE_PATTERN = /[\u4e00-\u9fff]/;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/** 标准 VIN 不含 I/O/Q，Excel 中常见误填为 1/0，入库前自动纠正 */
export function correctVinConfusables(vin: string): string {
  return vin.replace(/O/g, '0').replace(/I/g, '1').replace(/Q/g, '0');
}

export function toHalfWidth(value: string): string {
  return value
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');
}

export function cleanVin(raw: unknown): {
  vin: string;
  valid: boolean;
  reason?: string;
} {
  if (raw === null || raw === undefined) {
    return { vin: '', valid: false, reason: '车架号为空' };
  }

  let vin = toHalfWidth(String(raw).trim().toUpperCase());
  vin = vin.replace(/\s+/g, '');
  vin = correctVinConfusables(vin);

  if (!vin) return { vin: '', valid: false, reason: '车架号为空' };
  if (CHINESE_PATTERN.test(vin)) {
    return { vin, valid: false, reason: '车架号不能包含汉字' };
  }
  if (vin.length !== 17) {
    return {
      vin,
      valid: false,
      reason: `车架号长度应为17位，当前${vin.length}位`,
    };
  }
  if (!VIN_PATTERN.test(vin)) {
    return { vin, valid: false, reason: '车架号包含非法字符' };
  }
  return { vin, valid: true };
}

export function uniqueVins(vins: string[]): string[] {
  return Array.from(new Set(vins.filter(Boolean)));
}

/** 与 metrics.ts 一致：Excel 标记是否未安装 */
export function isExcelNotInstalled(flag?: string): boolean {
  if (!flag) return true;
  const text = flag.trim();
  if (!text) return true;
  if (text.includes('否') || text.includes('未') || text.includes('无'))
    return true;
  if (text.includes('是') || text.includes('已') || text.includes('有'))
    return false;
  return true;
}
