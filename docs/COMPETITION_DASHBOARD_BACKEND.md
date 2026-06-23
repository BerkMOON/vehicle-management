# 易达安双月竞赛看板 — 后端化设计方案（精简版）

| 项目     | 内容                                        |
| -------- | ------------------------------------------- |
| 版本     | v2.1（精简）                                |
| 日期     | 2026-05-29                                  |
| 状态     | **已实现**（v2.1）                          |
| 前端仓库 | vehicle-management `/dashboard/competition` |
| 后端仓库 | incident-detection-platform（建议新增模块） |
| 竞赛期   | 2026-06-01 ~ 2026-07-31                     |

---

## 1. 设计摘要

| 项         | 决策                                              |
| ---------- | ------------------------------------------------- |
| Excel 解析 | **仅前端**，后端不接收 xlsx、不存原始文件         |
| 持久化     | **仅 2 张业务表**：新车安装表、售后安装表         |
| 上传记录   | **不做**（不存文件名、上传人、批次）              |
| 指标快照   | **不做**，每次请求时现算                          |
| 指标计算   | **后端** `GET /metrics`，读两表 + 已有绑定/检测表 |
| 解析失败   | **仅前端展示**，不入库                            |

---

## 2. 背景与目标

### 2.1 现状（一期）

竞赛看板在 **vehicle-management** 纯前端实现：Excel 解析、IndexedDB 存车辆行、localStorage 存配置，指标在 `utils/metrics.ts` 计算，分子来自前端直连设备绑定 / 入厂检测 API。

**局限：** 数据不能共享、浏览器存储有容量上限、指标口径在前端。

### 2.2 二期目标

- 前端继续洗 Excel，提交 **JSON 行数据** 给后端
- 后端 **只存业务行**（新车表、售后表各一张）
- **请求指标时再计算**，不预存计算结果
- 多管理员共用同一份竞赛数据

### 2.3 核心原则

1. 后端 **不解析 Excel**，不保存上传文件及上传行为
2. 替换规则：同 `(store_id, business_date)` **整批覆盖**；不同日期 **累加**
3. 指标公式与现 `metrics.ts` 一致（见 §7）
4. 门店统一用后台 **`store_id`**（`tb_store.id`），与绑定表、入厂日志一致，不再维护两套 ID

---

## 3. 总体架构

```
┌──────────────────────────────────────────────────────────────┐
│  vehicle-management 前端                                      │
│  xlsx → excelParser / fileNameParser → POST JSON（有效行）    │
│  解析失败 → 仅前端提示，不提交后端                             │
│  GET /metrics、/return-status → 展示排名与催报                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  incident-detection-platform                                  │
│  ┌────────────────────┐  ┌────────────────────┐              │
│  │ tb_competition_    │  │ tb_competition_    │              │
│  │ new_car_row        │  │ after_sales_row    │              │
│  └─────────┬──────────┘  └─────────┬──────────┘              │
│            └──────────┬─────────────┘                          │
│                       ▼                                        │
│              MetricsService（请求时计算）                       │
│                       ▲                                        │
│            已有：设备绑定表、入厂检测日志                        │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 职责划分

| 层级 | 职责 |
| --- | --- |
| **前端** | Excel 解析、VIN/日期清洗、文件名匹配、解析错误展示、排名 UI、导出 Excel |
| **后端** | 接收 JSON、按日期替换入库、绑定/检测查询、三项率计算 |
| **不做** | 上传批次、快照、原始文件、解析错误持久化 |

---

## 4. 数据流

### 4.1 写入（前端洗数 → 后端落库）

```
1. 用户选择 xlsx
2. 前端 parseExcelFile() → rows[]；errors[] 仅留在前端
3. 前端 parseFileName() + 门店映射 → **store_id**、表类型（新车 / 售后）
4. 前端按文件涉及的业务日期范围查询后端已有行，跳过已入库的 (business_date, vin)
5. POST /new-car/rows 或 POST /after-sales/rows（JSON，仅新增行）
6. 后端 BATCH INSERT append；`(store_id, business_date, vin)` 冲突时更新 `installed_flag` / `remark`
7. 返回 { replaced_dates, inserted_count }
```

**不记录：** 文件名、上传人、上传时间、batch_id。

### 4.2 指标查询（请求时计算）

```
1. 前端选择 [start_date, end_date]
2. GET /metrics?start_date=&end_date=
3. 后端：
   a. 从新车表 / 售后表按 store + business_date 范围取行 → 分母
   b. 从绑定表、入厂日志按 store + 日期范围取数据 → 分子
   c. 内存聚合（Go 版 metrics.ts）
4. 返回各店 StoreMetrics + calculated_at
```

每次请求都重算，**不读不写快照表**。

### 4.3 回传监控（单日）

```
GET /return-status?date=2026-06-17
```

各门店在该 `date` 是否 **存在行数据**（不依赖上传记录表）：

| 字段         | 判定                                                         |
| ------------ | ------------------------------------------------------------ |
| 新车表已回传 | `new_car_row` 存在 `store_id + business_date=date` 至少 1 行 |
| 售后表已回传 | `after_sales_row` 存在同上                                   |

响应可含 `row_count`（该日行数），**不含** uploaded_at / uploaded_by / file_name。

---

## 5. 数据库设计（仅 2 张表）

### 5.0 字段说明

| 字段 | 是否入库 | 说明 |
| --- | --- | --- |
| **store_id** | ✅ | 后台门店主键（`tb_store.id`）。前端由文件名匹配竞赛门店后，再映射为 `store_id` 提交；与设备绑定、入厂检测同 ID，指标分子可直接 join |
| **business_date** | ✅ | Excel 行内业务日期（销售日 / 进店日），指标分母按此日期筛选 |
| **vin** | ✅ | 车架号，17 位 |
| **installed_flag** | ✅ 两表均有 | Excel「是否安装/加装易达安记录仪」原文；**售后渗透率分母**仅售后表使用该字段 |
| **remark** | ✅ 两表均有 | Excel「备注」列原文，入库备查，**不参与指标计算** |
| ~~season_code~~ | ❌ | 届次编码（如 `2026-H1`），用于多届数据隔离；**本期只有一届竞赛，不需要**，用竞赛期配置 + `business_date` 范围即可 |
| ~~plate_no~~ | ❌ | Excel 里的**车牌号**列；指标不算车牌，**本期不入库**（若以后要展示再加） |
| ~~repair_type~~ | ❌ | 详细版 sheet 维修类型（保养/维修/事故）；**本期不入库** |
| ~~competition_store_id~~ | ❌ | 前端 constants 里的字符串 ID（如 `beijing-lincoln-1`），**合并进 store_id，不再单独存** |
| ~~backend_store_id~~ | ❌ | 与 store_id 重复，**去掉** |

### 5.1 新车安装表

```sql
CREATE TABLE tb_competition_new_car_row (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id        BIGINT        NOT NULL COMMENT '后台门店 ID，tb_store.id',
  business_date   DATE          NOT NULL COMMENT '业务日期（Excel 行内日期）',
  vin             CHAR(17)      NOT NULL,
  installed_flag  VARCHAR(32)   NULL COMMENT '是否安装易达安记录仪（原文）',
  remark          VARCHAR(255)  NULL COMMENT '备注',
  ctime           DATETIME      NOT NULL,
  mtime           DATETIME      NOT NULL,
  UNIQUE KEY uk_row (store_id, business_date, vin),
  INDEX idx_store_date (store_id, business_date)
);
```

### 5.2 售后安装表

```sql
CREATE TABLE tb_competition_after_sales_row (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id        BIGINT        NOT NULL COMMENT '后台门店 ID，tb_store.id',
  business_date   DATE          NOT NULL,
  vin             CHAR(17)      NOT NULL,
  installed_flag  VARCHAR(32)   NULL COMMENT '是否加装易达安记录仪（原文）',
  remark          VARCHAR(255)  NULL COMMENT '备注',
  ctime           DATETIME      NOT NULL,
  mtime           DATETIME      NOT NULL,
  UNIQUE KEY uk_row (store_id, business_date, vin),
  INDEX idx_store_date (store_id, business_date)
);
```

### 5.3 替换与累加规则

| 场景 | 行为 |
| --- | --- |
| 北京林肯一 6/17 新车表再次上传 | 追加新 VIN；同 `(store_id, business_date, vin)` 已存在则更新安装标记/备注 |
| 北京林肯一 6/17 + 6/18 各传一次 | 两日行并存，**累加** |
| 6/17 与 6/18 有相同 VIN | 指标按日期范围 VIN **去重** 后计数 |

### 5.4 刻意不建的表

| 表                                | 原因                   |
| --------------------------------- | ---------------------- |
| `tb_competition_upload_batch`     | 不记录上传行为         |
| `tb_competition_metrics_snapshot` | 请求时现算，无需快照   |
| `tb_competition_parse_error`      | 解析失败仅前端展示     |
| `tb_competition_vehicle_row`      | 用两张业务表替代通用表 |

竞赛配置、门店名单可继续放前端 `constants.ts` 或后端配置文件，**不强制建表**。

---

## 6. API 设计

前缀：`/api/admin/competition`

### 6.1 配置（可选）

| 方法 | 路径      | 说明                                            |
| ---- | --------- | ----------------------------------------------- |
| GET  | `/config` | 竞赛期、三项目标值（可与现前端 constants 对齐） |

门店名单与「文件名 → store_id」映射仍可在前端 `constants.ts` + `storeIdMap.ts` 维护；**入库与算指标只认 store_id**。

### 6.2 写入行数据（核心）

**新车：**

```
POST /new-car/rows
Content-Type: application/json
```

**售后：**

```
POST /after-sales/rows
Content-Type: application/json
```

**请求体示例：**

新车 `POST /new-car/rows`：

```json
{
  "store_id": 10086,
  "rows": [
    {
      "business_date": "2026-06-17",
      "vin": "LSVAA4182E2123456",
      "installed_flag": "是",
      "remark": "已现场安装"
    }
  ]
}
```

售后 `POST /after-sales/rows`：

```json
{
  "store_id": 10086,
  "rows": [
    {
      "business_date": "2026-06-17",
      "vin": "LSVAA4182E2123456",
      "installed_flag": "否",
      "remark": "客户拒绝"
    }
  ]
}
```

`installed_flag`、`remark` 均为可选；无对应 Excel 列时可省略或传 `null`。

**响应：**

```json
{
  "replaced_dates": ["2026-06-17"],
  "inserted_count": 120
}
```

**后端校验：**

| 项            | 规则               |
| ------------- | ------------------ |
| VIN           | 17 位合法字符      |
| business_date | 落在竞赛期内       |
| store_id      | 合法后台门店 ID    |
| rows 条数     | 单次上限建议 20000 |

**不提供：** `GET /uploads`、multipart 上传、errors 入库接口。

前端批量选多个文件时，**逐文件解析、逐次 POST** 即可。

### 6.3 行数据查询（前端展示）

分页查询已入库的新车 / 售后行，供看板明细 Tab、对账、按店按日核对 VIN 使用。

**新车：**

```
GET /new-car/rows
```

**售后：**

```
GET /after-sales/rows
```

**Query 参数：**

| 参数            | 必填 | 说明                                           |
| --------------- | ---- | ---------------------------------------------- |
| `store_id`      | 否   | 后台门店 ID；不传则查全部（需权限允许）        |
| `start_date`    | 否   | 业务日期起（含），`YYYY-MM-DD`                 |
| `end_date`      | 否   | 业务日期止（含）                               |
| `business_date` | 否   | 精确某一天；与起止日期同时传时，以精确日期为准 |
| `vin`           | 否   | 车架号，支持完整 17 位或前缀模糊               |
| `page`          | 否   | 页码，默认 `1`                                 |
| `limit`         | 否   | 每页条数，默认 `20`，最大 `200`                |

**响应结构（两接口一致，字段略有差异）：**

```json
{
  "meta": {
    "total_count": 120,
    "total_page": 6
  },
  "list": [
    {
      "id": 1001,
      "store_id": 10086,
      "store_name": "北京林肯一",
      "business_date": "2026-06-17",
      "vin": "LSVAA4182E2123456",
      "installed_flag": "是",
      "remark": "已现场安装",
      "ctime": "2026-06-18 10:00:00",
      "mtime": "2026-06-18 10:00:00"
    }
  ]
}
```

| 字段             | 新车 | 售后 |
| ---------------- | ---- | ---- |
| `installed_flag` | ✅   | ✅   |
| `remark`         | ✅   | ✅   |

- `store_name`：后端 join `tb_external_store.name` 返回，便于表格展示，**非表字段**
- 默认排序：`business_date DESC, id DESC`
- 仅返回有效行；不做软删

**前端典型用法：**

| 场景               | 参数                                   |
| ------------------ | -------------------------------------- |
| 某店某日明细       | `store_id` + `business_date`           |
| 竞赛期某店汇总核对 | `store_id` + `start_date` + `end_date` |
| 按 VIN 搜全库      | `vin` + 分页                           |

**与指标接口关系：**

- `GET /metrics`：聚合后的分子分母、三项率
- `GET /new-car/rows`、`GET /after-sales/rows`：**原始行级**数据，用于表格展示与导出明细

### 6.4 指标（请求时计算）

```
GET /metrics?start_date=2026-06-01&end_date=2026-06-18
```

**响应（对齐现 `StoreMetrics[]`）：**

```json
{
  "list": [
    {
      "store_id": 10086,
      "store_name": "北京林肯一",
      "brand": "lincoln",
      "new_car_sales": 87,
      "entry_total": 120,
      "entry_not_installed_excel": 45,
      "new_bindings": 65,
      "entry_new_bindings": 30,
      "inspected_count": 98,
      "comprehensive_ratio": 0.747126,
      "inspection_coverage_ratio": 0.816667,
      "after_sales_ratio": 0.666667,
      "comprehensive_ok": true,
      "inspection_coverage_ok": true,
      "after_sales_ok": false
    }
  ],
  "date_range": {
    "start_date": "2026-06-01",
    "end_date": "2026-06-18"
  },
  "calculated_at": "2026-06-18 15:30:00"
}
```

绑定、检测由后端内部查询，**前端不再**逐店调 `DeviceAPI` / `EntryCheckAPI`。

不提供 `POST /metrics/recalculate`（无快照可刷）。

### 6.5 回传监控

```
GET /return-status?date=2026-06-17
```

```json
{
  "list": [
    {
      "store_id": 10086,
      "store_name": "北京林肯一",
      "brand": "lincoln",
      "new_car": { "uploaded": true, "row_count": 45 },
      "entry_check": { "uploaded": false, "row_count": 0 },
      "completed": false
    }
  ]
}
```

### 6.6 导出

排名 Excel 继续由 **前端** `export.ts` 生成（基于 `GET /metrics` 结果）。服务端导出 API 非必须。

### 6.7 权限（建议）

按角色限制：可见门店、是否可写入行数据、是否可查 metrics。

---

## 7. 指标计算公式

与 `src/pages/Dashboard/CompetitionDashboard/utils/metrics.ts` **一致**。

统计区间：`start_date` ~ `end_date`（**endDate 整天计入**，见下表）。

#### 日期边界（避免 endDate 只算到零点）

| 数据源 | 字段 | SQL / 逻辑 | endDate 是否含整天 |
| --- | --- | --- | --- |
| 新车 / 售后 Excel | `business_date`（DATE） | `>= start_date AND <= end_date` | ✅ |
| 设备绑定 | `bind_time`（DATETIME） | `>= start 00:00:00 AND < endDate+1 00:00:00` | ✅ |
| 入厂检测 | `ctime`（DATETIME） | `>= start 00:00:00 AND < endDate+1 00:00:00` | ✅ |
| 内存二次过滤 | 格式化为 `YYYY-MM-DD` | `date >= start AND date <= end` | ✅ |

与 `device/business/list` 手工对账时，`bind_end_time` 请传 **`endDate 23:59:59`**（该接口为 `<=` 闭区间）；勿传 `endDate 00:00:00`，否则不含 endDate 当天。

### 7.1 分母（来自两张业务表）

| 字段 | 来源 |
| --- | --- |
| `new_car_sales` | 新车表，范围内 VIN 去重 |
| `entry_total` | 售后表，范围内 VIN 去重 |
| `entry_not_installed_excel` | 售后表，`installed_flag` 为否/未/无 的 VIN 去重 |

### 7.2 分子（已有绑定 / 检测表）

| 字段 | 计算 |
| --- | --- |
| `new_bindings` | 统计期内该门店绑定记录总数（与 `device/business/list` 按 `store_id` + `bind_time` 范围的 `total_count` 一致） |
| `inspected_count` | 范围内有照片检测 VIN ∩ 范围内售后 VIN |
| `entry_new_bindings` | 范围内绑定 VIN ∩ 范围内售后 VIN |

### 7.3 三项率

| 指标           | 公式                                             |
| -------------- | ------------------------------------------------ |
| 综合渗透率     | `new_bindings / new_car_sales`                   |
| 入厂检测覆盖率 | `inspected_count / entry_total`                  |
| 售后渗透率     | `entry_new_bindings / entry_not_installed_excel` |

比率为小数；分母为 0 时比率为 0；综合渗透率可大于 1。

---

## 8. 性能说明（请求时计算会不会慢？）

**当前规模下通常不会。**

| 因素     | 量级                       |
| -------- | -------------------------- |
| 门店     | ~25                        |
| 单店单行 | 常见数百～数千，大单 ~5500 |
| 竞赛期   | ~2 个月                    |

单次 `GET /metrics` 大致：两表按索引范围查询 + 25 店绑定/检测查询（可并行）+ 内存 VIN 聚合。**预期数百毫秒～ 2 秒**。

**需保证：**

- `(store_id, business_date)` 索引
- 绑定、检测查询带 `store_id + 日期` 条件与索引

**若以后变慢，再考虑：** Redis 短 TTL 缓存（key = 日期范围），**仍不必建快照表**。

---

## 9. 与一期前端能力差异

| 能力 | 一期 | 二期（本文） |
| --- | --- | --- |
| 上传记录列表 | 有 | **无**（产品接受） |
| 上传人 / 文件名 | 有 | **无** |
| 解析失败历史 | localStorage | **仅当次前端展示** |
| 异常对账列表 | 前端 detectAnomalies | 可选二期：`GET /metrics` 时顺带算或单独接口 |
| 指标日期范围 | 有 | 有 |
| 待处理文件 | 前端 base64 暂存 | 仍仅前端，补全门店后 POST rows |

---

## 10. 后端模块（已实现）

```
internal/
  service/competition.go
  dal/data/competition_new_car_dao.go
  dal/data/competition_after_sales_dao.go
  api/httphandler/competition.go
table/
  tb_competition_new_car_row.sql
  tb_competition_after_sales_row.sql
```

路由前缀：`/api/admin/competition`（见 `cmd/router.go`）

---

## 11. 前端改造（已完成 Phase 2）

- 上传：解析后 `POST /new-car/rows` 或 `/after-sales/rows`
- 指标：`GET /metrics?start_date=&end_date=`
- 回传：`GET /return-status?date=`
- 行数据：新增「行数据明细」Tab，调用 GET rows 接口
- 待处理文件仍存本机；上传记录仅作本次会话参考，车辆行不再写 IndexedDB

### 关键文件

| 文件                                 | 说明                         |
| ------------------------------------ | ---------------------------- |
| `src/services/competitionDashboard/` | API 客户端                   |
| `services/competitionService.ts`     | 上传 / 指标 / 回传编排       |
| `utils/apiAdapter.ts`                | 后端响应 → 前端 StoreMetrics |
| `components/RowDataPanel.tsx`        | 行数据分页查询               |

---

## 12. 部署清单

| 步骤 | 说明 |
| --- | --- |
| 1 | 在 MySQL 执行 `table/tb_competition_new_car_row.sql`、`tb_competition_after_sales_row.sql` |
| 2 | 部署 incident-detection-platform（含 wire 生成的依赖注入） |
| 3 | 在权限系统为相关角色勾选「竞赛看板」模块 endpoint |
| 4 | 部署 vehicle-management 前端 |
| 5 | 确认竞赛门店名称与后台 `tb_external_store.name` 可匹配（`storeIdMap.ts`） |

---

## 13. 参考

| 文档 / 代码                              | 说明                          |
| ---------------------------------------- | ----------------------------- |
| `prd.md`                                 | 业务口径                      |
| `utils/metrics.ts`                       | 指标计算权威实现（Go 应对齐） |
| `constants.ts`                           | 门店与竞赛期                  |
| `services/competitionDashboard/index.ts` | API 客户端                    |
| `internal/service/competition.go`        | 后端指标与写入实现            |

---

## 14. 待确认项

| # | 问题 | 状态 |
| --- | --- | --- |
| 1 | 上传记录 Tab 是否下线 | 已弱化为本地上传摘要 |
| 2 | 异常对账是否二期做 | 暂保留 Tab，后端未实现 anomaly API |
| 3 | 前端是否解析「备注」列 | **已实现** |
| 4 | 售后渗透率分子是否要求绑定日 ≥ 进店日 | 与现前端一致：暂不要求 |
