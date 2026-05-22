# 交互规格对照走查（当前实现）

对照文档：[dashboard-chat-interaction-spec.md](file:///Users/rxy/原型/C/docs/dashboard-chat-interaction-spec.md)

---

## A. 已符合点

### A1. 图表内 datum 点击 toggle（同点再次点击取消）
- EChart 在 `inst.on('click')` 与 `zr.on('click')` 里支持“同一 (seriesIndex,dataIndex) 再点 => clearSelection，否则 setSelection”  
  - [EChart.tsx](file:///Users/rxy/原型/C/src/components/EChart.tsx#L461-L515)

### A2. 图表根容器已标记并阻止事件冒泡
- 图表容器带 `data-echart-root="1"` 且在 capture 阶段 stopPropagation  
  - [EChart.tsx](file:///Users/rxy/原型/C/src/components/EChart.tsx#L606-L614)

---

## B. 缺口/不一致（会导致你当前反馈的 1/2/3 问题）

### B1. L1 点击会误触发 L2（卡片边框被带动高亮）
现状：
- 卡片容器 `onClick` 无事件来源过滤，点击图表图元时仍会触发 `onCardSelect`，导致 `selectedCardIdx` 设置为当前卡片，从而边框高亮。  
  - [DashboardChatWorkspacePage.tsx](file:///Users/rxy/原型/C/src/pages/DashboardChatWorkspacePage.tsx#L914-L960)

影响：
- datum 选中会“带动卡片边框高亮”，违反规格 4.2/3.2，也解释了你反馈的第 2 点。

规格要求：
- 卡片 click 必须 `if (e.target.closest('[data-echart-root=\"1\"]')) return`

### B2. Outside-click 清空范围过大（右侧对话/页面任意处点击都会清空图表选中）
现状：
- EChart 用 `window.addEventListener('click', ..., true)`，只要点击不在图表容器/tooltip 内就 `clearSelection()`  
  - [EChart.tsx](file:///Users/rxy/原型/C/src/components/EChart.tsx#L526-L543)

影响：
- 点击右侧对话区（按钮/输入框/滚动条）会直接清空选中；用户会感知“选中不持久”。（规格 8）

### B3. option 重建后没有完整重放“弱化其它点/块”的视觉
现状：
- `opt` 变化时仅 `applyLineSymbolVisibility(true)` + `startPulse(...)`，没有对当前 selection 做 `downplay + highlight` 的重放  
  - [EChart.tsx](file:///Users/rxy/原型/C/src/components/EChart.tsx#L569-L580)

影响：
- 一旦发生 `setOption(notMerge:true)`（数据刷新/主题切换/外部重算），选中视觉（尤其是“其它变淡”）会丢失。对应规格 7。

### B4. 脉冲层缺失（线图）
现状观察：
- 脉冲层只在 selection 未被清空且 line 的 `startPulse` 正常运行时可见。
- 由于 B1/B2 导致 selection 容易被“卡片 click / outside click”清空，脉冲层经常瞬间停止，看起来“没有脉冲层”。

---

## C. 风险点（与历史报错相关，建议纳入实现约束）

### C1. 依赖 ECharts focus/blur 的“其它变淡”实现存在稳定性风险
现状：
- preview 下 `enhanceDashboardChartOption` 为多数图表注入 `emphasis.focus='self'` + `blurScope='global'` + `series.blur`，并保留 `series.select/selectedMode`（尽管 EChart 里会把 selectedMode 改为 false）  
  - [dashboardChartInteractions.ts](file:///Users/rxy/原型/C/src/pages/dashboardChartInteractions.ts#L133-L189)

风险：
- 这条链路是之前 `getRawIndex` / `group` 等 ECharts 内部异常的高发区域（blurSeries/tooltip dataParams）。
- 若继续用该机制，必须配合更严格的 option 标准化与 dispatchAction 安全校验（规格 10/7）。

### C2. EChart 清空/互斥广播未做 scope 过滤
现状：
- EChart 收到任意 `GLOBAL_SELECTION_EVENT`（只排除同 uid）就清空自身选中  
  - [EChart.tsx](file:///Users/rxy/原型/C/src/components/EChart.tsx#L545-L554)

风险：
- 不同页面/不同画布的选中可能互相误清，违背“scope 隔离”的规格要求。

---

## D. 建议的最小修复清单（严格按规格，不改视觉方案）

1) 卡片 onClick 增加来源过滤（阻断 L1 -> L2 冒泡）
2) Outside-click 清空范围收敛：限定为“左侧画布空白区域”，点击右侧对话区不清空
3) option/resize/data 刷新后补上 reapply：`downplay(all) + highlight(selected)`，线图同时恢复 pulse
4) GLOBAL_SELECTION_EVENT 处理增加 scope 过滤（只清同 scope 内的旧选中）

