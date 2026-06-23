import { Brand, CompetitionConfig, CompetitionStore } from './types';

export const BRAND_LABEL: Record<Brand, string> = {
  audi: '奥迪',
  lincoln: '林肯',
  hongqi: '红旗',
};

export const TABLE_TYPE_LABEL = {
  new_car: '新车表',
  entry_check: '入厂检测表',
} as const;

const BASE_STORES: Omit<CompetitionStore, 'aliases'>[] = [
  { id: 'yibin-aojitong', name: '宜宾奥迪', brand: 'audi', active: true },
  { id: 'chengdu-aodatong', name: '成都奥迪', brand: 'audi', active: true },
  { id: 'zhejiang-aodatong', name: '杭州奥迪', brand: 'audi', active: true },
  { id: 'beijing-aojitong', name: '北京奥迪一', brand: 'audi', active: true },
  { id: 'wuxi-aotong', name: '无锡奥迪', brand: 'audi', active: true },
  { id: 'hebei-aojitong', name: '河北奥吉通', brand: 'audi', active: true },
  { id: 'zhengzhou-audi', name: '郑州奥迪', brand: 'audi', active: true },
  { id: 'beijing-guomen', name: '北京奥迪二', brand: 'audi', active: true },
  {
    id: 'beijing-lincoln-1',
    name: '北京林肯一',
    brand: 'lincoln',
    active: true,
  },
  {
    id: 'beijing-lincoln-2',
    name: '北京林肯二',
    brand: 'lincoln',
    active: true,
  },
  { id: 'changchun-lincoln', name: '长春林肯', brand: 'lincoln', active: true },
  {
    id: 'shijiazhuang-lincoln',
    name: '石家庄林肯',
    brand: 'lincoln',
    active: true,
  },
  {
    id: 'shijiazhuang-landrover',
    name: '石家庄路虎',
    brand: 'lincoln',
    active: true,
  },
  {
    id: 'zhengzhou-lincoln-1',
    name: '郑州林肯一',
    brand: 'lincoln',
    active: true,
  },
  {
    id: 'zhengzhou-lincoln-2',
    name: '郑州林肯二',
    brand: 'lincoln',
    active: true,
  },
  { id: 'kunming-lincoln', name: '昆明林肯', brand: 'lincoln', active: true },
  { id: 'chengdu-lincoln', name: '成都林肯', brand: 'lincoln', active: true },
  { id: 'luoyang-lincoln', name: '洛阳林肯', brand: 'lincoln', active: true },
  { id: 'shenzhen-hongqi', name: '深圳红旗', brand: 'hongqi', active: true },
  { id: 'hefei-hongqi', name: '合肥红旗', brand: 'hongqi', active: true },
  { id: 'wuxi-hongqi', name: '无锡红旗', brand: 'hongqi', active: true },
  { id: 'tianjin-hongqi', name: '天津红旗', brand: 'hongqi', active: true },
  { id: 'beijing-hongqi', name: '北京红旗', brand: 'hongqi', active: true },
  { id: 'yantai-hongqi', name: '烟台红旗', brand: 'hongqi', active: true },
  { id: 'beijing-toyota', name: '北京丰田', brand: 'hongqi', active: true },
];

/** 文件名/后台门店名 → 竞赛门店简称 的别名（key 为 constants 中 store.name） */
export const STORE_FILE_ALIASES: Record<string, string[]> = {
  宜宾奥迪: ['宜宾奥吉通', '宜宾奥吉通店', '宜宾奥迪店'],
  成都奥迪: ['成都奥达通', '成都奥迪店'],
  杭州奥迪: ['浙江奥达通', '杭州奥迪店'],
  // 「北京奥吉通」单独出现时默认指奥迪店；含「林肯」时由品牌过滤排除奥迪
  北京奥迪一: ['北京奥吉通', '北京奥吉通店', '北京奥迪1', '北京奥迪1店'],
  无锡奥迪: ['无锡奥通', '无锡奥迪店'],
  河北奥吉通: ['石家庄奥迪', '河北奥迪'],
  郑州奥迪: ['郑州奥迪店'],
  北京奥迪二: [
    '北京国门',
    '奥吉通国门',
    '奥吉通国门店',
    '北京奥迪二店',
    '北京国门奥迪',
    '北京奥迪2',
    '北京奥迪2店',
  ],
  北京林肯一: [
    '北京林肯1',
    '北京奥吉通林肯1',
    '北京奥吉通林肯1店',
    '北京奥吉通林肯一',
    '北京奥吉通林肯一店',
  ],
  北京林肯二: ['北京林肯2', '北京奥吉通林肯2', '北京奥吉通林肯2店'],
  郑州林肯一: ['郑州林肯1'],
  郑州林肯二: ['郑州林肯2'],
};

export const DEFAULT_COMPETITION_CONFIG: CompetitionConfig = {
  startDate: '2026-06-01',
  endDate: '2026-07-31',
  targets: {
    comprehensive: 0.65,
    inspectionCoverage: 0.9,
    afterSales: 0.85,
  },
  autoRefreshMinutes: 15,
  stores: BASE_STORES.map((store) => ({
    ...store,
    aliases: STORE_FILE_ALIASES[store.name] || [],
  })),
};

export const STORAGE_KEYS = {
  config: 'competition_dashboard_config',
  vehicleRows: 'competition_dashboard_vehicle_rows',
  uploadRecords: 'competition_dashboard_upload_records',
  pendingFiles: 'competition_dashboard_pending_files',
  anomalies: 'competition_dashboard_anomalies',
  metricsSnapshot: 'competition_dashboard_metrics_snapshot',
  parseErrors: 'competition_dashboard_parse_errors',
} as const;

export const MAX_PARSE_ERROR_ROWS = 500;
