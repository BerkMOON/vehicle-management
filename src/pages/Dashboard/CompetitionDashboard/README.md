# 易达安双月竞赛数据看板

## 架构（二期）

- **前端**：Excel 解析、文件名匹配、排名 UI、导出
- **后端**：`incident-detection-platform` `/api/admin/competition/*`
- **设计文档**：[`docs/COMPETITION_DASHBOARD_BACKEND.md`](../../../docs/COMPETITION_DASHBOARD_BACKEND.md)

## 已实现能力

| 模块       | 说明                               |
| ---------- | ---------------------------------- |
| 文件上传   | 解析 xlsx → POST 新车/售后行到后端 |
| 回传监控   | `GET /return-status`               |
| 指标排名   | `GET /metrics`，含日期范围筛选     |
| 行数据明细 | 分页查询已入库 VIN                 |
| 待处理文件 | 文件名无法识别时本机暂存           |

## 本地仍使用的存储

- 竞赛配置、待处理文件、解析错误、上传记录摘要（localStorage）
- 车辆行与指标 **已迁至后端**

## API 客户端

`src/services/competitionDashboard/index.ts`
