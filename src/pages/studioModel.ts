import type { ThemeId } from '../theme/types'
import { THEMES } from '../theme/themes'

export type LayoutTemplate = 'main-sub' | 'three-col' | 'sidebar' | 'matrix-10' | 'analysis-7' | 'free'
export type ThemeStyle = 'obsidian' | 'cyber' | 'tech'
export type ChartPaletteId = 'cyber' | 'aurora' | 'ember' | 'deepsea' | 'obsidian' | 'royal' | 'azuregold' | 'sunset' | 'neon'
export type WidgetKind =
  | 'kpi'
  | 'flip'
  | 'gauge'
  | 'progress'
  | 'wave'
  | 'line'
  | 'line-area'
  | 'line-curve'
  | 'scatter'
  | 'bar'
  | 'bar-h'
  | 'bar-stacked'
  | 'bar-grouped'
  | 'bar-gradient'
  | 'waterfall'
  | 'pie'
  | 'donut'
  | 'rose'
  | 'radar'
  | 'heatmap'
  | 'bubble'
  | 'funnel'
  | 'treemap'
  | 'sankey'
  | 'graph'

export type StudioAppearance = {
  language: 'zh-CN' | 'en-US'
  timeZone: string
  theme: ThemeStyle
  chartPalette: ChartPaletteId
}

export const CHART_PALETTES: Record<ChartPaletteId, { name: string; desc: string; colors: string[] }> = {
  cyber: {
    name: '蓝紫',
    desc: '以蓝紫为主的配色',
    colors: ['#6AA6FF', '#7C3AED', '#22D3EE', '#A855F7', '#38BDF8', '#34D399', '#F472B6', '#93C5FD', '#14B8A6', '#C4B5FD'],
  },
  deepsea: {
    name: '深蓝',
    desc: '以深蓝为主的配色',
    colors: ['#2B7BFF', '#22D3EE', '#38BDF8', '#60A5FA', '#0EA5E9', '#34D399', '#A855F7', '#93C5FD', '#14B8A6', '#C4B5FD'],
  },
  obsidian: {
    name: '蓝黑',
    desc: '以蓝黑为主的配色',
    colors: ['#6AA6FF', '#7C3AED', '#22D3EE', '#A855F7', '#38BDF8', '#34D399', '#F472B6', '#93C5FD', '#14B8A6', '#C4B5FD'],
  },
  aurora: {
    name: '青绿',
    desc: '以青绿为主的配色',
    colors: ['#2DD4BF', '#22D3EE', '#34D399', '#4ADE80', '#10B981', '#38BDF8', '#A7F3D0', '#86EFAC', '#5EEAD4', '#84CC16'],
  },
  ember: {
    name: '橙红',
    desc: '以橙红为主的配色',
    colors: ['#F97316', '#F59E0B', '#F43F5E', '#FB7185', '#F472B6', '#A855F7', '#FDBA74', '#FDE047', '#C084FC', '#60A5FA'],
  },
  royal: {
    name: '宝蓝',
    desc: '以宝蓝为主的配色',
    colors: ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#0EA5E9', '#22D3EE', '#A855F7', '#7C3AED', '#C4B5FD'],
  },
  azuregold: {
    name: '蓝金',
    desc: '以蓝金为主的配色',
    colors: ['#2563EB', '#60A5FA', '#0EA5E9', '#22D3EE', '#F59E0B', '#FBBF24', '#FDE047', '#FB7185', '#A855F7', '#34D399'],
  },
  sunset: {
    name: '橙紫',
    desc: '以橙紫为主的配色',
    colors: ['#F97316', '#FB7185', '#F43F5E', '#A855F7', '#7C3AED', '#F59E0B', '#FDE047', '#FDBA74', '#93C5FD', '#34D399'],
  },
  neon: {
    name: '荧光',
    desc: '以荧光为主的配色',
    colors: ['#22D3EE', '#A855F7', '#F43F5E', '#FDE047', '#34D399', '#60A5FA', '#F97316', '#2DD4BF', '#C084FC', '#93C5FD'],
  },
}

export type StudioLayout =
  | { mode: 'template'; template: Exclude<LayoutTemplate, 'free'> }
  | {
      mode: 'free'
      cols: number
      rows: number
      gap: number
      cards: Array<{ colStart: number; colSpan: number; rowStart: number; rowSpan: number }>
    }

export type WidgetConfigError = { message: string; line?: number; issues?: Array<{ message: string; line?: number }> }

export type WidgetSlot = {
  id: string
  kind: WidgetKind | null
  configText: string
  error: WidgetConfigError | null
}

export type LayoutSlotSpec = { colSpan: number; rowSpan: number }

export const KIND_NAME: Record<WidgetKind, string> = {
  kpi: '指标卡',
  flip: '翻牌器',
  gauge: '仪表盘',
  progress: '进度条',
  wave: '水波图',
  line: '折线图',
  'line-area': '面积图',
  'line-curve': '曲线图',
  scatter: '散点图',
  bar: '柱状图',
  'bar-h': '横向柱状图',
  'bar-stacked': '堆叠柱状图',
  'bar-grouped': '分组柱状图',
  'bar-gradient': '渐变柱状图',
  waterfall: '瀑布图',
  pie: '饼图',
  donut: '环形图',
  rose: '玫瑰图',
  radar: '雷达图',
  heatmap: '热力图',
  bubble: '气泡图',
  funnel: '漏斗图',
  treemap: '树图',
  sankey: '桑基图',
  graph: '关系图',
}

export const THEME_NAME: Record<ThemeStyle, string> = {
  obsidian: '曜石蓝黑',
  cyber: '暗影墨蓝',
  tech: '深海湛蓝',
}

export const THEME_ACCENT: Record<ThemeStyle, string> = {
  obsidian: '#1677ff',
  cyber: '#5e9bff',
  tech: '#2b7bff',
}

function curLocale() {
  if (typeof document === 'undefined') return 'zh-CN'
  const lang = String(document.documentElement?.lang || '')
  return lang === 'en-US' ? 'en-US' : 'zh-CN'
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function highlightJson(text: string) {
  return escapeHtml(text)
}

export function parseErrorLine(text: string, err: unknown): WidgetConfigError {
  const msg = err instanceof Error ? err.message : String(err)
  const m = /position\s+(\d+)/i.exec(msg)
  if (!m) return { message: msg }
  const pos = Number(m[1])
  if (!Number.isFinite(pos)) return { message: msg }
  const before = text.slice(0, Math.max(0, Math.min(text.length, pos)))
  const line = before.split('\n').length
  const lines = String(text ?? '').split('\n')
  const issues: Array<{ message: string; line?: number }> = [{ message: `Line ${line}: ${msg}`, line }]
  for (let i = Math.max(0, line - 2); i >= 0; i--) {
    const raw = lines[i] ?? ''
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (/[:\[{,]\s*$/.test(trimmed) || /"\s*:\s*[\[{]\s*,?$/.test(trimmed)) {
      if (i + 1 !== line) issues.push({ message: '该结构行可能受当前语法错误影响', line: i + 1 })
      break
    }
  }
  return { message: `Line ${line}: ${msg}`, line, issues }
}

export function defaultConfig(kind: WidgetKind) {
  const en = curLocale() === 'en-US'
  if (kind === 'kpi')
    return {
      chartType: 'MetricCard',
      title: 'ARPU均值',
      dataSource: 'sales_detail_table',
      metrics: [
        {
          label: 'ARPU',
          type: 'Derived',
          expression: 'SUM(revenue) / COUNT(DISTINCT user_id)',
          unit: '元',
        },
      ],
      thresholds: [
        { condition: '> 100', color: '#4ade80', icon: 'up-arrow' },
        { condition: '< 50', color: '#f87171', icon: 'warning' },
      ],
      filters: {
        timeRange: 'LAST_30_DAYS',
        dimensionFilters: [{ field: 'region', operator: 'AND', value: '华东' }],
      },
      autoRefresh: { enabled: true, interval: 60 },
    }
  if (kind === 'flip') return { type: 'flip', title: en ? 'Total Subscribers' : '在网总用户数', unit: en ? 'k' : '万', valueKey: 'subs' }
  if (kind === 'gauge') return { type: 'gauge', title: en ? '5G Penetration' : '5G渗透率', valueKey: 'rate', max: 100 }
  if (kind === 'progress') return { type: 'progress', title: en ? 'Alarm Resolution' : '告警处理进度', valueKey: 'progress', max: 100 }
  if (kind === 'wave') return { type: 'wave', title: en ? 'Capacity Level' : '容量水位', valueKey: 'capacity', max: 100 }
  if (kind === 'pie' || kind === 'donut')
    return {
      chartType: 'Donut',
      title: '用户来源结构',
      dimension: 'channel_source',
      metric: {
        label: '用户数',
        field: 'user_id',
        aggregation: 'COUNT',
        unit: '人',
      },
      settings: {
        limit: 6,
        sortBy: 'DESC',
        innerRadius: '50%',
      },
    }
  if (kind === 'rose') return { type: kind, title: en ? 'Channel Mix' : '渠道分布', categoryKey: 'channel', valueKey: 'gmv' }
  if (kind === 'line' || kind === 'line-area' || kind === 'line-curve')
    return {
      chartType: 'Line',
      title: 'GMV趋势',
      xAxis: {
        field: 'order_date',
        granularity: 'AUTO',
        unitDisplay: 'TOOLTIP_ONLY',
      },
      yAxis: [
        {
          label: 'GMV',
          type: 'Basic',
          field: 'gmv_amount',
          aggregation: 'SUM',
          unit: '元',
          unitDisplay: 'TOOLTIP_ONLY',
        },
      ],
      settings: {
        areaStyle: false,
        stack: false,
      },
    }
  if (kind === 'scatter') return { type: kind, title: en ? 'Scatter Plot' : '散点分布', xKey: 'x', yKey: 'y', sizeKey: 'size' }
  if (kind === 'bar' || kind === 'bar-h' || kind === 'bar-stacked' || kind === 'bar-grouped' || kind === 'bar-gradient')
    return {
      chartType: 'Bar',
      title: '各地区经营对比',
      xAxis: {
        field: 'region',
        unit: '',
      },
      yAxis: [
        {
          label: '收入',
          field: 'revenue',
          aggregation: 'SUM',
          unit: '元',
        },
        {
          label: '成本',
          field: 'cost',
          aggregation: 'SUM',
          unit: '元',
        },
      ],
      display: {
        layout: 'Vertical',
        unitDisplay: 'TOOLTIP_ONLY',
      },
    }
  if (kind === 'waterfall')
    return {
      type: kind,
      title: en ? 'Category Comparison' : '品类对比',
      unit: en ? 'k' : '万',
      xKey: 'category',
      yKey: 'gmv',
    }
  if (kind === 'radar')
    return {
      chartType: 'Radar',
      title: '产品竞争力画像',
      analysisMode: 'METRIC_AS_AXIS',
      dimensions: ['product_name'],
      metrics: [
        { field: 'price_score', label: '价格力', aggregation: 'AVG' },
        { field: 'quality_score', label: '质量分', aggregation: 'AVG' },
        { field: 'service_score', label: '服务分', aggregation: 'AVG' },
      ],
      constraints: 'SAME_SCALE_REQUIRED',
    }
  if (kind === 'heatmap') return { type: 'heatmap', title: en ? 'Heatmap' : '热力图', xKey: 'x', yKey: 'y', valueKey: 'v' }
  if (kind === 'bubble')
    return {
      chartType: 'Bubble',
      title: '产品潜力散点分布',
      xAxis: {
        label: '平均单价',
        field: 'price',
        aggregation: 'AVG',
        unit: '元',
      },
      yAxis: {
        label: '总销量',
        field: 'sales_volume',
        aggregation: 'SUM',
        unit: '件',
      },
      bubbleSize: {
        label: '总销售额',
        field: 'revenue',
        aggregation: 'SUM',
        unit: '万元',
      },
    }
  if (kind === 'funnel')
    return {
      chartType: 'Funnel',
      title: '购买全链路转化',
      stageField: 'step_name',
      metric: {
        field: 'user_id',
        aggregation: 'COUNT',
        unit: '人',
      },
      conversionLogic: {
        base: 'OVERALL',
        showRate: true,
        showLoss: true,
      },
      sortOrder: ['曝光', '点击', '加购', '下单', '支付'],
    }
  if (kind === 'treemap') return { type: 'treemap', title: en ? 'Treemap' : '树图', labelKey: 'name', valueKey: 'value' }
  if (kind === 'sankey')
    return {
      chartType: 'Sankey',
      title: '页面流向分析',
      source: 'prev_page_name',
      target: 'curr_page_name',
      weight: {
        field: 'session_id',
        aggregation: 'COUNT',
        unit: '次',
      },
      settings: {
        nodeAlignment: 'JUSTIFY',
        unit: '次',
      },
    }
  return { type: 'graph', title: en ? 'Graph' : '关系图', sourceKey: 'source', targetKey: 'target', weightKey: 'weight' }
}

export function validateWidget(kind: WidgetKind, text: string): { ok: true; value: any } | { ok: false; error: WidgetConfigError } {
  try {
    const guessLine = (needles: string[]) => {
      const lines = String(text ?? '').split('\n')
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i] ?? ''
        for (const n of needles) {
          if (ln.includes(`"${n}"`) || ln.includes(n)) return i + 1
        }
      }
      return 1
    }
    const issues: Array<{ message: string; line?: number }> = []
    const pushIssue = (message: string, needles?: string[]) => {
      const line = needles && needles.length ? guessLine(needles) : 1
      if (issues.some((it) => it.message === message && it.line === line)) return
      issues.push({ message, line })
    }
    const done = () =>
      issues.length
        ? ({
            ok: false as const,
            error: {
              message: issues[0]?.message ?? 'Schema: 配置错误',
              line: issues[0]?.line,
              issues,
            },
          })
        : null

    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      pushIssue('Schema: 根节点必须是对象')
      return done() as { ok: false; error: WidgetConfigError }
    }
    const chartType = typeof (obj as any).chartType === 'string' ? String((obj as any).chartType) : ''
    const looksLikeChartTypeConfig = (() => {
      if (chartType) return true
      if (obj && typeof obj === 'object') {
        if ((obj as any).xAxis != null || (obj as any).yAxis != null) return true
        if ((obj as any).metrics != null || (obj as any).metric != null) return true
        if ((obj as any).dimension != null) return true
        if ((obj as any).stageField != null) return true
        if ((obj as any).source != null || (obj as any).target != null || (obj as any).weight != null) return true
        if ((obj as any).bubbleSize != null) return true
        if ((obj as any).analysisMode != null) return true
      }
      return false
    })()

    if (looksLikeChartTypeConfig) {
      const expected =
        kind === 'kpi'
          ? 'MetricCard'
          : kind === 'line' || kind === 'line-area' || kind === 'line-curve'
            ? 'Line'
            : kind === 'bar' || kind === 'bar-h' || kind === 'bar-stacked' || kind === 'bar-grouped' || kind === 'bar-gradient'
              ? 'Bar'
              : kind === 'pie' || kind === 'donut'
                ? 'Donut'
                : kind === 'radar'
                  ? 'Radar'
                  : kind === 'bubble'
                    ? 'Bubble'
                    : kind === 'funnel'
                      ? 'Funnel'
                      : kind === 'sankey'
                        ? 'Sankey'
                        : null

      if (!expected) pushIssue(`Schema: ${kind} 不支持 chartType 模式`, ['chartType'])
      if (!chartType) {
        const hasEmptyKey = Object.prototype.hasOwnProperty.call(obj as any, '')
        pushIssue(`Schema: 缺少 chartType（应为 ${expected ?? ''}）`, hasEmptyKey ? [''] : ['chartType', 'xAxis', 'metrics', 'dimension', 'stageField', 'source'])
      } else if (expected && chartType !== expected) {
        const hasEmptyKeyWithExpected = Object.prototype.hasOwnProperty.call(obj as any, '') && String((obj as any)[''] ?? '') === expected
        pushIssue(`Schema: chartType 必须为 ${expected}`, hasEmptyKeyWithExpected ? [''] : ['chartType'])
      }

      if (!String((obj as any).title ?? '')) pushIssue('Schema: 缺少 title', ['title'])

      if (kind === 'kpi') {
        const metrics = (obj as any).metrics
        if (!Array.isArray(metrics) || metrics.length < 1) pushIssue('Schema: metrics 至少 1 项', ['metrics'])
        if (Array.isArray(metrics)) {
          for (let i = 0; i < metrics.length; i++) {
            const it = metrics[i]
            if (!it || typeof it !== 'object') continue
            if (!String((it as any).label ?? '')) pushIssue(`Schema: 缺少 metrics[${i}].label`, ['metrics', 'label'])
            const mt = String((it as any).type ?? '')
            if (!mt) pushIssue(`Schema: 缺少 metrics[${i}].type`, ['metrics', 'type'])
            if (mt === 'Derived') {
              if (!String((it as any).expression ?? '')) pushIssue(`Schema: 缺少 metrics[${i}].expression`, Object.prototype.hasOwnProperty.call(it, '') ? [''] : ['expression'])
            }
          }
        }
      }

      if (kind === 'line' || kind === 'line-area' || kind === 'line-curve') {
        if (!String((obj as any).xAxis?.field ?? '')) pushIssue('Schema: 缺少 xAxis.field', ['xAxis'])
        const yAxis = (obj as any).yAxis
        if (!Array.isArray(yAxis) || yAxis.length < 1) pushIssue('Schema: yAxis 至少 1 项', ['yAxis'])
        if (Array.isArray(yAxis)) {
          for (let i = 0; i < yAxis.length; i++) {
            const it = yAxis[i]
            if (!it || typeof it !== 'object') continue
            if (!String((it as any).field ?? '')) pushIssue(`Schema: 缺少 yAxis[${i}].field`, Object.prototype.hasOwnProperty.call(it, '') ? [''] : ['field'])
            if (!String((it as any).aggregation ?? '')) pushIssue(`Schema: 缺少 yAxis[${i}].aggregation`, ['aggregation'])
          }
        }
      }

      if (kind === 'bar' || kind === 'bar-h' || kind === 'bar-stacked' || kind === 'bar-grouped' || kind === 'bar-gradient') {
        if (!String((obj as any).xAxis?.field ?? '')) pushIssue('Schema: 缺少 xAxis.field', ['xAxis'])
        const yAxis = (obj as any).yAxis
        if (!Array.isArray(yAxis) || yAxis.length < 1) pushIssue('Schema: yAxis 至少 1 项', ['yAxis'])
        if (Array.isArray(yAxis)) {
          for (let i = 0; i < yAxis.length; i++) {
            const it = yAxis[i]
            if (!it || typeof it !== 'object') continue
            if (!String((it as any).field ?? '')) pushIssue(`Schema: 缺少 yAxis[${i}].field`, Object.prototype.hasOwnProperty.call(it, '') ? [''] : ['field'])
            if (!String((it as any).aggregation ?? '')) pushIssue(`Schema: 缺少 yAxis[${i}].aggregation`, ['aggregation'])
          }
        }
      }

      if (kind === 'pie' || kind === 'donut') {
        if (!String((obj as any).dimension ?? '')) pushIssue('Schema: 缺少 dimension', ['dimension'])
        if (!String((obj as any).metric?.field ?? '')) pushIssue('Schema: 缺少 metric.field', ['metric'])
        if (!String((obj as any).metric?.aggregation ?? '')) pushIssue('Schema: 缺少 metric.aggregation', ['metric', 'aggregation'])
      }

      if (kind === 'radar') {
        const arr = (obj as any).metrics
        if (!Array.isArray(arr) || arr.length < 3) pushIssue('Schema: metrics 至少 3 项', ['metrics'])
        if (Array.isArray(arr)) {
          for (let i = 0; i < arr.length; i++) {
            const it = arr[i]
            if (!it || typeof it !== 'object') continue
            if (!String((it as any).field ?? '')) pushIssue(`Schema: 缺少 metrics[${i}].field`, Object.prototype.hasOwnProperty.call(it, '') ? [''] : ['field'])
            if (!String((it as any).aggregation ?? '')) pushIssue(`Schema: 缺少 metrics[${i}].aggregation`, ['aggregation'])
          }
        }
      }

      if (kind === 'bubble') {
        if (!String((obj as any).xAxis?.field ?? '')) pushIssue('Schema: 缺少 xAxis.field', ['xAxis'])
        if (!String((obj as any).xAxis?.aggregation ?? '')) pushIssue('Schema: 缺少 xAxis.aggregation', ['xAxis', 'aggregation'])
        if (!String((obj as any).yAxis?.field ?? '')) pushIssue('Schema: 缺少 yAxis.field', ['yAxis'])
        if (!String((obj as any).yAxis?.aggregation ?? '')) pushIssue('Schema: 缺少 yAxis.aggregation', ['yAxis', 'aggregation'])
        if (!String((obj as any).bubbleSize?.field ?? '')) pushIssue('Schema: 缺少 bubbleSize.field', ['bubbleSize'])
        if (!String((obj as any).bubbleSize?.aggregation ?? '')) pushIssue('Schema: 缺少 bubbleSize.aggregation', ['bubbleSize', 'aggregation'])
      }

      if (kind === 'funnel') {
        if (!String((obj as any).stageField ?? '')) pushIssue('Schema: 缺少 stageField', ['stageField'])
        if (!String((obj as any).metric?.field ?? '')) pushIssue('Schema: 缺少 metric.field', ['metric'])
        if (!String((obj as any).metric?.aggregation ?? '')) pushIssue('Schema: 缺少 metric.aggregation', ['metric', 'aggregation'])
      }

      if (kind === 'sankey') {
        if (!String((obj as any).source ?? '')) pushIssue('Schema: 缺少 source', ['source'])
        if (!String((obj as any).target ?? '')) pushIssue('Schema: 缺少 target', ['target'])
        if (!String((obj as any).weight?.field ?? '')) pushIssue('Schema: 缺少 weight.field', ['weight'])
        if (!String((obj as any).weight?.aggregation ?? '')) pushIssue('Schema: 缺少 weight.aggregation', ['weight', 'aggregation'])
      }
    } else {
      const t = String((obj as any).type ?? kind)
      if (t !== kind) pushIssue(`Schema: type 必须为 ${kind}`, ['type'])
      if (
        kind === 'line' ||
        kind === 'line-area' ||
        kind === 'line-curve' ||
        kind === 'bar' ||
        kind === 'bar-h' ||
        kind === 'bar-stacked' ||
        kind === 'bar-grouped' ||
        kind === 'bar-gradient' ||
        kind === 'waterfall'
      ) {
        if (!String((obj as any).xKey ?? '')) pushIssue('Schema: 缺少 xKey', ['xKey', 'xAxis'])
        if (!String((obj as any).yKey ?? '')) pushIssue('Schema: 缺少 yKey', ['yKey', 'yAxis'])
      }
      if (kind === 'pie' || kind === 'donut' || kind === 'rose') {
        if (!String((obj as any).categoryKey ?? '')) pushIssue('Schema: 缺少 categoryKey', ['categoryKey'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'kpi') {
        if (!String((obj as any).title ?? '')) pushIssue('Schema: 缺少 title', ['title'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'flip' || kind === 'gauge' || kind === 'progress' || kind === 'wave') {
        if (!String((obj as any).title ?? '')) pushIssue('Schema: 缺少 title', ['title'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'scatter' || kind === 'bubble') {
        if (!String((obj as any).xKey ?? '')) pushIssue('Schema: 缺少 xKey', ['xKey'])
        if (!String((obj as any).yKey ?? '')) pushIssue('Schema: 缺少 yKey', ['yKey'])
      }
      if (kind === 'radar') {
        const arr = (obj as any).indicators
        if (!Array.isArray(arr) || arr.length < 3) pushIssue('Schema: indicators 至少 3 项', ['indicators'])
      }
      if (kind === 'heatmap') {
        if (!String((obj as any).xKey ?? '')) pushIssue('Schema: 缺少 xKey', ['xKey'])
        if (!String((obj as any).yKey ?? '')) pushIssue('Schema: 缺少 yKey', ['yKey'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'funnel') {
        if (!String((obj as any).stageKey ?? '')) pushIssue('Schema: 缺少 stageKey', ['stageKey'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'treemap') {
        if (!String((obj as any).labelKey ?? '')) pushIssue('Schema: 缺少 labelKey', ['labelKey'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'sankey') {
        if (!String((obj as any).sourceKey ?? '')) pushIssue('Schema: 缺少 sourceKey', ['sourceKey'])
        if (!String((obj as any).targetKey ?? '')) pushIssue('Schema: 缺少 targetKey', ['targetKey'])
        if (!String((obj as any).valueKey ?? '')) pushIssue('Schema: 缺少 valueKey', ['valueKey'])
      }
      if (kind === 'graph') {
        if (!String((obj as any).sourceKey ?? '')) pushIssue('Schema: 缺少 sourceKey', ['sourceKey'])
        if (!String((obj as any).targetKey ?? '')) pushIssue('Schema: 缺少 targetKey', ['targetKey'])
      }
    }
    const failed = done()
    if (failed) return failed
    return { ok: true, value: obj }
  } catch (e) {
    return { ok: false, error: parseErrorLine(text, e) }
  }
}

export function layoutSpecs(layout: StudioLayout): LayoutSlotSpec[] {
  if (layout.mode === 'template') {
    if (layout.template === 'three-col') {
      return [
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
      ]
    }
    if (layout.template === 'matrix-10') {
      return [
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 6, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 6, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
      ]
    }
    if (layout.template === 'sidebar') {
      return [
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 6, rowSpan: 2 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 3, rowSpan: 1 },
      ]
    }
    if (layout.template === 'analysis-7') {
      return [
        { colSpan: 4, rowSpan: 2 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 2 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
        { colSpan: 4, rowSpan: 1 },
      ]
    }
    return [
      { colSpan: 3, rowSpan: 1 },
      { colSpan: 3, rowSpan: 1 },
      { colSpan: 3, rowSpan: 1 },
      { colSpan: 3, rowSpan: 1 },
      { colSpan: 8, rowSpan: 1 },
      { colSpan: 4, rowSpan: 1 },
      { colSpan: 6, rowSpan: 1 },
      { colSpan: 6, rowSpan: 1 },
    ]
  }
  const cards = Array.isArray(layout.cards) ? layout.cards : []
  return cards.map((c) => ({
    colSpan: Math.max(1, Math.min(12, Math.floor(c.colSpan))),
    rowSpan: Math.max(1, Math.floor(c.rowSpan)),
  }))
}

export function safeChartPalette(v: unknown): ChartPaletteId {
  const id = typeof v === 'string' ? v : ''
  return id === 'aurora' ||
    id === 'ember' ||
    id === 'cyber' ||
    id === 'deepsea' ||
    id === 'obsidian' ||
    id === 'royal' ||
    id === 'azuregold' ||
    id === 'sunset' ||
    id === 'neon'
    ? (id as ChartPaletteId)
    : 'cyber'
}

export function mapThemeIdToChartPalette(v: unknown): ChartPaletteId {
  const id = typeof v === 'string' ? v : ''
  if (id === 'fresh') return 'aurora'
  if (id === 'vibrant') return 'ember'
  return 'cyber'
}

export function normalizeSlots(specs: LayoutSlotSpec[], prev: WidgetSlot[]) {
  const next: WidgetSlot[] = []
  for (let i = 0; i < specs.length; i++) {
    const existing = prev[i]
    next.push(
      existing
        ? { ...existing }
        : {
            id: `slot-${i}-${Date.now()}`,
            kind: null,
            configText: '',
            error: null,
          },
    )
  }
  return next
}

export function safeThemeId(v: unknown): ThemeId {
  const id = typeof v === 'string' ? v : ''
  return Object.prototype.hasOwnProperty.call(THEMES, id) ? (id as ThemeId) : 'business'
}
