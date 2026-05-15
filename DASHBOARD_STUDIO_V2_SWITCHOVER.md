# 全量切换：新建/编辑/预览统一到 DashboardStudioPageV2

本文档描述如何将“仪表盘”模块从 DashboardPage 内的弹框式新建/编辑流程，**全量切换**为使用页面式 Studio 编辑器 [DashboardStudioPageV2.tsx](file:///Users/rxy/原型/C/src/pages/DashboardStudioPageV2.tsx) 完成新建、编辑与预览。

## 目标态

- 新建入口：`/dashboard` → 点击“新建” → `GET /dashboard/studio/new` → StudioV2 完成配置与保存
- 编辑入口：列表行“编辑” → `GET /dashboard/studio/:id` → StudioV2 编辑并保存
- 预览入口：列表行“预览/查看” → `GET /dashboard/studio/:id/preview` → StudioV2 只读预览
- 数据源统一：仪表盘列表与管理动作统一基于 `useDashboardsStore`（zustand persist），不再使用 DashboardPage 的本地 `useState` 列表

## 现状问题（切换动机）

- DashboardPage 当前用本地 state 维护 `customDashboards`，刷新/跨页面不共享，且与 `useDashboardsStore` 脱节
- StudioV2 已实现保存写入 `useDashboardsStore.addItem/updateItem`，但列表页不读 store 会导致“保存后列表看不到/刷新丢失”的体验问题
- 新建/编辑分散在 DashboardPage 的两套弹框逻辑中，配置模型与校验能力弱于 StudioV2，维护成本高

## 改动范围（全量切换包含哪些）

### 1) 路由接入 StudioV2

在 [App.tsx](file:///Users/rxy/原型/C/src/App.tsx) 新增路由：

- `/dashboard/studio/new` → `<DashboardStudioPageV2 mode="new" />`
- `/dashboard/studio/:id` → `<DashboardStudioPageV2 mode="edit" />`
- `/dashboard/studio/:id/preview` → `<DashboardStudioPageV2 mode="preview" />`

说明：
- `DashboardStudioPageV2` 内部使用 `useParams().id` 回填数据并按 mode 控制只读/交互。

### 2) DashboardPage 列表数据源切到 store

在 [dashboardsStore.ts](file:///Users/rxy/原型/C/src/store/dashboardsStore.ts) 已提供：
- `items`（自定义仪表盘列表）
- `addItem/updateItem/removeItem`
- `touchUpdatedAt()`、`createDashboardId()`

DashboardPage 全量切换后：
- 列表渲染改为使用 `useDashboardsStore((s) => s.items)`
- 发布/下线、删除等动作改为调用 `updateItem/removeItem`

### 3) DashboardPage 行操作跳转到 StudioV2

DashboardPage 仅保留“列表与管理”：

- 顶部“新建”按钮：跳转到 `/dashboard/studio/new`
- 行“编辑”：跳转到 `/dashboard/studio/:id`
- 行“预览/查看”：跳转到 `/dashboard/studio/:id/preview`

### 4) 移除 DashboardPage 的两套弹框（新建/编辑）

从 [DashboardPage.tsx](file:///Users/rxy/原型/C/src/pages/DashboardPage.tsx) 删除：
- 新建弹框：`createOpen/createStep/cfg*` 相关 state 与 `<Modal open={createOpen}>...`
- 编辑弹框：`editOpen/editStep/edit*` 相关 state 与 `<Modal open={editOpen}>...`

目的：
- 避免功能重复与数据模型分叉
- 使 StudioV2 成为唯一编辑器

## 验收标准

- 从 `/dashboard` 点击“新建”进入 StudioV2，新建并保存后返回列表可见，刷新不丢
- 列表点击“编辑”进入 StudioV2，保存后列表字段（title/updatedAt）正确更新
- 列表点击“预览/查看”进入 StudioV2 预览模式，界面只读（无拖拽/删除/保存）
- 列表发布/下线、删除等管理动作仍可用，且持久化生效

