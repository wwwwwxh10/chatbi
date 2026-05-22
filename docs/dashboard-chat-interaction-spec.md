# 左侧仪表盘 × 右侧对话联动：最终版交互规格

适用范围：
- 左侧：仪表盘卡片网格（含 debug studio/预览/工作区画布），卡片内可能包含 ECharts 图表或 KPI 等组件
- 右侧：对话窗口（用于“正在分析…/输出结果/追问”）

目标：
- 图表点击不崩溃、不黑屏
- 选中态全局唯一、可持久、可取消
- “数据点/数据块选中（L1）”与“卡片选中（L2）”严格解耦：L1 不得带动卡片边框高亮

---

## 1. 核心概念

### 1.1 交互层级
- L0：无选中
- L1：数据点/数据块/扇区/节点/边（统称 datum）选中
- L2：整卡（card）选中

### 1.2 全局唯一选中模型
全局在同一个 `selectionScope` 内，只允许存在 0 或 1 个 activeSelection：

```ts
type ActiveSelection =
  | null
  | {
      scope: string
      uid: string
      level: 'datum' | 'card' | 'dashboard'
      key: string
      payload:
        | { level: 'datum'; slotIdx: number; kind: string; seriesKey: string; datumKey: string }
        | { level: 'card'; slotIdx: number }
        | { level: 'dashboard'; dashboardKey: string }
    }
```

约束：
- 任意新的 selection（不论 L1/L2）都会覆盖旧 selection（旧 selection 必须清空并恢复默认状态）
- selection 的唯一性以 `scope` 为边界；不同 scope 互不影响
- selection 的持久性以“activeSelection 是否变化”为准；hover、tooltip、右侧对话消息更新、渲染重排都不应改变 activeSelection

---

## 2. 哪些图表支持哪些层级

### 2.1 支持 L1（datum）的图表
- line/line-area/line-curve：数据点（datum）
- bar 系列（bar/bar-h/bar-grouped/bar-stacked/bar-gradient/…）：柱/堆叠块（datum）
- scatter/bubble/effectScatter：点（datum）
- pie/donut/rose：扇区（datum）
- radar：系列面/线（datum，通常以 series 为单位）
- sankey：节点/边（datum）
- funnel/treemap/graph：默认按“图元”为 datum（如 builder 提供稳定 key）

### 2.2 仅支持 L2（card）的图表/组件
- gauge、kpi、flip 等“无明确 datum”组件：只支持卡片选中（L2）

---

## 3. 命中与触发规则（必须一致）

### 3.1 命中优先级（Hit-test Priority）
一次用户点击，优先级从高到低：
1) 命中图表图元（L1）
2) 命中卡片空白区域/标题栏（L2）
3) 其它区域（不改变 selection 或按“外部点击清空”规则处理）

判定细则：
- legend/axis/tooltip 浮层属于“图表控件区”，不触发 L2
- tooltip 浮层点击不应触发外部清空

### 3.2 阻止 L1 冒泡触发 L2（强约束）
- 图表容器必须在 capture 阶段 stopPropagation（mouse/pointer/touch）
- 卡片的 onClick 必须检测事件来源：若 `e.target.closest('[data-echart-root="1"]')` 为真，则直接 return

---

## 4. 选中效果定义（视觉）

### 4.1 L1（datum）选中效果
- 选中目标：高亮（由图表 builder 的 emphasis 或受控写入实现）
- 非选中同层：弱化（opacity 降低）
- 线图额外：选中点必须展示“脉冲层（pulse overlay）”并持续动画，直到取消/被覆盖

必须满足：
- 鼠标移出选中图元后，选中态仍保持
- 右侧对话返回结果/消息列表更新后，选中态仍保持

### 4.2 L2（card）选中效果
- 仅在用户点击“卡片空白区域/标题栏”等非图元区域时触发
- 卡片边框/阴影允许高亮（且仅对 L2 生效）
- L1 禁止改变卡片边框状态

---

## 5. 取消/重选/跨图表切换（状态机）

### 5.1 Toggle 取消（同一目标再次点击）
- L1：再次点击同一 datumKey => activeSelection 变为 null
- L2：再次点击同一卡片 => activeSelection 变为 null

### 5.2 同卡内重选
- L1：点击同卡另一 datum => 覆盖旧 datum（旧清空，新高亮）
- L2：点击卡片空白 => 覆盖 L1（或维持 L1，必须明确其一；推荐“卡片空白点击只切换 L2，不影响 L1”以减少误清）

### 5.3 跨卡重选（全局唯一）
- 任意新 selection（L1/L2）产生时，必须清空旧 selection（包括旧卡片边框、旧图元高亮、旧 pulse）

---

## 6. selectionKey 规范（避免 dataIndex 漂移）

### 6.1 datumKey（优先使用稳定键）
- axis 类（line/bar）：`xKey + seriesKey` 优先；次选 `dataIndex + seriesKey`
  - xKey：类目名称/时间字符串（来自 xAxis.data 或 params.name）
- pie/donut/rose：优先 `name`；次选 `dataIndex`
- scatter/bubble：优先 `name` 或业务 id；次选 `dataIndex`
- radar：优先 `seriesName`（按 series 选中）；次选 `seriesIndex`
- sankey：节点用 `nodeName`；边用 `source->target`

### 6.2 seriesKey（优先使用 series.id）
- 优先 `series.id`
- 否则 `seriesName`
- 否则 `seriesIndex`

---

## 7. 持久性与重放（Reapply）

### 7.1 何时必须重放选中态
任何可能导致 ECharts 内部状态重置的时机都必须重放：
- option 变化（setOption notMerge / 重新生成 option）
- resize
- theme 切换
- 数据刷新

### 7.2 重放行为
当 activeSelection 为 datum：
- 先对全图 `downplay`
- 再对目标 datum `highlight`
- 若是线图：启动 pulse overlay

当 activeSelection 为 card：
- 仅更新卡片 UI，不应向 ECharts 施加 highlight

---

## 8. 外部点击清空（Outside Click）

默认策略（推荐）：
- 点击“左侧画布空白区域”清空 activeSelection
- 点击右侧对话区（输入框、按钮、消息区、滚动条）不清空
- 点击 tooltip 浮层不清空

---

## 9. 异步分析一致性（防止回写覆盖）

当 L1/L2 触发右侧分析时：
- 每次触发生成 `analysisUid = activeSelection.uid`
- 分析完成回写 UI 时必须校验：仅当 `analysisUid === 当前 activeSelection.uid` 才允许把“锁定上下文/结果”写入为“当前展示”，否则丢弃或作为历史消息追加但不改变 activeSelection

---

## 10. 兼容性与可用性补充

- ESC 清空 activeSelection（不触发分析）
- 移动端：仅 tap（无移动阈值）触发选中；滚动不改变选中

