import * as XLSX from 'xlsx';
import { StoreMetrics, StoreReturnStatus } from '../types';
import {
  RankingTableConfig,
  RankingTableKind,
  RankingTableRow,
  buildRankingTableRows,
  getRankingTableConfig,
} from './rankingTable';

function rowsToAoA(config: RankingTableConfig, rows: RankingTableRow[]) {
  const aoa: (string | number | null)[][] = [
    [config.title, '', '', ''],
    ['', config.denominatorLabel, config.numeratorLabel, config.ratioLabel],
  ];

  rows.forEach((row) => {
    aoa.push([
      row.label,
      row.denominator ?? '',
      row.numerator ?? '',
      row.ratio ?? '',
    ]);
  });

  return aoa;
}

export function exportRankingTableExcel(params: {
  metrics: StoreMetrics[];
  kind: RankingTableKind;
  startDate: string;
  endDate: string;
  fileName?: string;
}) {
  const { metrics, kind, startDate, endDate } = params;
  const config = getRankingTableConfig(kind, startDate, endDate);
  const rows = buildRankingTableRows(metrics, kind);
  const aoa = rowsToAoA(config, rows);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '排名');
  XLSX.writeFile(workbook, params.fileName || `${config.title}.xlsx`);
}

export function exportAllRankingTables(params: {
  metrics: StoreMetrics[];
  startDate: string;
  endDate: string;
}) {
  const kinds: RankingTableKind[] = [
    'comprehensive',
    'inspection',
    'afterSales',
  ];
  kinds.forEach((kind) => {
    exportRankingTableExcel({ ...params, kind });
  });
}

export function exportMissingReturnList(
  list: StoreReturnStatus[],
  date: string,
  fileName: string,
) {
  const missing = list.filter((item) => !item.completed);
  const sheetData = missing.map((item) => ({
    日期: date,
    门店: item.storeName,
    缺传内容: [
      !item.newCar.uploaded ? '新车表' : '',
      !item.entryCheck.uploaded ? '入厂检测表' : '',
    ]
      .filter(Boolean)
      .join('、'),
    新车表: item.newCar.uploaded ? '已回传' : '未回传',
    入厂检测表: item.entryCheck.uploaded ? '已回传' : '未回传',
  }));
  const sheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '未回传名单');
  XLSX.writeFile(workbook, fileName);
}

export function exportStoreDetail(metrics: StoreMetrics, fileName: string) {
  const sheetData = [
    { 指标: '新车销量', 值: metrics.newCarSales },
    { 指标: '记录仪加装量', 值: metrics.newBindings },
    { 指标: '综合渗透率', 值: metrics.comprehensiveRatio },
    { 指标: '售后入厂台次', 值: metrics.entryTotal },
    { 指标: '拍照完成入厂检测台次', 值: metrics.inspectedCount },
    { 指标: '入厂检测覆盖率', 值: metrics.inspectionCoverageRatio },
    { 指标: '售后入厂未装台次', 值: metrics.entryNotInstalledExcel },
    { 指标: '新增绑定重合台次', 值: metrics.entryNewBindings },
    { 指标: '售后渗透率', 值: metrics.afterSalesRatio },
  ];
  const sheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, metrics.storeName);
  XLSX.writeFile(workbook, fileName);
}
