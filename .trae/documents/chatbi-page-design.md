# ChatBI 页面设计说明（Ant Design 专业风格）

## 0. 全局设计与布局约束（Desktop-first）

### Layout
- 采用 Ant Design Layout：`Sider（左侧） + Header（顶部） + Content（内容）`。
- 左侧导航为多层级 Menu：一级（仪表盘 / 知识库 / 数据源），二级（知识库子模块、数据源子模块）以 `SubMenu` 呈现。
- 典型桌面宽度 1200–1440px 优先；内容区最大宽度可设为 1200–1360px 并居中（可选），数据表格/图表允许占满。
- 间距：使用 8px 栅格体系（Ant Design token），卡片/区块默认 16–24px padding。

### Meta Information（通用）
- 默认 Title 模板：`{页面名} - ChatBI`
- Description：`ChatBI 仪表盘、知识库与数据源管理`
- Open Graph：
  - `og:title` 同 Title
  - `og:description` 同 Description
  - `og:type=website`

### Global Styles（Design Tokens）
- 主题：Ant Design v5，专业蓝为主色（`colorPrimary` 建议 #1677ff），支持浅色/深色两套算法（暗色以 `darkAlgorithm` 为基准）。
- 背景：
  - 浅色：整体 `colorBgLayout`（浅灰），内容区卡片 `colorBgContainer`（白）
  - 深色：整体与卡片背景随 Ant 暗色 token 自动调整（避免手写大量颜色）
- 字体：系统字体栈；标题层级使用 Ant Typography（H1/H2/H3）。
- 组件规范：
  - 主按钮：Primary；危险操作（删除）使用 Danger。
  - Hover：默认 Ant 行为；列表行 hover 使用对应主题的弱强调底色。
  - 表格：密度默认 `middle`；列过多时启用水平滚动。

### 全局组件
- **AppShell**
  - Sider：Logo（左上）+ 多层级导航 Menu + 折叠按钮。
  - Header：页面标题 + 面包屑（可选）+ 右侧全局区（语言切换、主题切换）+ 页面级快捷区（例如“刷新”/“新建”按钮，随页面变化）。
    - 语言切换：`Dropdown + Menu`（例如 中文 / English），切换后全站文案立即更新，并本地持久化。
    - 主题切换：`Switch`（浅色/深色），切换后全站组件主题立即更新，并本地持久化。
  - Content：页面主体，承载卡片、表格、图表。
- **状态反馈**：统一使用 `message`/`notification`；加载用 `Spin`；空态用 `Empty`。

---

## 1. 仪表盘（/dashboard）

### Page Structure
- 采用“上方指标卡 + 中部图表 + 下方对话区”的三段式纵向结构。
- 内容区为栅格布局：上方 3–6 个 KPI 卡片；中部 2 列图表卡；底部对话区占满宽度。

### Sections & Components
1) **页面标题区（Header）**
- 标题：仪表盘
- 右侧操作：`Button: 刷新`（触发重新拉取概览数据/刷新对话结果区域的最新状态）

2) **KPI 概览（Card Grid）**
- 组件：`Row/Col + Card + Statistic`
- 每张卡：指标名称、数值、同比/环比（如无则不显示占位）

3) **可视化概览（Charts Area）**
- 组件：`Card` 容器 + 图表占位（具体图表实现由开发选型）
- 至少两块：趋势（折线）/ 分布（柱状或饼图）承载区

4) **对话式查询（Chat Panel，结果概览）**
- 上方：对话记录区（`List` 或自定义消息气泡），仅展示当前会话的最近 N 条。
- 下方：输入区（`Input.TextArea` + `Button: 发送`）。
- 结果概览（与“开始对话详情页”交互保持一致）：
  - 视图切换：`Segmented`（图表 / 表格）。
  - 文本结论：`Typography.Paragraph`。
  - 图表结果：图表承载区（与中部图区复用组件）。
  - 表格结果：`Table`（列过多开启 `scroll.x`；行过多开启 `scroll.y`，容器滚动条始终可见用于预览）。
  - 操作区：`Button: 进入详情/继续对话`（跳转到 /chat/:conversationId）。
- 交互状态：发送中禁用输入、显示 `Spin`；失败显示错误 `Alert`（提供“重试”）。

5) **快捷入口（Quick Links）**
- 组件：`Card` 或 `Space + Button`
- 行为：跳转到 知识库 / 数据源

---

## 2. 开始对话详情页（/chat/:conversationId）

### Page Structure
- 桌面优先采用“双栏”结构：左侧对话流，右侧结果与操作。
- 推荐布局：`CSS Grid`（左 420–520px / 右自适应），在内容区满高展示；右侧结果区内部独立滚动，避免整页跳动。

### Sections & Components
1) **页面标题区（Header）**
- 标题：开始对话
- 面包屑：仪表盘 / 开始对话
- 右侧操作：`Button: Mock 对话数据`（注入示例消息与示例结果） / `Button: 清空并重来`

2) **左栏：对话消息流（Conversation Thread）**
- 消息列表：用户与助手两种气泡样式（对齐左右 + 不同背景）。
- 单条消息动作（仅对用户提问或对应结果）：
  - `Button/Link: 重试`（重新生成该轮 assistant 结果）
  - `Button/Link: 查看 SQL`（打开右侧/抽屉展示 SQL）
- 列表滚动：默认滚动到底部；新消息生成时自动滚动（可关闭自动滚动）。

3) **左栏底部：输入区（Composer）**
- `Input.TextArea`：支持多行；Enter 发送、Shift+Enter 换行。
- `Button type=primary: 发送`：发送后进入 loading。
- 可选辅助：数据源选择（与“数据源卡片浮层”一致的选择器样式）。

4) **右栏：结果面板（Result Panel）**
- 顶部操作条：
  - 视图切换：`Tabs` 或 `Segmented`（图表 / 表格）。
  - `Button: 查看 SQL`：打开 `Drawer/Modal`，展示只读 SQL，提供复制。
  - `Dropdown: 导出`：CSV（最小可用）；无表格数据时置灰并提示。
- 内容区：
  - 结论摘要：`Typography`（可折叠，避免占满首屏）。
  - 图表视图：图表容器固定高度（如 360–420px），下方可选“关联表”。
  - 表格视图：`Table` 开启 `scroll.x` 与 `scroll.y`；表格外层容器显示明确滚动条（满足“预览滚动条”一致性）。

5) **SQL 抽屉（Drawer）**
- 标题：SQL
- 内容：`Typography.Text code` 或代码高亮（只读）
- 操作：复制 / 关闭

---

## 3. 知识库（/knowledge-base）

### Page Structure
- 左侧仍为全局 Sider；内容区为“筛选工具条 + 条目表格 + 右侧抽屉详情/编辑”的工作台布局。
- 详情与编辑尽量使用 `Drawer`/`Modal`，减少额外页面数量。

### Sections & Components
1) **工具条（Toolbar）**
- 组件：`Form layout=inline`
- 字段：
  - 分类（`Select`）
  - 关键词（`Input`）
- 操作：`Button: 搜索`、`Button: 重置`、`Button type=primary: 新建条目`

2) **条目列表（Table）**
- 列：标题、分类、更新时间、操作（查看/编辑）
- 组件：`Table`（支持分页）
- 空态：`Empty`

3) **条目详情（Drawer）**
- 触发：点击“查看”或标题
- 内容：标题、分类、更新时间、正文（`Typography`）
- 操作：`Button: 编辑`

4) **条目创建/编辑（Modal 或 Drawer）**
- 字段：标题、分类、内容（`Input.TextArea`）
- 操作：保存/取消
- 校验：必填提示（标题、分类、内容）

---

## 4. 数据源（/data-sources）

### Page Structure
- 内容区为“列表 + 右侧抽屉表单（新增/编辑）+ 测试结果反馈”的管理型页面。
- 元信息预览可作为抽屉内 Tab（连接可用后展示）。

### Sections & Components
1) **工具条（Toolbar）**
- 操作：`Button type=primary: 新增数据源`

2) **数据源列表（Table / Card Hybrid）**
- 默认使用 `Table`；当需要更强引导时可切换为 Card 列表（同一数据结构）。
- 列：名称、类型、状态（Tag：ok/error/unknown）、更新时间、操作（编辑/测试/预览）。
- 数据源卡片浮层（交互一致性修订）：
  - 触发：hover 或点击数据源名称/状态 Tag。
  - 展示：连接状态摘要、更新时间、快速动作（测试连接/预览元信息）。
  - 规则：浮层宽度固定（如 320px），超出视窗自动反向；与仪表盘/对话页的数据源选择浮层保持同样的信息层级与按钮样式。
- 交互：
  - 测试：点击后行内显示 loading 或全局 `message.loading`。
  - 失败：显示错误原因（`notification.error` 或行内 `Tooltip`）。

3) **新增/编辑数据源（Drawer Form）**
- 字段（最小必要集）：名称、类型、主机、端口、数据库、用户名
- 操作：保存/取消、`Button: 测试连接`
- 校验：必填、端口为数字

4) **连接测试与状态展示**
- 组件：`Alert`（成功/失败）+ 状态 Tag 回写到列表

5) **元信息预览（Drawer Tabs）**
- 条件：仅当状态为 ok 时展示。
- 组件：`Tabs` + 只读列表（如 schema/表名摘要）。
- 预览滚动条（交互一致性修订）：当表/字段列表过长时，Tab 内容区使用固定高度（如 420–520px）并显示明确滚动条，避免整页滚动。
- 空态：无元信息时显示 Empty。

---

## 5. 登录（/login）

### Page Structure
- 桌面优先的居中单列卡片布局：页面背景为 `colorBgLayout`，登录卡片为 `colorBgContainer`。
- 使用 `Flex` 垂直居中（最小高度 100vh），避免不同浏览器下偏移。

### Sections & Components
1) **品牌区（Header in Card）**
- Logo + 产品名（ChatBI），下方一行简短说明。

2) **登录表单（Form）**
- 字段：邮箱/用户名、密码。
- 校验：必填；错误在输入框下方显示。
- 对齐修订（交互一致性）：
  - `Form` 统一使用相同的 label/输入宽度策略（建议 `labelCol`/`wrapperCol` 或干脆无 label、用 placeholder）。
  - 主按钮宽度与输入框对齐（100%），按钮与输入的垂直间距固定（16px）。

3) **提交与状态**
- `Button type=primary: 登录`：loading 时禁用表单。
- 错误提示：`Alert` 放在按钮上方（不挤压布局）。

