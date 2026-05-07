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
      category: 'metrics',
      name: '离网率',
      definition: '离网率 = A / B（示例口径）；命中指标名时强制使用该公式，不允许临时推导。',
      layer: 'standard',
      formula: '离网率 = 离网用户数 / 在网用户数',
      updatedAt: '2026-04-25 09:40',
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
      category: 'logic-tree',
      name: '营销活动复盘（示例）',
      scenario: '适用于活动前后效果评估、渠道拆解与异常归因。',
      steps: '1. 明确目标：活动带来的增量与结构变化\n2. 关键指标：GMV/订单数/转化率/客单价\n3. 拆解维度：渠道/城市/人群/品类\n4. 验证路径：对比活动前后 + 排除季节性\n5. 结论输出：异常点、建议动作与复盘要点',
      updatedAt: '2026-04-23 11:03',
    },
    {
      id: nowId(),
      category: 'sql-examples',
      question: '如何按渠道统计 GMV？',
      sql: 'SELECT channel, SUM(amount) AS gmv\nFROM orders\nWHERE created_at >= CURRENT_DATE - INTERVAL \'7 day\'\nGROUP BY channel;',
      updatedAt: '2026-04-22 20:28',
    },
  ]
}
