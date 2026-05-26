import { Button, Card, Divider, Empty, Input, Popover, Select, Space, Tag, Typography, theme, TreeSelect, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowDown, ArrowUp, Braces, ChevronRight, CopyPlus, Eye, Maximize2, Minimize2, Save, X } from 'lucide-react'
import type { ThemeId } from '../theme/types'
import { THEMES } from '../theme/themes'
import { withChartTheme } from '../charts/themeOption'
import { EChart } from '../components/EChart'
import { useAppStore } from '../store/appStore'
import { createDashboardId, touchUpdatedAt, useDashboardsStore } from '../store/dashboardsStore'

type StudioMode = 'new' | 'edit' | 'preview'
type LayoutTemplate = 'main-sub' | 'three-col' | 'sidebar' | 'free'
type ThemeStyle = 'obsidian' | 'cyber'
type WidgetKind = 'line' | 'bar' | 'pie' | 'kpi' | 'graph'

type StudioAppearance = {
  language: 'zh-CN' | 'en-US'
  timeZone: string
  theme: ThemeStyle
  chartThemeId: ThemeId
}

type StudioLayout =
  | { mode: 'template'; template: Exclude<LayoutTemplate, 'free'> }
  | { mode: 'free'; cols: number; rowHeight: number; gap: number }

type WidgetConfigError = { message: string; line?: number }

type WidgetSlot = {
  id: string
  kind: WidgetKind | null
  configText: string
  error: WidgetConfigError | null
}

type LayoutSlotSpec = { colSpan: number; rowSpan: number }

const kindName: Record<WidgetKind, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  kpi: '指标卡',
  graph: '关系图',
}

const themeName: Record<ThemeStyle, string> = {
  obsidian: '曜石蓝',
  cyber: '赛博蓝紫',
}

const themeAccent: Record<ThemeStyle, string> = {
  obsidian: '#1677ff',
  cyber: '#7c3aed',
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightJson(text: string) {
  return escapeHtml(text)
}

function parseErrorLine(text: string, err: unknown): WidgetConfigError {
  const msg = err instanceof Error ? err.message : String(err)
  const m = /position\s+(\d+)/i.exec(msg)
  if (!m) return { message: msg }
  const pos = Number(m[1])
  if (!Number.isFinite(pos)) return { message: msg }
  const before = text.slice(0, Math.max(0, Math.min(text.length, pos)))
  const line = before.split('\n').length
  return { message: `Line ${line}: ${msg}`, line }
}

function defaultConfig(kind: WidgetKind) {
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
  if (kind === 'pie')
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
  if (kind === 'line')
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
  if (kind === 'bar')
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
  return { type: 'graph', title: '关系图', sourceKey: 'source', targetKey: 'target', weightKey: 'weight' }
}

function validateWidget(kind: WidgetKind, text: string): { ok: true; value: any } | { ok: false; error: WidgetConfigError } {
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: { message: 'Schema: 根节点必须是对象' } }
    const chartType = typeof (obj as any).chartType === 'string' ? String((obj as any).chartType) : ''

    if (chartType) {
      const expected = kind === 'kpi' ? 'MetricCard' : kind === 'line' ? 'Line' : kind === 'bar' ? 'Bar' : kind === 'pie' ? 'Donut' : null
      if (!expected) return { ok: false, error: { message: `Schema: ${kind} 不支持 chartType 模式` } }
      if (chartType !== expected) return { ok: false, error: { message: `Schema: chartType 必须为 ${expected}` } }

      if (!String((obj as any).title ?? '')) return { ok: false, error: { message: 'Schema: 缺少 title' } }

      if (kind === 'kpi') {
        const metrics = (obj as any).metrics
        if (!Array.isArray(metrics) || metrics.length < 1) return { ok: false, error: { message: 'Schema: metrics 至少 1 项' } }
      }
      if (kind === 'line') {
        if (!String((obj as any).xAxis?.field ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xAxis.field' } }
        const yAxis = (obj as any).yAxis
        if (!Array.isArray(yAxis) || yAxis.length < 1) return { ok: false, error: { message: 'Schema: yAxis 至少 1 项' } }
      }
      if (kind === 'bar') {
        if (!String((obj as any).xAxis?.field ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xAxis.field' } }
        const yAxis = (obj as any).yAxis
        if (!Array.isArray(yAxis) || yAxis.length < 1) return { ok: false, error: { message: 'Schema: yAxis 至少 1 项' } }
      }
      if (kind === 'pie') {
        if (!String((obj as any).dimension ?? '')) return { ok: false, error: { message: 'Schema: 缺少 dimension' } }
        if (!String((obj as any).metric?.field ?? '')) return { ok: false, error: { message: 'Schema: 缺少 metric.field' } }
      }
    } else {
      const t = String((obj as any).type ?? kind)
      if (t !== kind) return { ok: false, error: { message: `Schema: type 必须为 ${kind}` } }
      if (kind === 'line' || kind === 'bar') {
        if (!String((obj as any).xKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 xKey' } }
        if (!String((obj as any).yKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 yKey' } }
      }
      if (kind === 'pie') {
        if (!String((obj as any).categoryKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 categoryKey' } }
        if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
      }
      if (kind === 'kpi') {
        if (!String((obj as any).title ?? '')) return { ok: false, error: { message: 'Schema: 缺少 title' } }
        if (!String((obj as any).valueKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 valueKey' } }
      }
      if (kind === 'graph') {
        if (!String((obj as any).sourceKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 sourceKey' } }
        if (!String((obj as any).targetKey ?? '')) return { ok: false, error: { message: 'Schema: 缺少 targetKey' } }
      }
    }
    return { ok: true, value: obj }
  } catch (e) {
    return { ok: false, error: parseErrorLine(text, e) }
  }
}

function layoutSpecs(layout: StudioLayout): LayoutSlotSpec[] {
  if (layout.mode === 'template') {
    if (layout.template === 'three-col') return [{ colSpan: 4, rowSpan: 2 }, { colSpan: 4, rowSpan: 2 }, { colSpan: 4, rowSpan: 2 }]
    if (layout.template === 'sidebar') return [{ colSpan: 3, rowSpan: 2 }, { colSpan: 9, rowSpan: 2 }]
    return [{ colSpan: 8, rowSpan: 2 }, { colSpan: 4, rowSpan: 1 }, { colSpan: 4, rowSpan: 1 }]
  }
  const cols = Math.max(4, Math.min(24, Math.floor(layout.cols)))
  const span = Math.max(2, Math.floor(cols / 3))
  return Array.from({ length: 6 }).map(() => ({ colSpan: Math.min(12, span), rowSpan: 1 }))
}

function normalizeSlots(specs: LayoutSlotSpec[], prev: WidgetSlot[]) {
  const next: WidgetSlot[] = []
  const src = prev.slice(0)
  for (let i = 0; i < specs.length; i++) {
    const existing = src[i]
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

function buildMockSeries() {
  const dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const gmv = [120, 220, 180, 260, 300, 240, 320]
  return { dates, gmv }
}

function buildBarOption(title: string, accent: string) {
  const cats = ['A', 'B', 'C', 'D', 'E']
  const vals = [42, 58, 35, 66, 49]
  return {
    title: { text: title, left: 12, top: 10, textStyle: { fontSize: 14, fontWeight: 700 } },
    grid: { left: 36, right: 16, top: 50, bottom: 28 },
    xAxis: { type: 'category', data: cats, axisTick: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { opacity: 0.22 } } },
    series: [{ type: 'bar', data: vals, itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] } }],
    tooltip: { trigger: 'axis' },
  }
}

function buildLineOption(title: string, accent: string) {
  const { dates, gmv } = buildMockSeries()
  return {
    title: { text: title, left: 12, top: 10, textStyle: { fontSize: 14, fontWeight: 700 } },
    grid: { left: 36, right: 16, top: 50, bottom: 28 },
    xAxis: { type: 'category', data: dates, boundaryGap: false, axisTick: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { opacity: 0.22 } } },
    series: [
      {
        type: 'line',
        data: gmv,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: accent, width: 2 },
        areaStyle: { color: `rgba(22,119,255,0.14)` },
      },
    ],
    tooltip: { trigger: 'axis' },
  }
}

function buildPieOption(title: string, accent: string) {
  const data = [
    { name: '自然', value: 42 },
    { name: '投放', value: 28 },
    { name: '活动', value: 18 },
    { name: '其他', value: 12 },
  ]
  return {
    title: { text: title, left: 12, top: 10, textStyle: { fontSize: 14, fontWeight: 700 } },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['50%', '58%'],
        data,
        itemStyle: { borderRadius: 10, borderColor: '#000', borderWidth: 0 },
        emphasis: { scale: true },
        label: { color: 'rgba(233,236,242,0.86)' },
      },
    ],
    color: [accent, '#22d3ee', '#34d399', '#f59e0b'],
  }
}

function buildGraphOption(title: string, accent: string) {
  const nodes = [
    { id: 'A', name: '用户' },
    { id: 'B', name: '订单' },
    { id: 'C', name: '商品' },
    { id: 'D', name: '渠道' },
  ]
  const links = [
    { source: 'A', target: 'B', value: 3 },
    { source: 'B', target: 'C', value: 5 },
    { source: 'A', target: 'D', value: 2 },
  ]
  return {
    title: { text: title, left: 12, top: 10, textStyle: { fontSize: 14, fontWeight: 700 } },
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        label: { show: true, color: 'rgba(233,236,242,0.86)' },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 10,
        force: { repulsion: 220, edgeLength: 80 },
        data: nodes.map((n) => ({ ...n, symbolSize: 46, itemStyle: { color: accent } })),
        links,
        lineStyle: { color: 'rgba(148,163,184,0.55)', width: 2 },
      },
    ],
  }
}

function kpiValue(format: string) {
  const v = 182345.78
  if (format === 'percent') return `${(v / 1000000).toFixed(2)}%`
  if (format === 'number') return String(Math.round(v))
  return `¥${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function buildTables() {
  return [
    { id: 'ds-biz', name: '业务库', type: 'PostgreSQL', tables: ['orders', 'order_items', 'users', 'events', 'products', 'sessions'] },
    { id: 'ds-warehouse', name: '数仓', type: 'Hive', tables: ['dwd_orders', 'dwd_users', 'dws_metrics_daily', 'ads_growth_report'] },
  ]
}

export default function DashboardStudioPage({ mode }: { mode: StudioMode }) {
  const { token } = theme.useToken()
  const locale = useAppStore((s) => s.locale)
  const navigate = useNavigate()
  const { id } = useParams()
  const dashboards = useDashboardsStore((s) => s.items)
  const addItem = useDashboardsStore((s) => s.addItem)
  const updateItem = useDashboardsStore((s) => s.updateItem)

  const isReadOnly = mode === 'preview'

  const dataSources = useMemo(() => buildTables(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dataSourceId, setDataSourceId] = useState('')
  const [tables, setTables] = useState<string[]>([])

  const [appearance, setAppearance] = useState<StudioAppearance>({
    language: locale,
    timeZone: 'Asia/Shanghai',
    theme: 'obsidian',
    chartThemeId: 'business',
  })

  const [layout, setLayout] = useState<StudioLayout>({ mode: 'template', template: 'three-col' })
  const [slots, setSlots] = useState<WidgetSlot[]>(() => normalizeSlots(layoutSpecs({ mode: 'template', template: 'three-col' }), []))
  const [previewMode, setPreviewMode] = useState(mode === 'preview')

  const specs = useMemo(() => layoutSpecs(layout), [layout])

  useEffect(() => {
    setSlots((prev) => normalizeSlots(specs, prev))
  }, [specs])

  useEffect(() => {
    if (mode === 'new') {
      setTitle('')
      setDescription('')
      setDataSourceId('')
      setTables([])
      setAppearance({ language: locale, timeZone: 'Asia/Shanghai', theme: 'obsidian', chartThemeId: 'business' })
      setLayout({ mode: 'template', template: 'three-col' })
      setPreviewMode(false)
      return
    }
    const targetId = String(id ?? '')
    const hit = dashboards.find((d) => d.id === targetId)
    if (!hit) return
    setTitle(hit.title)
    setDescription(hit.description ?? '')
    setTables(hit.tables ?? [])
    setDataSourceId(() => {
      const first = hit.tables?.[0]
      if (!first) return dataSources[0]?.id ?? ''
      const ds = dataSources.find((x) => x.tables.includes(first))
      return ds?.id ?? dataSources[0]?.id ?? ''
    })
    const obj = (() => {
      try {
        return hit.configText ? JSON.parse(hit.configText) : null
      } catch {
        return null
      }
    })()
    const a = obj?.appearance
    if (a && typeof a === 'object') {
      const themeId = String((a as any).chartThemeId ?? 'business')
      setAppearance({
        language: (a as any).language === 'en-US' ? 'en-US' : 'zh-CN',
        timeZone: typeof (a as any).timeZone === 'string' ? (a as any).timeZone : 'Asia/Shanghai',
        theme: (a as any).theme === 'cyber' ? 'cyber' : 'obsidian',
        chartThemeId: Object.prototype.hasOwnProperty.call(THEMES, themeId) ? (themeId as ThemeId) : 'business',
      })
    }
    const l = obj?.layout
    if (l && typeof l === 'object') {
      if ((l as any).mode === 'free') {
        setLayout({ mode: 'free', cols: Number((l as any).cols ?? 12), rowHeight: Number((l as any).rowHeight ?? 120), gap: Number((l as any).gap ?? 16) })
      } else {
        const tpl = (l as any).template === 'sidebar' ? 'sidebar' : (l as any).template === 'main-sub' ? 'main-sub' : 'three-col'
        setLayout({ mode: 'template', template: tpl })
      }
    }
    const widgets = Array.isArray(obj?.widgets) ? (obj.widgets as any[]) : []
    const forceRefreshWidgetKinds = new Set<WidgetKind>(['kpi', 'line', 'bar', 'pie'])
    const nextWidgets = widgets.map((w) => {
      const kind = w?.kind as WidgetKind | undefined
      if (!kind || !kindName[kind]) return w
      if (!forceRefreshWidgetKinds.has(kind)) return w
      return { ...w, config: defaultConfig(kind) }
    })
    const nextText = JSON.stringify({ ...(obj ?? {}), widgets: nextWidgets }, null, 2)
    if (nextText !== String(hit.configText ?? '')) updateItem(String(hit.id ?? ''), { configText: nextText })
    const nextSlots = normalizeSlots(specs, [])
    for (let i = 0; i < nextSlots.length; i++) {
      const w = nextWidgets[i]
      const kind = w?.kind as WidgetKind | undefined
      const cfg = w?.config
      if (!kind || !kindName[kind]) continue
      const text = JSON.stringify(forceRefreshWidgetKinds.has(kind) ? defaultConfig(kind) : (cfg ?? {}), null, 2)
      const v = validateWidget(kind, text)
      nextSlots[i] = { ...nextSlots[i], kind, configText: text, error: v.ok ? null : v.error }
    }
    setSlots(nextSlots)
    setPreviewMode(mode === 'preview')
  }, [dashboards, dataSources, id, locale, mode])

  const accent = themeAccent[appearance.theme]
  const panelBg = appearance.theme === 'cyber' ? 'rgba(124,58,237,0.10)' : 'rgba(22,119,255,0.10)'
  const canvasBg = appearance.theme === 'cyber' ? 'linear-gradient(180deg, rgba(124,58,237,0.18), rgba(15,23,42,0.0))' : 'linear-gradient(180deg, rgba(22,119,255,0.18), rgba(15,23,42,0.0))'

  const canSave = useMemo(() => {
    if (isReadOnly) return false
    if (!title.trim()) return false
    const anyInvalid = slots.some((s) => s.kind && s.error)
    if (anyInvalid) return false
    return true
  }, [isReadOnly, slots, title])

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editorFullscreen, setEditorFullscreen] = useState(false)
  const editingSlot = useMemo(() => slots.find((s) => s.id === editingSlotId) ?? null, [editingSlotId, slots])

  const setSlot = (slotId: string, patch: Partial<WidgetSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...patch } : s)))
  }

  const assignWidget = (index: number, kind: WidgetKind) => {
    const target = slots[index]
    if (!target || isReadOnly) return
    if (target.kind && target.kind !== kind) return
    if (!target.kind) {
      const text = JSON.stringify(defaultConfig(kind), null, 2)
      const v = validateWidget(kind, text)
      setSlots((prev) => {
        const next = prev.slice(0)
        next[index] = { ...next[index], kind, configText: text, error: v.ok ? null : v.error }
        return next
      })
    }
    setEditingSlotId(target.id)
  }

  const addToFirstEmpty = (kind: WidgetKind) => {
    if (isReadOnly) return
    const i = slots.findIndex((s) => !s.kind)
    if (i < 0) return
    assignWidget(i, kind)
  }

  const swapSlots = (a: number, b: number) => {
    if (isReadOnly) return
    if (a < 0 || b < 0 || a >= slots.length || b >= slots.length) return
    setSlots((prev) => {
      const next = prev.slice(0)
      const t = next[a]
      next[a] = next[b]
      next[b] = t
      return next
    })
  }

  const widgetOption = (slot: WidgetSlot) => {
    if (!slot.kind || slot.error) return null
    const parsed = (() => {
      try {
        return JSON.parse(slot.configText)
      } catch {
        return null
      }
    })()
    if (!parsed) return null
    const th = THEMES[appearance.chartThemeId]
    const title = String(parsed.title ?? kindName[slot.kind])
    const base =
      slot.kind === 'bar'
        ? buildBarOption(title, accent)
        : slot.kind === 'line'
          ? buildLineOption(title, accent)
          : slot.kind === 'pie'
            ? buildPieOption(title, accent)
            : slot.kind === 'graph'
              ? buildGraphOption(title, accent)
              : null
    if (!base) return null
    return withChartTheme(base as any, th)
  }

  const renderSlotBody = (slot: WidgetSlot) => {
    if (!slot.kind) {
      return (
        <div
          className="studioSlotEmpty"
          style={{ height: '100%', display: 'grid', placeItems: 'center', color: token.colorTextSecondary }}
          onClick={() => {
            if (isReadOnly) return
            setEditingSlotId(slot.id)
          }}
        >
          <div className="studioSlotAdd" style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center' }}>
            <CopyPlus size={20} />
          </div>
        </div>
      )
    }
    if (slot.kind === 'kpi') {
      const parsed = (() => {
        try {
          return JSON.parse(slot.configText)
        } catch {
          return null
        }
      })()
      const title = String(parsed?.title ?? kindName.kpi)
      const format = String(parsed?.format ?? 'currency')
      return (
        <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Typography.Text>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.2 }}>{kpiValue(format)}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {slot.error ? <Tag color="error">解析失败</Tag> : <Tag color="success">解析成功</Tag>}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {appearance.timeZone}
            </Typography.Text>
          </div>
        </div>
      )
    }
    const opt = widgetOption(slot)
    return opt ? <EChart option={opt as any} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
  }

  const editorView = ({ slot }: { slot: WidgetSlot }) => {
    const lines = Math.max(1, slot.configText.split('\n').length)
    return (
      <div style={{ width: 520, maxWidth: '70vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Space size={8}>
            <Braces size={16} />
            <Typography.Text strong>{slot.kind ? kindName[slot.kind] : '添加组件'}</Typography.Text>
          </Space>
          <Space size={6}>
            <Button
              size="small"
              disabled={!slot.kind}
              onClick={() => {
                if (!slot.kind) return
                const v = validateWidget(slot.kind, slot.configText)
                if (v.ok) {
                  setSlot(slot.id, { configText: JSON.stringify(v.value, null, 2), error: null })
                }
              }}
            >
              格式化
            </Button>
            <Button size="small" onClick={() => setEditorFullscreen(true)}>
              <Maximize2 size={14} />
            </Button>
            <Button size="small" type="text" onClick={() => setEditingSlotId(null)}>
              <X size={16} />
            </Button>
          </Space>
        </div>

        <div style={{ height: 10 }} />

        {!slot.kind ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['bar', 'line', 'pie', 'kpi', 'graph'] as WidgetKind[]).map((k) => (
              <Card
                key={k}
                hoverable
                styles={{ body: { padding: 12 } }}
                onClick={() => {
                  const idx = slots.findIndex((x) => x.id === slot.id)
                  if (idx >= 0) assignWidget(idx, k)
                }}
              >
                <Typography.Text strong>{kindName[k]}</Typography.Text>
                <div style={{ height: 4 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  点击填充到当前槽位
                </Typography.Text>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ border: `1px solid ${token.colorSplit}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', background: token.colorFillQuaternary }}>
              <div
                style={{
                  padding: '10px 0',
                  textAlign: 'right',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  lineHeight: '18px',
                  color: token.colorTextTertiary,
                  userSelect: 'none',
                }}
              >
                {Array.from({ length: lines }).map((_, i) => (
                  <div key={i} style={{ paddingRight: 10 }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              <div style={{ position: 'relative', minHeight: 220 }}>
                <pre
                  aria-hidden
                  style={{
                    margin: 0,
                    padding: 10,
                    minHeight: 220,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 12,
                    lineHeight: '18px',
                    whiteSpace: 'pre',
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightJson(slot.configText) + '\n' }}
                />
                <textarea
                  value={slot.configText}
                  readOnly={isReadOnly}
                  spellCheck={false}
                  onChange={(e) => {
                    if (!slot.kind) return
                    const txt = e.target.value
                    const v = validateWidget(slot.kind, txt)
                    setSlot(slot.id, { configText: txt, error: v.ok ? null : v.error })
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 0,
                    padding: 10,
                    border: 0,
                    outline: 'none',
                    resize: 'none',
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: token.colorText,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 12,
                    lineHeight: '18px',
                    whiteSpace: 'pre',
                    overflow: 'auto',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 10 }} />

        {slot.kind ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Space size={8}>
              {slot.error ? <Tag color="error">{slot.error.message}</Tag> : <Tag color="success">解析成功</Tag>}
              {slot.error?.line ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  行 {slot.error.line}
                </Typography.Text>
              ) : null}
            </Space>
            <Button
              size="small"
              danger
              disabled={isReadOnly}
              onClick={() => {
                setSlot(slot.id, { kind: null, configText: '', error: null })
                setEditingSlotId(null)
              }}
            >
              移除
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  const save = async () => {
    if (!canSave) return
    const widgets = slots
      .filter((s) => s.kind)
      .map((s) => ({ kind: s.kind, config: (() => { try { return JSON.parse(s.configText) } catch { return {} } })() }))
    const payload = {
      name: title.trim(),
      description: description.trim(),
      tables,
      layout,
      appearance,
      widgets,
    }
    const configText = JSON.stringify(payload, null, 2)

    if (mode === 'new') {
      addItem({
        id: createDashboardId(),
        title: title.trim(),
        description: description.trim(),
        tables,
        updatedAt: touchUpdatedAt(),
        published: false,
        configText,
      })
    } else {
      updateItem(String(id ?? ''), { title: title.trim(), description: description.trim(), tables, updatedAt: touchUpdatedAt(), configText })
    }
    await new Promise((r) => setTimeout(r, 250))
    void message.success('已保存')
    navigate('/dashboard')
  }

  const libraryGroups = useMemo(
    () => [
      { label: '图表', items: (['line', 'bar', 'pie'] as WidgetKind[]) },
      { label: '组件', items: (['kpi', 'graph'] as WidgetKind[]) },
    ],
    [],
  )

  const sidebarLeft = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}` }}>
        <Typography.Text strong>组件库</Typography.Text>
        <div style={{ height: 6 }} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          拖拽或点击填充到画布
        </Typography.Text>
      </div>
      <div style={{ padding: 12, overflow: 'auto', minHeight: 0 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {libraryGroups.map((g) => (
            <div key={g.label}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {g.label}
              </Typography.Text>
              <div style={{ height: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {g.items.map((k) => (
                  <Card
                    key={k}
                    hoverable
                    styles={{ body: { padding: 12 } }}
                    style={{ border: `1px solid ${token.colorSplit}`, background: token.colorBgContainer }}
                    draggable={!isReadOnly}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', k)
                      e.dataTransfer.setData('application/x-dashboard-widget', k)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => addToFirstEmpty(k)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <Typography.Text strong>{kindName[k]}</Typography.Text>
                      <ChevronRight size={16} style={{ opacity: 0.6 }} />
                    </div>
                    <div style={{ height: 4 }} />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      点击自动填充第一个空槽
                    </Typography.Text>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </Space>
      </div>
    </div>
  )

  const rightPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}` }}>
        <Typography.Text strong>配置</Typography.Text>
        <div style={{ height: 6 }} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          右侧改动立即联动预览
        </Typography.Text>
      </div>

      <div style={{ padding: 12, overflow: 'auto', minHeight: 0 }}>
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              名称
            </Typography.Text>
            <div style={{ height: 6 }} />
            <Input value={title} disabled={isReadOnly} onChange={(e) => setTitle(e.target.value)} placeholder="例如：核心运营指标" />
          </div>

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              描述
            </Typography.Text>
            <div style={{ height: 6 }} />
            <Input.TextArea
              value={description}
              disabled={isReadOnly}
              onChange={(e) => setDescription(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="补充说明用途与口径范围"
            />
          </div>

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              数据源与表
            </Typography.Text>
            <div style={{ height: 6 }} />
            <TreeSelect
              value={tables.map((tb) => `${dataSourceId}::${tb}`)}
              disabled={isReadOnly}
              multiple
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              placeholder="选择表"
              style={{ width: '100%' }}
              treeData={dataSources.map((ds) => ({
                title: ds.name,
                value: ds.id,
                selectable: false,
                children: ds.tables.map((tb) => ({ title: tb, value: `${ds.id}::${tb}` })),
              }))}
              onChange={(values) => {
                const arr = (Array.isArray(values) ? values : []).map((v) => String(v))
                if (arr.length === 0) {
                  setTables([])
                  return
                }
                const first = arr[0]
                const dsId = first.includes('::') ? first.split('::')[0] : ''
                const nextTables = arr.map((v) => (v.includes('::') ? v.split('::')[1] : '')).filter(Boolean).slice(0, 10)
                if (dsId) setDataSourceId(dsId)
                setTables(nextTables)
              }}
            />
          </div>

          <Divider style={{ margin: '6px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                主题风格
              </Typography.Text>
              <div style={{ height: 6 }} />
              <Select
                value={appearance.theme}
                disabled={isReadOnly}
                onChange={(v) => setAppearance((p) => ({ ...p, theme: v }))}
                options={([
                  { value: 'obsidian', label: '曜石蓝' },
                  { value: 'cyber', label: '赛博蓝紫' },
                ] as const).map((x) => x)}
              />
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                图表色系
              </Typography.Text>
              <div style={{ height: 6 }} />
              <Select
                value={appearance.chartThemeId}
                disabled={isReadOnly}
                onChange={(v) => setAppearance((p) => ({ ...p, chartThemeId: v as ThemeId }))}
                options={Object.entries(THEMES).map(([id, th]) => ({ value: id, label: th.name }))}
                showSearch
                optionFilterProp="label"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                语言
              </Typography.Text>
              <div style={{ height: 6 }} />
              <Select
                value={appearance.language}
                disabled={isReadOnly}
                onChange={(v) => setAppearance((p) => ({ ...p, language: v }))}
                options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English' }]}
              />
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                时区
              </Typography.Text>
              <div style={{ height: 6 }} />
              <Select
                value={appearance.timeZone}
                disabled={isReadOnly}
                onChange={(v) => setAppearance((p) => ({ ...p, timeZone: String(v) }))}
                options={[
                  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                  { value: 'Europe/London', label: 'Europe/London' },
                ]}
                showSearch
              />
            </div>
          </div>

          <Divider style={{ margin: '6px 0' }} />

          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              页面布局
            </Typography.Text>
            <div style={{ height: 6 }} />
            <Select
              value={layout.mode === 'template' ? layout.template : 'free'}
              disabled={isReadOnly}
              onChange={(v) => {
                if (v === 'free') setLayout({ mode: 'free', cols: 12, rowHeight: 120, gap: 16 })
                else setLayout({ mode: 'template', template: v as any })
              }}
              options={[
                { value: 'three-col', label: '三列布局' },
                { value: 'main-sub', label: '主次布局' },
                { value: 'sidebar', label: '侧栏布局' },
                { value: 'free', label: '自定义栅格' },
              ]}
            />
          </div>

          {layout.mode === 'free' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  列数
                </Typography.Text>
                <div style={{ height: 6 }} />
                <Input
                  value={String(layout.cols)}
                  disabled={isReadOnly}
                  onChange={(e) => setLayout((p) => (p.mode === 'free' ? { ...p, cols: Number(e.target.value || 12) } : p))}
                />
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  行高
                </Typography.Text>
                <div style={{ height: 6 }} />
                <Input
                  value={String(layout.rowHeight)}
                  disabled={isReadOnly}
                  onChange={(e) => setLayout((p) => (p.mode === 'free' ? { ...p, rowHeight: Number(e.target.value || 120) } : p))}
                />
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  间距
                </Typography.Text>
                <div style={{ height: 6 }} />
                <Input
                  value={String(layout.gap)}
                  disabled={isReadOnly}
                  onChange={(e) => setLayout((p) => (p.mode === 'free' ? { ...p, gap: Number(e.target.value || 16) } : p))}
                />
              </div>
            </div>
          ) : null}
        </Space>
      </div>
    </div>
  )

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const gap = layout.mode === 'free' ? Math.max(8, Math.min(32, layout.gap)) : 14
  const rowHeight = layout.mode === 'free' ? Math.max(80, Math.min(240, layout.rowHeight)) : 160

  const canvas = (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space size={10}>
          <Button
            type="text"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft size={18} />}
            className="iconOnly"
            aria-label="返回"
          />
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ display: 'block', lineHeight: 1.1 }}>
              {title.trim() || (mode === 'new' ? '新建仪表盘' : '编辑仪表盘')}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {previewMode ? '预览模式' : 'Studio 模式'} · {themeName[appearance.theme]} · {THEMES[appearance.chartThemeId]?.name ?? appearance.chartThemeId}
            </Typography.Text>
          </div>
        </Space>

        <Space size={8}>
          <Button
            icon={previewMode ? <Minimize2 size={16} /> : <Eye size={16} />}
            onClick={() => setPreviewMode((x) => !x)}
          >
            {previewMode ? '退出预览' : '预览'}
          </Button>
          <Button type="primary" icon={<Save size={16} />} disabled={!canSave} onClick={save}>
            保存
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: 14, background: canvasBg }}>
        <div
          ref={canvasRef}
          style={{
            height: '100%',
            minHeight: 0,
            borderRadius: 16,
            border: `1px solid ${token.colorSplit}`,
            background: token.colorBgContainer,
            overflow: 'auto',
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
              gap,
              alignItems: 'stretch',
            }}
          >
            {slots.map((slot, idx) => {
              const spec = specs[idx]
              const open = editingSlotId === slot.id && !previewMode
              const borderColor = slot.kind ? (slot.error ? token.colorError : accent) : token.colorSplit
              return (
                <Popover
                  key={slot.id}
                  open={open}
                  placement="rightTop"
                  onOpenChange={(v) => {
                    if (isReadOnly || previewMode) return
                    setEditingSlotId(v ? slot.id : null)
                  }}
                  content={editorView({ slot })}
                  trigger={[]}
                  getPopupContainer={() => canvasRef.current ?? document.body}
                >
                  <div
                    style={{
                      gridColumn: `span ${Math.max(1, Math.min(12, spec.colSpan))}`,
                      gridRow: `span ${Math.max(1, spec.rowSpan)}`,
                      minHeight: rowHeight * Math.max(1, spec.rowSpan) + gap * Math.max(0, spec.rowSpan - 1),
                      borderRadius: 14,
                      border: slot.kind ? `1px solid ${borderColor}` : `1px dashed ${borderColor}`,
                      background: slot.kind ? token.colorBgContainer : panelBg,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: isReadOnly || previewMode ? 'default' : 'pointer',
                    }}
                    onClick={() => {
                      if (previewMode || isReadOnly) return
                      if (!slot.kind) setEditingSlotId(slot.id)
                      else setEditingSlotId(slot.id)
                    }}
                    onDragOver={(e) => {
                      if (isReadOnly || previewMode) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'copy'
                    }}
                    onDrop={(e) => {
                      if (isReadOnly || previewMode) return
                      e.preventDefault()
                      const k = (e.dataTransfer.getData('application/x-dashboard-widget') || e.dataTransfer.getData('text/plain')) as WidgetKind
                      if (!k || !kindName[k]) return
                      if (slot.kind) return
                      assignWidget(idx, k)
                    }}
                  >
                    {!previewMode && slot.kind ? (
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 20 }}>
                        <Button
                          size="small"
                          disabled={isReadOnly || idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            swapSlots(idx, idx - 1)
                          }}
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          size="small"
                          disabled={isReadOnly || idx === slots.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            swapSlots(idx, idx + 1)
                          }}
                        >
                          <ArrowDown size={14} />
                        </Button>
                      </div>
                    ) : null}

                    {renderSlotBody(slot)}
                  </div>
                </Popover>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const fullscreenEditor = editorFullscreen && editingSlot && editingSlot.kind ? (
    <div
      style={{
        position: 'fixed',
        inset: 14,
        zIndex: 100000,
        background: token.colorBgLayout,
        border: `1px solid ${token.colorSplit}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 12, borderBottom: `1px solid ${token.colorSplit}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space size={8}>
          <Braces size={16} />
          <Typography.Text strong>{kindName[editingSlot.kind]}</Typography.Text>
          {editingSlot.error ? <Tag color="error">{editingSlot.error.message}</Tag> : <Tag color="success">解析成功</Tag>}
        </Space>
        <Space size={8}>
          <Button
            onClick={() => {
              const v = validateWidget(editingSlot.kind as WidgetKind, editingSlot.configText)
              if (v.ok) setSlot(editingSlot.id, { configText: JSON.stringify(v.value, null, 2), error: null })
            }}
          >
            格式化
          </Button>
          <Button type="text" onClick={() => setEditorFullscreen(false)}>
            <Minimize2 size={18} />
          </Button>
        </Space>
      </div>
      <div style={{ padding: 12, flex: 1, minHeight: 0 }}>
        {editorView({ slot: editingSlot })}
      </div>
    </div>
  ) : null

  return (
    <div style={{ height: '100vh', width: '100%', background: token.colorBgLayout }}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: previewMode ? '1fr' : '320px 1fr 360px',
          minHeight: 0,
        }}
      >
        {previewMode ? null : <div style={{ borderRight: `1px solid ${token.colorSplit}`, background: token.colorBgContainer }}>{sidebarLeft}</div>}
        <div style={{ minWidth: 0 }}>{canvas}</div>
        {previewMode ? null : <div style={{ borderLeft: `1px solid ${token.colorSplit}`, background: token.colorBgContainer }}>{rightPanel}</div>}
      </div>
      {fullscreenEditor}
    </div>
  )
}
