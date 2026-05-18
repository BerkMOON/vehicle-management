import type { OutboundRecordItem } from '@/services/warehouse/outbound/typings.d';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const SELLER_NAME = '北京达安数智科技有限公司';
const SELLER_CONTACT = '毛家威';

/** 与出库导出、对账单模版一致的收款信息（静态） */
const RECEIVER_ACCOUNT_TEXT =
  '达安数智收款账户信息：\n名称：北京达安数智科技有限公司      \n开户行：中国农业银行北京龙潭支行\n账号：11200501040045051';

const COL_COUNT = 9;

function padRow(
  cols: (string | number)[],
  len = COL_COUNT,
): (string | number)[] {
  const r = [...cols];
  while (r.length < len) r.push('');
  return r;
}

/**
 * 按「易达安对账单」样式生成 xlsx（与模版行列结构一致：标题、购销方、明细表、合计、账户信息）
 */
export function buildOutboundInvoiceWorkbook(
  records: OutboundRecordItem[],
  opts: {
    /** 如 2026年3月 */
    billMonthLabel: string;
    /** 购货方（门店/公司）展示名 */
    buyerDisplayName: string;
    /** 对账日期展示，如 2026-4-10 */
    reconciliationDate: string;
    /** 含税单价，用于计算含税总计；为 0 时价格列留空 */
    unitPrice: number;
  },
): XLSX.WorkBook {
  const { billMonthLabel, buyerDisplayName, reconciliationDate, unitPrice } =
    opts;

  const title = `${billMonthLabel}对账单`;
  const rows: (string | number)[][] = [];

  rows.push(padRow([title]));
  rows.push(padRow([]));
  rows.push(
    padRow(['销售方：', SELLER_NAME, '', '', '购货方：', buyerDisplayName]),
  );
  rows.push(padRow(['联系人：', SELLER_CONTACT, '', '', '联系人：', '']));
  rows.push(padRow(['', '', '', '', '', `对账时间：${reconciliationDate}`]));
  rows.push(
    padRow([
      '交货批次',
      '交货日期',
      '物料编号',
      '物料描述',
      '规格描述',
      '交货数量',
      '含税价格',
      '含税总计',
      '备注',
    ]),
  );

  let lineNo = 1;
  let totalQty = 0;
  let totalAmount = 0;

  for (const r of records) {
    const dt = dayjs(r.modify_time || r.create_time);
    const dateStr = dt.isValid() ? dt.format('YYYY.MM.DD') : '';
    const qty = Number(r.quantity) || 0;
    const price = unitPrice > 0 ? unitPrice : '';
    const lineAmount =
      unitPrice > 0 ? Math.round(qty * unitPrice * 100) / 100 : '';
    totalQty += qty;
    if (unitPrice > 0) totalAmount += qty * unitPrice;

    rows.push(
      padRow([
        lineNo,
        dateStr,
        r.device_type || '',
        '通用型成品（含卡）',
        r.device_type || '',
        qty,
        price,
        lineAmount,
        r.extra || '',
      ]),
    );
    lineNo += 1;
  }

  const roundedTotal = unitPrice > 0 ? Math.round(totalAmount * 100) / 100 : '';

  rows.push(
    padRow([
      `${billMonthLabel}交货合计`,
      '',
      '',
      '',
      '',
      totalQty,
      '',
      roundedTotal,
      '',
    ]),
  );
  rows.push(padRow([`${billMonthLabel}已收款`, '', '', '', '', '', '', 0, '']));
  rows.push(
    padRow([
      `截止${billMonthLabel}末应收货款`,
      '',
      '',
      '',
      '',
      '',
      '',
      unitPrice > 0 ? roundedTotal : 0,
      '',
    ]),
  );
  rows.push(padRow([RECEIVER_ACCOUNT_TEXT]));
  rows.push(
    padRow(['销售方签字盖章确认：', '', '', '', '购货方签字盖章确认：']),
  );

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } },
    {
      s: { r: rows.length - 2, c: 0 },
      e: { r: rows.length - 2, c: COL_COUNT - 1 },
    },
  ];

  const titleCellStyle = {
    alignment: {
      horizontal: 'center' as const,
      vertical: 'center' as const,
      wrapText: true,
    },
    font: {
      name: '微软雅黑',
      sz: 20,
      bold: true,
    },
  };
  if (ws.A1) {
    ws.A1.s = titleCellStyle;
  }

  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 36 };

  if (!ws['!cols']) ws['!cols'] = [];
  const widths = [14, 12, 14, 22, 18, 10, 10, 12, 14];
  widths.forEach((wch, i) => {
    ws['!cols']![i] = { wch };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '对账单');
  return wb;
}
