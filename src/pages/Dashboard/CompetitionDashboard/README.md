# 易达安双月竞赛数据看板 - 前后端分工

## 前端（vehicle-management / Dashboard/CompetitionDashboard）

已实现：

| 模块 | 说明 |
| --- | --- |
| 文件上传与解析 | 批量拖入 xlsx、文件名识别门店/表类型、详细版三 sheet 合并、VIN/日期清洗 |
| 数据合并规则 | 同门店同表类型同业务日期整体替换（PRD 7.1-6） |
| 待处理区 | 文件名无法匹配时人工指定门店与类型后入库 |
| 回传监控 | 按日期展示矩阵、进度统计、未回传高亮、导出未回传名单 |
| 指标计算 | 竞赛期内累计、三项率 + 达标标记（依赖后端分子数据） |
| 排名展示 | 奥迪/林肯/红旗分组排名、明细表排序、公示视图、导出 Excel |
| 异常与对账 | 解析失败、入厂/检测/绑定不一致列表，人工标记处理 |
| 可配置项 | 目标值、自动刷新间隔（localStorage，待后端配置接口） |

当前数据存储：浏览器 localStorage（`competition_dashboard_*`），便于联调前独立使用。

待后端接入后替换 `services/dataProvider.ts` 中：

- `fetchBackendBindings`
- `fetchBackendDetections`
- 上传记录 / 车辆行持久化 API

---

## 后端（incident-detection-platform 建议新增）

### 1. 配置管理

```
GET  /api/admin/competition/config
PUT  /api/admin/competition/config
```

字段：竞赛期、门店清单、品牌归属、别名、三项目标值、自动刷新间隔。

### 2. 文件上传与车辆行

```
POST /api/admin/competition/upload/batch        # multipart 多文件
GET  /api/admin/competition/upload/records
GET  /api/admin/competition/vehicle-rows        # 可按 store / date / table_type 过滤
POST /api/admin/competition/pending-files/resolve
```

服务端需实现 PRD 7.1-6 替换逻辑：按 `(store_id, table_type, business_date)` 批量 replace。

### 3. 回传监控

```
GET /api/admin/competition/return-status?date=2026-06-15
```

返回各门店新车表/入厂检测表是否已回传、上传时间、行数。

### 4. 后端原始数据（分子来源，PRD 11.2）

```
GET /api/admin/competition/bindings?store_id=&start_date=&end_date=
GET /api/admin/competition/detections?store_id=&start_date=&end_date=
```

绑定记录：`vin, bind_date, store_id, channel?, account_role?`

检测记录：`vin, detect_date, store_id, has_photo`

数据来源可对接现有设备绑定表、入场检测日志（`entry-inspection-log`）。

### 5. 指标与快照

```
GET  /api/admin/competition/metrics?refresh=true
POST /api/admin/competition/metrics/recalculate
```

返回各门店分子分母、三项率、计算时间戳；可选定时任务写快照表。

### 6. 异常与对账

```
GET  /api/admin/competition/anomalies
POST /api/admin/competition/anomalies/:id/resolve
```

### 7. 导出

```
GET /api/admin/competition/export/ranking
GET /api/admin/competition/export/missing-return?date=
GET /api/admin/competition/export/store-detail?store_id=&start=&end=
```

### 8. 权限

按角色控制：可见门店范围、是否可上传/配置/导出/查看 VIN 明细。

---

## 指标计算公式（与前端 utils/metrics.ts 一致）

- **新车销量分母** = 新车表竞赛期内 VIN 去重
- **全天入厂台数** = 入厂检测表 VIN 去重
- **入厂未安装车次** = 入厂 VIN 中，进店日前无有效绑定的数量
- **新增绑定分子** = 竞赛期内后端绑定 VIN 去重
- **入厂新增绑定** = 新增绑定中 VIN 在入厂表且绑定日期 ≥ 进店日
- **实检台数** = 有照片且 VIN 在入厂集合内的检测记录去重

三项率：

- 综合渗透率 = 新增绑定 / (新车销量 + 入厂未安装) × 100%（可 >100%）
- 入厂检测覆盖率 = 实检台数 / 全天入厂 × 100%
- 售后端渗透率 = 入厂新增绑定 / 入厂未安装 × 100%

---

## 竞赛期与门店

- 竞赛期：`2026-06-01` ~ `2026-07-31`
- 门店 25 家（附录 A），路虎归林肯、丰田归红旗
- 前端默认配置见 `constants.ts`
