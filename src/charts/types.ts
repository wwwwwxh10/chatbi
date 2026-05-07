import type { EChartsOption } from 'echarts'

export type CategoryId =
  | 'metric'
  | 'line'
  | 'bar'
  | 'pie'
  | 'radar'
  | 'bubble'
  | 'scatter'
  | 'funnel'
  | 'sankey'

export type ChartKind = 'echarts' | 'kpi' | 'flip' | 'progress'

export type DemoId = string

export type Demo = {
  id: DemoId
  categoryId: CategoryId
  name: string
  description: string
  unit: string
  axisHint: string
  kind: ChartKind
  buildOption?: () => EChartsOption
}

export type Category = {
  id: CategoryId
  name: string
}

