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
  cyber: '赛博蓝紫',
  tech: '科技蓝',
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
  const src = escapeHtml(text)
  return src
    .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)/g, '<span style="color:#93c5fd">$1</span>')
    .replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")/g, '<span style="color:#fca5a5">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span style="color:#86efac">$1</span>')
    .replace(/(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, '<span style="color:#fcd34d">$1</span>')
}

export function parseErrorLine(text: string, err: unknown): WidgetConfigError {
  const msg = err instanceof Error ? err.message : String(err)
  const m = /position\s+(\d+)/i.exec(msg)
  if (!m) return { message: msg }
  const pos = Number(m[1])
  if (!Number.isFinite(pos)) return { message: msg }
  const before = text.slice(0, Math.max(0, Math.min(text.length, pos)))
  const line = before.split('\n').length
  return { message: `Line ${line}: ${msg}`, line }
}

export function defaultConfig(kind: WidgetKind) {
  const en = curLocale() === 'en-US'
  if (kind === 'kpi') return { type: 'kpi', title: en ? 'Average ARPU' : 'ARPU均值', format: 'currency', valueKey: 'arpu' }
  if (kind === 'flip') return { type: 'flip', title: en ? 'Total Subscribers' : '在网总用户数', unit: en ? 'k' : '万', valueKey: 'subs' }
  if (kind === 'gauge') return { type: 'gauge', title: en ? '5G Penetration' : '5G渗透率', valueKey: 'rate', max: 100 }
  if (kind === 'progress') return { type: 'progress', title: en ? 'Alarm Resolution' : '告警处理进度', valueKey: 'progress', max: 100 }
  if (kind === 'wave') return { type: 'wave', title: en ? 'Capacity Level' : '容量水位', valueKey: 'capacity', max: 100 }
  if (kind === 'pie' || kind === 'donut' || kind === 'rose') return { type: kind, title: en ? 'Channel Mix' : '渠道分布', categoryKey: 'channel', valueKey: 'gmv' }
  if (kind === 'line' || kind === 'line-area' || kind === 'line-curve')
    return { type: kind, title: en ? 'GMV Trend' : 'GMV 趋势', unit: en ? 'k' : '万', xKey: 'date', yKey: 'gmv' }
  if (kind === 'scatter' || kind === 'bubble') return { type: kind, title: en ? 'Scatter Plot' : '散点分布', xKey: 'x', yKey: 'y', sizeKey: 'size' }
  if (kind === 'bar' || kind === 'bar-h' || kind === 'bar-stacked' || kind === 'bar-grouped' || kind === 'bar-gradient' || kind === 'waterfall')
    return {
      type: kind,
      title: en ? 'Category Comparison' : '品类对比',
      unit: en ? 'k' : '万',
      xKey: 'category',
      yKey: 'gmv',
    }
  if (kind === 'radar') return { type: 'radar', title: en ? 'Radar' : '能力雷达', indicators: ['A', 'B', 'C', 'D', 'E'], valueKey: 'score' }
  if (kind === 'heatmap') return { type: 'heatmap', title: en ? 'Heatmap' : '热力图', xKey: 'x', yKey: 'y', valueKey: 'v' }
  if (kind === 'funnel') return { type: 'funnel', title: en ? 'Conversion Funnel' : '转化漏斗', stageKey: 'stage', valueKey: 'count' }
  if (kind === 'treemap') return { type: 'treemap', title: en ? 'Treemap' : '树图', labelKey: 'name', valueKey: 'value' }
  if (kind === 'sankey') return { type: 'sankey', title: en ? 'Sankey' : '桑基图', sourceKey: 'source', targetKey: 'target', valueKey: 'value' }
  return { type: 'graph', title: en ? 'Graph' : '关系图', sourceKey: 'source', targetKey: 'target', weightKey: 'weight' }
}

export function validateWidget(kind: WidgetKind, text: string): { ok: true; value: any } | { ok: false; error: WidgetConfigError } {
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: { message: 'Schema: 根节点必须是对象' } }
    const t = String((obj as any).type ?? kind)
    if (t !== kind) return { ok: false, error: { message: `Schema: type 必须为 ${kind}` } }
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
      if (!String((obj as any).xKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xKey' } }
      if (!String((obj as any).yKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 yKey' } }
    }
    if (kind === 'pie' || kind === 'donut' || kind === 'rose') {
      if (!String((obj as any).categoryKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 categoryKey' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'kpi') {
      if (!String((obj as any).title ?? '')) return { ok: false, error: { message: 'Schema: 缺少 title' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'flip' || kind === 'gauge' || kind === 'progress' || kind === 'wave') {
      if (!String((obj as any).title ?? '')) return { ok: false, error: { message: 'Schema: 缺少 title' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'scatter' || kind === 'bubble') {
      if (!String((obj as any).xKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xKey' } }
      if (!String((obj as any).yKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 yKey' } }
    }
    if (kind === 'radar') {
      const arr = (obj as any).indicators
      if (!Array.isArray(arr) || arr.length < 3) return { ok: false, error: { message: 'Schema: indicators 至少 3 项' } }
    }
    if (kind === 'heatmap') {
      if (!String((obj as any).xKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xKey' } }
      if (!String((obj as any).yKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 yKey' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'funnel') {
      if (!String((obj as any).stageKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 stageKey' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'treemap') {
      if (!String((obj as any).labelKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 labelKey' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'sankey') {
      if (!String((obj as any).sourceKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 sourceKey' } }
      if (!String((obj as any).targetKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 targetKey' } }
      if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
    }
    if (kind === 'graph') {
      if (!String((obj as any).sourceKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 sourceKey' } }
      if (!String((obj as any).targetKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 targetKey' } }
    }
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
