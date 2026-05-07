export type KnowledgeTabKey =
  | 'terms'
  | 'metrics'
  | 'regex'
  | 'logic-tree'
  | 'sql-examples'

export type MetricComputeLayer = 'precomputed' | 'standard' | 'runtime'

export type TermItem = {
  id: string
  category: 'terms'
  term: string
  synonyms: string[]
  desc: string
  updatedAt: string
}

export type MetricItem = {
  id: string
  category: 'metrics'
  name: string
  definition: string
  layer: MetricComputeLayer
  formula: string
  updatedAt: string
}


export type RegexItem = {
  id: string
  category: 'regex'
  name: string
  pattern: string
  replacement: string
  exampleIn: string
  exampleOut: string
  updatedAt: string
}

export type LogicTreeItem = {
  id: string
  category: 'logic-tree'
  name: string
  scenario: string
  steps: string
  updatedAt: string
}

export type SqlExampleItem = {
  id: string
  category: 'sql-examples'
  question: string
  sql: string
  updatedAt: string
}

export type KnowledgeItem =
  | TermItem
  | MetricItem
  | RegexItem
  | LogicTreeItem
  | SqlExampleItem

export const TAB_LABEL: Record<KnowledgeTabKey, string> = {
  terms: '术语库',
  metrics: '指标库',
  regex: '正则表达式',
  'logic-tree': '分析逻辑树',
  'sql-examples': 'SQL 示例库',
}

export function itemTitle(it: KnowledgeItem) {
  if (it.category === 'terms') return it.term
  if (it.category === 'metrics') return it.name
  if (it.category === 'regex') return it.name
  if (it.category === 'logic-tree') return it.name
  return it.question
}

export function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readTab(search: string): KnowledgeTabKey {
  const p = new URLSearchParams(search)
  const t = p.get('tab')?.trim() ?? 'terms'
  if (t in TAB_LABEL) return t as KnowledgeTabKey
  return 'terms'
}

export function setQuery(search: string, next: Record<string, string | null>) {
  const p = new URLSearchParams(search)
  for (const [k, v] of Object.entries(next)) {
    if (v === null) p.delete(k)
    else p.set(k, v)
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function buildSeed(): KnowledgeItem[] {
  return [
    {
      id: nowId(),
      category: 'terms',
      term: 'ARPU',
      synonyms: ['用户产值', '平均收入', '每用户收入'],
      desc: '将多样化业务表达统一映射为标准术语，用于对话理解与口径一致。',
      updatedAt: '2026-04-27 10:20',
    },
    {
      id: nowId(),
      category: 'terms',
      term: 'GMV',
      synonyms: ['销售额', '成交总额'],
      desc: 'GMV 表示一定时间范围内成交订单金额总和，通常包含已支付订单。',
      updatedAt: '2026-04-26 18:05',
    },
    {
      id: nowId(),
      category: 'terms',
      term: 'MSISDN',
      synonyms: ['手机号', '号码', '手机号码'],
      desc: '运营商体系中用于标识用户号码的字段，通常为 11 位手机号。',
      updatedAt: '2026-04-26 12:10',
    },
    {
      id: nowId(),
      category: 'terms',
      term: 'DAU',
      synonyms: ['日活', '日活跃用户'],
      desc: 'DAU 表示日活跃用户数，通常按去重口径统计。',
      updatedAt: '2026-04-25 16:18',
    },
    {
      id: nowId(),
      category: 'terms',
      term: 'MRR',
      synonyms: ['月经常性收入', '月度经常性收入'],
      desc: 'MRR 表示按月计的经常性收入，可用于订阅/套餐经营分析。',
      updatedAt: '2026-04-25 10:02',
    },
    {
      id: nowId(),
      category: 'terms',
      term: '掉线率',
      synonyms: ['Drop Rate', '掉话率', '断连率'],
      desc: '网络质量指标之一，通常按（掉线次数/总会话次数）统计。',
      updatedAt: '2026-04-24 09:12',
    },
    {
      id: nowId(),
      category: 'metrics',
      name: '离网率',
      definition: '离网率 = A / B（示例口径）；命中指标名时强制使用该公式，不允许临时推导。',
      layer: 'standard',
      formula: '离网率 = 离网用户数 / 在网用户数',
      updatedAt: '2026-04-25 09:40',
    },
    {
      id: nowId(),
      category: 'metrics',
      name: '新增用户数',
      definition: '按注册/入网时间去重计数；需明确是否包含携号转网、是否剔除测试号。',
      layer: 'standard',
      formula: '新增用户数 = COUNT(DISTINCT user_id) WHERE signup_date in range',
      updatedAt: '2026-04-24 16:32',
    },
    {
      id: nowId(),
      category: 'metrics',
      name: 'ARPU',
      definition: 'ARPU = 收入 / 活跃用户数；需明确收入口径与活跃口径。',
      layer: 'standard',
      formula: 'ARPU = SUM(revenue) / COUNT(DISTINCT active_user)',
      updatedAt: '2026-04-24 10:08',
    },
    {
      id: nowId(),
      category: 'metrics',
      name: '流量使用(MB)',
      definition: '统计周期内用户数据流量总和；需确认是否包含 WiFi 与漫游。',
      layer: 'precomputed',
      formula: '流量使用(MB) = SUM(data_mb)',
      updatedAt: '2026-04-23 19:20',
    },
    {
      id: nowId(),
      category: 'metrics',
      name: '掉线率(%)',
      definition: '掉线率 = 掉线次数 / 总会话次数；建议与网络制式/地区交叉分析。',
      layer: 'runtime',
      formula: '掉线率(%) = 100 * SUM(drop_cnt) / SUM(session_cnt)',
      updatedAt: '2026-04-23 11:55',
    },
    {
      id: nowId(),
      category: 'regex',
      name: 'employee_id',
      pattern: '^([a-zA-Z])(\\d{5})$',
      replacement: '$1$2',
      exampleIn: 'a12345',
      exampleOut: 'A12345',
      updatedAt: '2026-04-24 15:12',
    },
    {
      id: nowId(),
      category: 'regex',
      name: 'msisdn_normalize',
      pattern: '[^0-9]',
      replacement: '',
      exampleIn: '+86 138-0013-8000',
      exampleOut: '8613800138000',
      updatedAt: '2026-04-23 14:20',
    },
    {
      id: nowId(),
      category: 'regex',
      name: 'date_yyyy_mm_dd',
      pattern: '^(\\d{4})/(\\d{2})/(\\d{2})$',
      replacement: '$1-$2-$3',
      exampleIn: '2026/04/27',
      exampleOut: '2026-04-27',
      updatedAt: '2026-04-22 17:40',
    },
    {
      id: nowId(),
      category: 'logic-tree',
      name: '营销活动复盘（示例）',
      scenario: '适用于活动前后效果评估、渠道拆解与异常归因。',
      steps: '1. 明确目标：活动带来的增量与结构变化\n2. 关键指标：GMV/订单数/转化率/客单价\n3. 拆解维度：渠道/城市/人群/品类\n4. 验证路径：对比活动前后 + 排除季节性\n5. 结论输出：异常点、建议动作与复盘要点',
      updatedAt: '2026-04-23 11:03',
    },
    {
      id: nowId(),
      category: 'logic-tree',
      name: 'ARPU 异常波动排查',
      scenario: '适用于 ARPU 突增/突降的归因定位与对比验证。',
      steps: '1. 明确时间范围与口径：是否含补贴/退款/一次性费用\n2. 结构拆分：套餐/渠道/城市/新老客/设备\n3. 交叉对比：同比/环比/节假日/活动前后\n4. 关联指标：DAU、付费用户、流量/语音使用、欠费\n5. 输出结论：主要贡献与异常点，给出建议动作',
      updatedAt: '2026-04-22 10:15',
    },
    {
      id: nowId(),
      category: 'logic-tree',
      name: '网络掉线率升高排查',
      scenario: '适用于掉线率升高、投诉增加、网络体验下降场景。',
      steps: '1. 确认指标定义：掉线率/掉话率口径、采样范围\n2. 区域定位：省/市/小区/基站分布与 Top 异常\n3. 网络制式：4G/5G/WiFi 及终端型号差异\n4. 业务影响：关键应用、峰值时段、拥塞与时延\n5. 处置闭环：告警阈值、工单跟踪、复测回归',
      updatedAt: '2026-04-21 18:26',
    },
    {
      id: nowId(),
      category: 'sql-examples',
      question: '如何按渠道统计 GMV？',
      sql: 'SELECT channel, SUM(amount) AS gmv\nFROM orders\nWHERE created_at >= CURRENT_DATE - INTERVAL \'7 day\'\nGROUP BY channel;',
      updatedAt: '2026-04-22 20:28',
    },
    {
      id: nowId(),
      category: 'sql-examples',
      question: '如何按省份统计 DAU 并取 Top10？',
      sql: 'SELECT province, SUM(dau) AS dau\nFROM network_kpi_daily\nWHERE dt >= CURRENT_DATE - INTERVAL \'7 day\'\nGROUP BY province\nORDER BY dau DESC\nLIMIT 10;',
      updatedAt: '2026-04-22 09:05',
    },
    {
      id: nowId(),
      category: 'sql-examples',
      question: '如何统计 5G 用户的流量使用与费用？',
      sql: 'SELECT dt, SUM(data_mb) AS data_mb, SUM(data_fee) AS data_fee\nFROM cdr_data\nWHERE net_type = \'5G\'\n  AND dt >= CURRENT_DATE - INTERVAL \'7 day\'\nGROUP BY dt\nORDER BY dt;',
      updatedAt: '2026-04-21 13:18',
    },
    {
      id: nowId(),
      category: 'sql-examples',
      question: '如何计算各套餐的 ARPU 并对比环比？',
      sql: 'WITH m AS (\n  SELECT month, plan, AVG(arpu) AS arpu\n  FROM billing_monthly\n  WHERE month >= DATE_TRUNC(\'month\', CURRENT_DATE) - INTERVAL \'2 month\'\n  GROUP BY 1,2\n)\nSELECT *\nFROM m\nORDER BY month, arpu DESC;',
      updatedAt: '2026-04-20 21:44',
    },
  ]
}
