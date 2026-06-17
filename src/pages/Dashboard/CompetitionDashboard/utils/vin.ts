const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

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

  if (!vin) return { vin: '', valid: false, reason: '车架号为空' };
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
