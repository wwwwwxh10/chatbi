import { Button, Empty, Input, InputNumber, Modal, Select, Space, Tag, Tooltip, Typography, message, theme } from 'antd'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CopyPlus,
  Save,
  Sigma,
  AreaChart,
  LineChart,
  BarChart3,
  ChartScatter,
  PieChart,
  Donut,
  Radar,
  Droplets,
  Gauge,
  Waves,
  Workflow,
  Zap,
  Activity,
  Layers,
  Boxes,
  ArrowDownUp,
  Network,
  CircleDot,
  Filter,
  Flower2,
} from 'lucide-react'
import {
  CodeOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { EChart } from '../components/EChart'
import { FlipCounter } from '../components/MetricCards'
import { useAppStore } from '../store/appStore'
import { createDashboardId, touchUpdatedAt, useDashboardsStore } from '../store/dashboardsStore'
import { StudioJsonEditor } from './StudioJsonEditor'
import {
  defaultConfig,
  KIND_NAME,
  layoutSpecs,
  normalizeSlots,
  CHART_PALETTES,
  mapThemeIdToChartPalette,
  safeChartPalette,
  THEME_ACCENT,
  THEME_NAME,
  validateWidget,
} from './studioModel'
import type { ChartPaletteId, StudioAppearance, StudioLayout, WidgetKind, WidgetSlot } from './studioModel'
import {
  buildAreaOption,
  buildBarOption,
  buildBubbleOption,
  buildCurveOption,
  buildDonutOption,
  buildFunnelOption,
  buildGaugeOption,
  buildGraphOption,
  buildGradientBarOption,
  buildGroupedBarOption,
  buildHBarOption,
  buildHeatmapOption,
  buildLineOption,
  buildPieOption,
  buildRadarOption,
  buildRoseOption,
  buildSankeyOption,
  buildScatterOption,
  buildStackedBarOption,
  buildWaterOption,
  buildTreemapOption,
  kpiValue,
} from './studioCharts'
type StudioMode = 'new' | 'edit' | 'preview'
type Ds = { id: string; name: string; type: string; tables: string[] }

function buildTables(): Ds[] {
  return [
    { id: 'ds-biz', name: '业务库', type: 'PostgreSQL', tables: ['orders', 'order_items', 'users', 'events', 'products', 'sessions'] },
    { id: 'ds-warehouse', name: '数仓', type: 'Hive', tables: ['dwd_orders', 'dwd_users', 'dws_metrics_daily', 'ads_growth_report'] },
  ]
}

export default function DashboardStudioPageV2({ mode }: { mode: StudioMode }) {
  const { token } = theme.useToken()
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)
  const navigate = useNavigate()
  const { id } = useParams()


  const dashboards = useDashboardsStore((s) => s.items)
  const addItem = useDashboardsStore((s) => s.addItem)
  const updateItem = useDashboardsStore((s) => s.updateItem)

  const readOnly = mode === 'preview'
  const dataSources = useMemo(() => buildTables(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tables, setTables] = useState<string[]>([])

  const [appearance, setAppearance] = useState<StudioAppearance>({
    language: locale,
    timeZone: 'Asia/Shanghai',
    theme: 'obsidian',
    chartPalette: 'cyber',
  })
  const [layout, setLayout] = useState<StudioLayout>({ mode: 'template', template: 'main-sub' })

  const specs = useMemo(() => layoutSpecs(layout), [layout])
  const [slots, setSlots] = useState<WidgetSlot[]>(() => normalizeSlots(specs, []))
  const [freeStartPoint, setFreeStartPoint] = useState<{ r: number; c: number } | null>(null)
  const [freeHoverPoint, setFreeHoverPoint] = useState<{ r: number; c: number } | null>(null)
  const freeOverlayRef = useRef<HTMLDivElement | null>(null)
  const freeRafRef = useRef<number | null>(null)
  const previewMode = mode === 'preview'

  const openDebug = () => {
    const payload = {
      title: title.trim() || '未命名仪表盘',
      description: description.trim(),
      tables,
      layout,
      appearance,
      slots: slots.map((s) => ({
        kind: s.kind,
        configText: s.configText,
      })),
    }
    localStorage.setItem('studio:debug-dashboard-v1', JSON.stringify(payload))
    window.open('/dashboard/chat-workspace?debug=studio', '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    setSlots((prev) => normalizeSlots(specs, prev))
  }, [specs])

  useEffect(() => {
    if (mode === 'new') {
      const initialLayout: StudioLayout = { mode: 'template', template: 'main-sub' }
      setTitle('未命名仪表盘')
      setDescription('')
      setTables([])
      setAppearance({ language: locale, timeZone: 'Asia/Shanghai', theme: 'obsidian', chartPalette: 'cyber' })
      setLayout(initialLayout)
      setSlots(normalizeSlots(layoutSpecs(initialLayout), []))
      return
    }

    const targetId = String(id ?? '')
    const hit = dashboards.find((d) => d.id === targetId)
    if (!hit) return

    setTitle(hit.title)
    setDescription(hit.description ?? '')
    setTables(hit.tables ?? [])

    const obj = (() => {
      try {
        return hit.configText ? JSON.parse(hit.configText) : null
      } catch {
        return null
      }
    })()

    const nextAppearance: StudioAppearance = (() => {
      const a = obj?.appearance
      if (!a || typeof a !== 'object') return { language: locale, timeZone: 'Asia/Shanghai', theme: 'obsidian', chartPalette: 'cyber' }
      const themeVal = (a as any).theme === 'tech' ? 'tech' : (a as any).theme === 'cyber' ? 'cyber' : 'obsidian'
      const pal = safeChartPalette((a as any).chartPalette ?? mapThemeIdToChartPalette((a as any).chartThemeId))
      return {
        language: (a as any).language === 'en-US' ? 'en-US' : 'zh-CN',
        timeZone: typeof (a as any).timeZone === 'string' ? (a as any).timeZone : 'Asia/Shanghai',
        theme: themeVal,
        chartPalette: themeVal === 'tech' && pal === 'cyber' ? 'deepsea' : pal,
      }
    })()
    setAppearance(nextAppearance)

    const nextLayout: StudioLayout = (() => {
      const l = obj?.layout
      if (!l || typeof l !== 'object') return { mode: 'template', template: 'main-sub' }
      if ((l as any).mode === 'free') {
        const cardsRaw = (l as any).cards
        const cards = Array.isArray(cardsRaw)
          ? cardsRaw
              .map((c: any) => ({
                colStart: Number(c?.colStart ?? 1),
                colSpan: Number(c?.colSpan ?? 3),
                rowStart: Number(c?.rowStart ?? 1),
                rowSpan: Number(c?.rowSpan ?? 1),
              }))
              .filter((c: any) => Number.isFinite(c.colStart) && Number.isFinite(c.colSpan) && Number.isFinite(c.rowStart) && Number.isFinite(c.rowSpan))
          : []
        return {
          mode: 'free',
          cols: Number((l as any).cols ?? 12),
          rows: Number((l as any).rows ?? 8),
          gap: Number((l as any).gap ?? 16),
          cards,
        }
      }
      const tplRaw = String((l as any).template ?? '')
      const tpl =
        tplRaw === 'sidebar'
          ? 'sidebar'
          : tplRaw === 'main-sub'
            ? 'main-sub'
            : tplRaw === 'matrix-10'
              ? 'matrix-10'
              : tplRaw === 'analysis-7'
                ? 'analysis-7'
                : 'three-col'
      return { mode: 'template', template: tpl }
    })()
    setLayout(nextLayout)

    const widgets = Array.isArray(obj?.widgets) ? (obj.widgets as any[]) : []
    const nextSlots = normalizeSlots(layoutSpecs(nextLayout), [])
    for (let i = 0; i < nextSlots.length; i++) {
      const w = widgets[i]
      const kind = w?.kind as WidgetKind | undefined
      const cfg = w?.config
      if (!kind || !KIND_NAME[kind]) continue
      const text = JSON.stringify({ ...(cfg ?? {}), type: kind }, null, 2)
      const v = validateWidget(kind, text)
      let err: WidgetSlot['error'] = null
      if ('error' in v) err = v.error
      nextSlots[i] = { ...nextSlots[i], kind, configText: text, error: err }
    }
    if (nextLayout.mode === 'free') {
      setSlots(
        nextLayout.cards.map((_, idx) => {
          const id = `free-${idx + 1}`
          const s = nextSlots[idx]
          return s ? { ...s, id } : { id, kind: null, configText: '', error: null }
        }),
      )
      return
    }
    setSlots(nextSlots)
  }, [dashboards, dataSources, id, mode])

  const accent = appearance.theme === 'obsidian' ? token.colorPrimary : THEME_ACCENT[appearance.theme]
  const panelBg = appearance.theme === 'obsidian' ? token.colorFillQuaternary : 'rgba(255,255,255,0.020)'

  const cyberPageBg =
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 22px), radial-gradient(1200px 700px at 30% 10%, rgba(45, 100, 255, 0.18), transparent 55%), radial-gradient(900px 520px at 80% 30%, rgba(121, 54, 255, 0.12), transparent 55%), radial-gradient(1200px 900px at 60% 120%, rgba(20, 255, 185, 0.08), transparent 60%), #03060c'

  const techPageBg =
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.028), rgba(255,255,255,0.028) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.028), rgba(255,255,255,0.028) 1px, transparent 1px, transparent 22px), radial-gradient(1200px 700px at 28% 8%, rgba(43, 123, 255, 0.22), transparent 55%), radial-gradient(900px 520px at 78% 30%, rgba(20, 160, 255, 0.16), transparent 58%), radial-gradient(1200px 900px at 60% 120%, rgba(90, 200, 255, 0.10), transparent 60%), #03060c'

  const canvasBg = appearance.theme === 'obsidian' ? token.colorBgLayout : 'transparent'

  const studioShellBg =
    appearance.theme === 'obsidian' ? token.colorBgLayout : appearance.theme === 'tech' ? techPageBg : cyberPageBg
  const sidePanelBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'linear-gradient(180deg, rgba(10, 18, 34, 0.72), rgba(8, 10, 18, 0.55))'
        : 'linear-gradient(180deg, rgba(10, 14, 28, 0.70), rgba(8, 10, 18, 0.55))'

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [draggingKind, setDraggingKind] = useState<WidgetKind | null>(null)

  const [editorDraft, setEditorDraft] = useState<string>('')
  const [editorError, setEditorError] = useState<WidgetSlot['error']>(null)
  const [editorFullscreen, setEditorFullscreen] = useState(false)

  const editingIdx = useMemo(() => (editingSlotId ? slots.findIndex((s) => s.id === editingSlotId) : -1), [editingSlotId, slots])
  const editingSlot = useMemo(() => (editingIdx >= 0 ? slots[editingIdx] : null), [editingIdx, slots])

  useEffect(() => {
    if (!editingSlot || !editingSlot.kind) {
      setEditorDraft('')
      setEditorError(null)
      setEditorFullscreen(false)
      return
    }
    setEditorDraft(editingSlot.configText)
    setEditorError(editingSlot.error)
    setEditorFullscreen(false)
  }, [editingSlotId])

  const applyLayout = (nextLayout: StudioLayout) => {
    setEditingSlotId(null)
    setSelectedSlotId(null)
    setDragFromIdx(null)
    setDragOverIdx(null)
    setLayout(nextLayout)
    if (nextLayout.mode === 'free') {
      setSlots((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]))
        const next = nextLayout.cards.map((_, idx) => {
          const id = `free-${idx + 1}`
          const hit = byId.get(id)
          return hit ? { ...hit, id } : { id, kind: null, configText: '', error: null }
        })
        return next
      })
      return
    }
    setSlots((prev) => normalizeSlots(layoutSpecs(nextLayout), prev))
  }

  useEffect(() => {
    if (layout.mode !== 'free') {
      setFreeStartPoint(null)
      setFreeHoverPoint(null)
    }
  }, [layout.mode])

  const setSlot = (slotId: string, patch: Partial<WidgetSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...patch } : s)))
  }

  const assignWidget = (index: number, kind: WidgetKind) => {
    if (readOnly || previewMode) return
    const target = slots[index]
    if (!target) return
    if (target.kind && target.kind !== kind) return
    if (!target.kind) {
      const text = JSON.stringify(defaultConfig(kind), null, 2)
      const v = validateWidget(kind, text)
      let err: WidgetSlot['error'] = null
      if ('error' in v) err = v.error
      setSlots((prev) => {
        const next = prev.slice(0)
        next[index] = { ...next[index], kind, configText: text, error: err }
        return next
      })
    }
  }

  const swapSlots = (a: number, b: number) => {
    if (readOnly || previewMode) return
    if (a < 0 || b < 0 || a >= slots.length || b >= slots.length) return
    setSlots((prev) => {
      const next = prev.slice(0)
      const t = next[a]
      next[a] = next[b]
      next[b] = t
      return next
    })
    setSelectedSlotId(null)
    setDragOverIdx(null)
    requestAnimationFrame(() => setDragOverIdx(null))
  }

  const onSlotDragStart = (idx: number, e: DragEvent<HTMLDivElement>) => {
    if (readOnly || previewMode) return
    if (!slots[idx]?.kind) return
    setEditingSlotId(null)
    setDragFromIdx(idx)
    setDragOverIdx(null)
    e.dataTransfer.setData('application/x-dashboard-slot-index', String(idx))
    e.dataTransfer.effectAllowed = 'move'
    try {
      const img = new Image()
      img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
      e.dataTransfer.setDragImage(img, 0, 0)
    } catch {
      // ignore
    }
  }

  const onSlotDragEnd = () => {
    setDragFromIdx(null)
    setDragOverIdx(null)
    setSelectedSlotId(null)
    setDraggingKind(null)
  }

  useEffect(() => {
    if (dragFromIdx == null && draggingKind == null && dragOverIdx != null) {
      setDragOverIdx(null)
      requestAnimationFrame(() => setDragOverIdx(null))
    }
  }, [dragFromIdx, dragOverIdx, draggingKind])

  useEffect(() => {
    const clear = () => {
      setDragFromIdx(null)
      setDragOverIdx(null)
      setDraggingKind(null)
    }
    window.addEventListener('dragend', clear)
    window.addEventListener('drop', clear)
    return () => {
      window.removeEventListener('dragend', clear)
      window.removeEventListener('drop', clear)
    }
  }, [])

  const canSave = useMemo(() => {
    if (readOnly) return false
    if (!title.trim()) return false
    if (slots.some((s) => s.kind && s.error)) return false
    return true
  }, [readOnly, slots, title])

  const translateSlots = (to: 'zh-CN' | 'en-US') => {
    const zhToEn: Record<string, string> = {
      'ARPU均值': 'Average ARPU',
      '在网总用户数': 'Total Subscribers',
      '5G渗透率': '5G Penetration',
      '告警处理进度': 'Alarm Resolution',
      '容量水位': 'Capacity Level',
      '渠道分布': 'Channel Mix',
      'GMV 趋势': 'GMV Trend',
      '品类对比': 'Category Comparison',
      '散点分布': 'Scatter Plot',
      '能力雷达': 'Radar',
      '热力图': 'Heatmap',
      '转化漏斗': 'Conversion Funnel',
      '树图': 'Treemap',
      '桑基图': 'Sankey',
      '关系图': 'Graph',
    }
    const enToZh: Record<string, string> = Object.fromEntries(Object.entries(zhToEn).map(([k, v]) => [v, k]))
    const map = to === 'en-US' ? zhToEn : enToZh

    setSlots((prev) =>
      prev.map((s) => {
        if (!s.kind) return s
        let obj: any = null
        try {
          obj = s.configText ? JSON.parse(s.configText) : null
        } catch {
          obj = null
        }
        if (!obj || typeof obj !== 'object') return s
        const next = { ...obj }
        if (typeof next.title === 'string' && map[next.title]) next.title = map[next.title]
        if (s.kind === 'flip' && typeof next.unit === 'string') {
          if (to === 'en-US' && next.unit === '万') next.unit = 'k'
          if (to === 'zh-CN' && next.unit === 'k') next.unit = '万'
        }
        const text = JSON.stringify({ ...next, type: s.kind }, null, 2)
        const v = validateWidget(s.kind, text)
        const err: WidgetSlot['error'] = 'error' in v ? v.error : null
        return { ...s, configText: text, error: err }
      }),
    )
  }

  const optionForSlot = (slot: WidgetSlot) => {
    if (!slot.kind || slot.error) return null
    const parsed = (() => {
      try {
        return JSON.parse(slot.configText)
      } catch {
        return null
      }
    })()
    if (!parsed) return null
    const colors = CHART_PALETTES[appearance.chartPalette].colors.slice(0, 10)
    const name = String(parsed.title ?? KIND_NAME[slot.kind])
    const base =
      slot.kind === 'bar'
        ? buildBarOption(name, colors)
        : slot.kind === 'bar-h'
          ? buildHBarOption(name, colors)
        : slot.kind === 'bar-stacked'
          ? buildStackedBarOption(name, colors)
          : slot.kind === 'bar-grouped'
            ? buildGroupedBarOption(name, colors)
            : slot.kind === 'bar-gradient'
              ? buildGradientBarOption(name, colors)
                : slot.kind === 'waterfall'
                  ? buildBarOption(name, colors)
              : slot.kind === 'line'
          ? buildLineOption(name, colors)
          : slot.kind === 'line-area'
            ? buildAreaOption(name, colors)
            : slot.kind === 'line-curve'
              ? buildCurveOption(name, colors)
              : slot.kind === 'scatter'
                ? buildScatterOption(name, colors)
                : slot.kind === 'bubble'
                  ? buildBubbleOption(name, colors)
                  : slot.kind === 'pie'
                    ? buildPieOption(name, colors)
                    : slot.kind === 'donut'
                      ? buildDonutOption(name, colors)
                      : slot.kind === 'rose'
                        ? buildRoseOption(name, colors)
                        : slot.kind === 'radar'
                          ? buildRadarOption(name, colors)
                          : slot.kind === 'heatmap'
                            ? buildHeatmapOption(name, colors)
                            : slot.kind === 'funnel'
                              ? buildFunnelOption(name, colors)
                              : slot.kind === 'treemap'
                                ? buildTreemapOption(name, colors)
                                : slot.kind === 'sankey'
                                  ? buildSankeyOption(name, colors)
                                  : slot.kind === 'graph'
                                    ? buildGraphOption(name, colors)
                                      : slot.kind === 'gauge'
                                        ? buildGaugeOption(name, colors)
                                        : slot.kind === 'wave'
                                          ? buildWaterOption(name, colors)
                                    : null
    return base
  }

  const renderSlotBody = (slot: WidgetSlot, idx: number) => {
    if (!slot.kind) {
      return (
        <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: token.colorTextSecondary }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
            <div className="studioSlotAdd" style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center' }}>
              <CopyPlus size={20} />
            </div>
            <Typography.Text className="studioSlotHint" style={{ fontSize: 12, color: 'inherit', fontWeight: 600 }}>
              从左侧拖拽图表到此处
            </Typography.Text>
          </div>
        </div>
      )
    }
    const parsed = (() => {
      try {
        return JSON.parse(slot.configText)
      } catch {
        return null
      }
    })()
    const chartTitle = String(parsed?.title ?? KIND_NAME[slot.kind])
    const palette = CHART_PALETTES[appearance.chartPalette]
    const c0 = palette.colors[0] ?? accent

    if (slot.kind === 'flip') {
      const baseRaw = Number(parsed?.value ?? 6_894)
      const base = Number.isFinite(baseRaw) ? baseRaw : 0
      const value = Math.max(0, Math.round(base))
      const unit = String(parsed?.unit ?? '次')
      const titleFixed = appearance.language === 'en-US' ? 'Total Subscribers' : '在网总用户数'
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Tooltip title={readOnly || previewMode ? undefined : '拖拽可移动/换位'}>
            <div
              className="studioSlotHeader"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
              draggable={!readOnly && !previewMode}
              onDragStart={(e) => onSlotDragStart(idx, e)}
              onDragEnd={onSlotDragEnd}
            >
              <Space size={6}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: accent,
                  }}
                >
                  <CircleDot size={14} />
                </span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {titleFixed}
                </Typography.Text>
              </Space>
            </div>
          </Tooltip>

          <div style={{ display: 'grid', alignContent: 'center', minHeight: 0 }}>
            <FlipCounter title={titleFixed} unit={unit} target={value} />
          </div>
          {slot.error ? <div style={{ padding: '0 12px 12px 12px' }}><Tag color="error">解析失败</Tag></div> : null}
        </div>
      )
    }

    if (slot.kind === 'progress') {
      const pct = Math.max(0, Math.min(100, Number(parsed?.percent ?? 78) || 0))
      const v = String(parsed?.value ?? '15.6k')
      const unit = String(parsed?.unit ?? '个')
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Tooltip title={readOnly || previewMode ? undefined : '拖拽可移动/换位'}>
            <div
              className="studioSlotHeader"
              style={{ padding: '10px 12px' }}
              draggable={!readOnly && !previewMode}
              onDragStart={(e) => onSlotDragStart(idx, e)}
              onDragEnd={onSlotDragEnd}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Space size={6}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 8,
                      background: 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      color: token.colorTextTertiary,
                      opacity: 0.85,
                    }}
                  >
                    <Workflow size={14} />
                  </span>
                  <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: 0.2 }}>{chartTitle}</Typography.Text>
                </Space>
              </div>
            </div>
          </Tooltip>
          <div style={{ padding: 12, flex: 1, minHeight: 0, display: 'grid', alignContent: 'center', gap: 10 }}>
            <div style={{ position: 'relative', height: 6, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: c0, borderRadius: 3, boxShadow: `0 0 10px ${c0}66` }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 600 }}>
              <div style={{ color: c0, fontFamily: 'tabular-nums' }}>{v} {unit}</div>
              <div style={{ color: c0, fontFamily: 'tabular-nums' }}>{pct}%</div>
            </div>
          </div>
          {slot.error ? <Tag color="error">解析失败</Tag> : null}
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
      const name = String(parsed?.title ?? KIND_NAME.kpi)
      const fmt = String(parsed?.format ?? 'currency')
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Space size={6}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 8,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: accent,
                }}
              >
                <Sigma size={14} />
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {name}
              </Typography.Text>
            </Space>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>{kpiValue(fmt)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Typography.Text style={{ fontSize: 12, color: '#22c55e' }}>同比 +12.4%</Typography.Text>
            {slot.error ? <Tag color="error">解析失败</Tag> : null}
          </div>
        </div>
      )
    }


    const opt = optionForSlot(slot)
    return opt ? (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tooltip title={readOnly || previewMode ? undefined : '拖拽可移动/换位'}>
          <div
            className="studioSlotHeader"
            style={{ padding: '12px 12px 8px 12px' }}
            draggable={!readOnly && !previewMode}
            onDragStart={(e) => onSlotDragStart(idx, e)}
            onDragEnd={onSlotDragEnd}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Space size={6} style={{ minWidth: 0 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: token.colorTextTertiary,
                    opacity: 0.85,
                    flex: '0 0 22px',
                  }}
                >
                  {(() => {
                    const k = slot.kind
                    const Icon =
                      k === 'line'
                        ? LineChart
                        : k === 'line-area'
                          ? AreaChart
                          : k === 'line-curve'
                            ? LineChart
                            : k === 'bar' || k === 'bar-h' || k === 'bar-grouped' || k === 'bar-stacked' || k === 'bar-gradient' || k === 'waterfall'
                              ? BarChart3
                              : k === 'pie'
                                ? PieChart
                                : k === 'donut'
                                  ? Donut
                                  : k === 'rose'
                                    ? Flower2
                                    : k === 'scatter'
                                      ? ChartScatter
                                      : k === 'bubble'
                                        ? Droplets
                                        : k === 'funnel'
                                          ? Filter
                                          : k === 'radar'
                                            ? Radar
                                            : k === 'heatmap' || k === 'treemap'
                                              ? Layers
                                              : k === 'sankey' || k === 'graph'
                                                ? Network
                                                : Activity
                    return <Icon size={14} />
                  })()}
                </span>
                <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: 0.2 }}>
                  {chartTitle}
                </Typography.Text>
              </Space>
            </div>
          </div>
        </Tooltip>
        <div style={{ flex: 1, minHeight: 0, paddingTop: slot.kind === 'funnel' ? 0 : 10 }}>
          <EChart option={opt as any} />
        </div>
      </div>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
    )
  }

  const save = async () => {
    if (!canSave) return
    const widgets = slots
      .filter((s) => s.kind)
      .map((s) => ({ kind: s.kind, config: (() => { try { return JSON.parse(s.configText) } catch { return {} } })() }))
    const payload = { name: title.trim(), description: description.trim(), tables, layout, appearance, widgets }
    const configText = JSON.stringify(payload, null, 2)
    if (mode === 'new') {
      addItem({ id: createDashboardId(), title: title.trim(), description: description.trim(), tables, updatedAt: touchUpdatedAt(), published: false, configText })
    } else {
      updateItem(String(id ?? ''), { title: title.trim(), description: description.trim(), tables, updatedAt: touchUpdatedAt(), configText })
    }
    await new Promise((r) => setTimeout(r, 250))
    void message.success('已保存')
    navigate('/dashboard')
  }

  const libraryGroups = useMemo(
    () =>
      [
        {
          label: '指标',
          items: [
            { kind: 'kpi' as const, icon: Zap, title: '指标卡', desc: '用于展示核心指标与同比/环比变化' },
            { kind: 'flip' as const, icon: CircleDot, title: '翻牌器', desc: '用于大数字监控与实时态势看板' },
            { kind: 'gauge' as const, icon: Gauge, title: '仪表盘', desc: '用于展示健康度/完成度等单指标占比' },
            { kind: 'progress' as const, icon: Workflow, title: '进度条', desc: '用于展示阶段进展与目标达成情况' },
            { kind: 'wave' as const, icon: Waves, title: '水波图', desc: '用于展示资源利用率与水位变化' },
          ],
        },
        {
          label: '线图',
          items: [
            { kind: 'line' as const, icon: LineChart, title: '折线图', desc: '用于展示趋势变化与周期波动' },
            { kind: 'line-curve' as const, icon: Activity, title: '曲线图', desc: '用于展示平滑趋势与长期走势' },
            { kind: 'line-area' as const, icon: AreaChart, title: '面积图', desc: '用于展示规模趋势与贡献占比' },
          ],
        },
        {
          label: '柱图',
          items: [
            { kind: 'bar' as const, icon: BarChart3, title: '柱状图', desc: '用于类别对比与Top排行展示' },
            { kind: 'bar-h' as const, icon: ArrowDownUp, title: '横向柱状图', desc: '用于长文本类目排行与对比' },
            { kind: 'bar-grouped' as const, icon: Boxes, title: '分组柱状图', desc: '用于多维度对比（目标/实际等）' },
            { kind: 'bar-stacked' as const, icon: Layers, title: '堆积柱状图', desc: '用于结构构成与分项占比对比' },
          ],
        },
        {
          label: '饼/环图',
          items: [
            { kind: 'pie' as const, icon: PieChart, title: '饼图', desc: '用于展示分类占比与份额结构' },
            { kind: 'donut' as const, icon: Donut, title: '环形图', desc: '用于展示占比结构与中心指标强调' },
            { kind: 'rose' as const, icon: Flower2, title: '玫瑰图', desc: '用于展示多分类占比与对比层级' },
          ],
        },
        {
          label: '其他',
          items: [
            { kind: 'radar' as const, icon: Radar, title: '雷达图', desc: '用于多指标能力画像与对标分析' },
            { kind: 'bubble' as const, icon: Droplets, title: '气泡图', desc: '用于投入产出与规模三维关系分析' },
            { kind: 'scatter' as const, icon: ChartScatter, title: '散点图', desc: '用于相关性分析与离群点识别' },
            { kind: 'funnel' as const, icon: Filter, title: '漏斗图', desc: '用于转化流程分析与环节对比' },
            { kind: 'sankey' as const, icon: Network, title: '桑基图', desc: '用于流向分析与路径占比展示' },
          ],
        },
      ] as const,
    [],
  )

  const ThemeStyleCardPicker = ({
    value,
    onChange,
    disabled,
  }: {
    value: StudioAppearance['theme']
    onChange: (v: StudioAppearance['theme']) => void
    disabled?: boolean
  }) => {
    const themePalette: Array<{ key: StudioAppearance['theme']; label: string; palette: ChartPaletteId }> = [
      { key: 'obsidian', label: '曜石蓝黑', palette: 'obsidian' },
      { key: 'cyber', label: '暗影墨蓝', palette: 'cyber' },
      { key: 'tech', label: '深海湛蓝', palette: 'deepsea' },
    ]
    return (
      <div className="studioPaletteGrid" style={{ ['--studio-accent' as any]: accent }}>
        {themePalette.map((it) => {
          const selected = value === it.key
          const cols = (CHART_PALETTES[it.palette]?.colors ?? []).slice(0, 6)
          return (
            <div
              key={it.key}
              className={`studioPaletteCard${selected ? ' studioPaletteCardActive' : ''}${disabled ? ' studioPaletteCardDisabled' : ''}`}
              onClick={() => {
                if (disabled) return
                onChange(it.key)
              }}
            >
              <div className="studioPaletteRow">
                <Typography.Text className="studioPaletteLabel">{it.label}</Typography.Text>
                <div className="studioPaletteSwatches">
                  {cols.map((c, i) => (
                    <span key={`${c}-${i}`} className="studioPaletteSwatch" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const LayoutWireframe = ({ kind }: { kind: 'main-sub' | 'three-col' | 'sidebar' | 'matrix-10' | 'analysis-7' }) => {
    const fill = 'rgba(255,255,255,0.06)'
    const fill2 = 'rgba(255,255,255,0.045)'
    const rx = 4

    const Block = ({ x, y, w, h, strong }: { x: number; y: number; w: number; h: number; strong?: boolean }) => (
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={strong ? fill : fill2} />
    )

    const renderByGrid = (
      items: Array<{ colStart: number; colSpan: number; rowStart: number; rowSpan: number; strong?: boolean }>,
      rows: number,
    ) => {
      const cols = 12
      const padX = 2
      const padY = 6
      const gap = 4
      const cellW = (160 - padX * 2 - gap * (cols - 1)) / cols
      const cellH = (110 - padY * 2 - gap * (rows - 1)) / rows
      return (
        <svg viewBox="0 0 160 110" width="100%" height={86} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          {items.map((it, i) => {
            const x = padX + (it.colStart - 1) * (cellW + gap)
            const y = padY + (it.rowStart - 1) * (cellH + gap)
            const w = it.colSpan * cellW + (it.colSpan - 1) * gap
            const h = it.rowSpan * cellH + (it.rowSpan - 1) * gap
            return <Block key={i} x={x} y={y} w={w} h={h} strong={it.strong} />
          })}
        </svg>
      )
    }

    if (kind === 'main-sub') {
      return renderByGrid(
        [
        { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 1, colSpan: 8, rowStart: 2, rowSpan: 1, strong: true },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1, strong: true },
        { colStart: 1, colSpan: 6, rowStart: 3, rowSpan: 1 },
        { colStart: 7, colSpan: 6, rowStart: 3, rowSpan: 1 },
        ],
        3,
      )
    }

    if (kind === 'matrix-10') {
      return renderByGrid(
        [
          { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
          { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
          { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
          { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
          { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
          { colStart: 4, colSpan: 6, rowStart: 2, rowSpan: 1, strong: true },
          { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
          { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
          { colStart: 4, colSpan: 6, rowStart: 3, rowSpan: 1 },
          { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
        ],
        3,
      )
    }

    if (kind === 'analysis-7') {
      return renderByGrid(
        [
          { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2, strong: true },
          { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1, strong: true },
          { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1, strong: true },
          { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 2, strong: true },
          { colStart: 1, colSpan: 4, rowStart: 3, rowSpan: 1 },
          { colStart: 5, colSpan: 4, rowStart: 3, rowSpan: 1 },
          { colStart: 9, colSpan: 4, rowStart: 3, rowSpan: 1 },
        ],
        3,
      )
    }

    if (kind === 'three-col') {
      return renderByGrid(
        [
        { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 1, strong: true },
        { colStart: 1, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1 },
        ],
        2,
      )
    }

    return renderByGrid(
      [
      { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
      { colStart: 4, colSpan: 6, rowStart: 1, rowSpan: 2, strong: true },
      { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1, strong: true },
      { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 4, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 7, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
      ],
      3,
    )
  }

  const CustomGridPreview = () => {
    return (
      <div style={{ height: 86, borderRadius: 10, border: `1px dashed ${token.colorSplit}`, display: 'grid', placeItems: 'center', color: token.colorTextTertiary }}>
        <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7h16M4 12h16M4 17h16M7 4v16M12 4v16M17 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        </svg>
      </div>
    )
  }

  const canvasRef = useRef<HTMLDivElement | null>(null)

  const templatePositions = useMemo(() => {
    if (layout.mode !== 'template') return null
    if (layout.template === 'main-sub') {
      return [
        { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 8, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 1, colSpan: 6, rowStart: 3, rowSpan: 1 },
        { colStart: 7, colSpan: 6, rowStart: 3, rowSpan: 1 },
      ]
    }
    if (layout.template === 'matrix-10') {
      return [
        { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
        { colStart: 4, colSpan: 6, rowStart: 2, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
        { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
        { colStart: 4, colSpan: 6, rowStart: 3, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
      ]
    }
    if (layout.template === 'three-col') {
      return [
        { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1 },
      ]
    }
    if (layout.template === 'analysis-7') {
      return [
        { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
        { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 2 },
        { colStart: 1, colSpan: 4, rowStart: 3, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 3, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 3, rowSpan: 1 },
      ]
    }
    return [
      { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
      { colStart: 4, colSpan: 6, rowStart: 1, rowSpan: 2 },
      { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
      { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 4, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 7, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
    ]
  }, [layout])

  const gap = layout.mode === 'free' ? Math.max(8, Math.min(32, layout.gap)) : 14
  const freeRows = layout.mode === 'free' ? Math.max(2, Math.min(24, Math.floor(layout.rows || 8))) : 0

  return (
    <div style={{ height: '100%', width: '100%', background: studioShellBg }}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: previewMode ? '1fr' : '320px 1fr 360px', minHeight: 0 }}>
        {previewMode ? null : (
          <div style={{ borderRight: `1px solid ${token.colorSplit}`, background: sidePanelBg, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
                <Button type="text" onClick={() => navigate('/dashboard')} className="iconOnly" aria-label="返回" icon={<ArrowLeft size={18} />} />
                <Typography.Text strong>组件库</Typography.Text>
              </div>
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
                      {g.items.map((it) => (
                        <div
                          key={it.kind}
                          draggable={!readOnly}
                          onDragStart={(e) => {
                            setDraggingKind(it.kind)
                            e.dataTransfer.setData('text/plain', it.kind)
                            e.dataTransfer.setData('application/x-dashboard-widget', it.kind)
                            e.dataTransfer.effectAllowed = 'copy'
                            try {
                              const img = new Image()
                              img.src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
                              e.dataTransfer.setDragImage(img, 0, 0)
                            } catch {
                              // ignore
                            }
                          }}
                          onDragEnd={() => {
                            setDraggingKind(null)
                            setDragOverIdx(null)
                          }}
                          style={{
                            border: `1px solid ${token.colorSplit}`,
                            background: token.colorBgContainer,
                            borderRadius: 14,
                            padding: 12,
                            cursor: readOnly ? 'default' : 'grab',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 10,
                                background: 'transparent',
                                display: 'grid',
                                placeItems: 'center',
                                flex: 'none',
                                color: token.colorTextSecondary,
                              }}
                            >
                              {(() => {
                                const Icon = it.icon
                                return <Icon size={16} />
                              })()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <Typography.Text strong style={{ display: 'block', lineHeight: 1.25 }}>
                                {it.title}
                              </Typography.Text>
                              <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.25, marginTop: 4 }}>
                                {it.desc}
                              </Typography.Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Space>
            </div>
          </div>
        )}

        <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: sidePanelBg }}>
            <Space size={10}>
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', lineHeight: 1.1 }}>
                  {title.trim() || '未命名仪表盘'}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {THEME_NAME[appearance.theme]} · {CHART_PALETTES[appearance.chartPalette].name}
                </Typography.Text>
              </div>
            </Space>
            <Space size={6}>
              <Button icon={<PlayCircleOutlined />} onClick={openDebug}>
                预览
              </Button>
              <Button type="primary" icon={<Save size={16} />} disabled={!canSave} onClick={save}>
                保存
              </Button>
            </Space>
          </div>

          <div style={{ flex: 1, minHeight: 0, padding: 10, background: canvasBg }}>
            <div
              ref={canvasRef}
              onDragOver={(e) => {
                if (readOnly || previewMode) return
                const t = e.target as HTMLElement
                if (!t?.closest?.('.studioSlot')) {
                  if (dragOverIdx != null) setDragOverIdx(null)
                }
              }}
              style={{
                height: '100%',
                minHeight: 0,
                borderRadius: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 16,
                border: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 'none' : `1px solid ${token.colorSplit}`,
                background: appearance.theme === 'obsidian' ? token.colorBgLayout : appearance.theme === 'cyber' || appearance.theme === 'tech' ? 'transparent' : 'rgba(8, 12, 22, 0.70)',
                overflow: 'auto',
                padding: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 12,
                backdropFilter: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? undefined : 'blur(14px)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                  height: layout.mode === 'template' || layout.mode === 'free' ? '100%' : undefined,
                  gridTemplateRows:
                    layout.mode === 'template'
                      ? layout.template === 'main-sub' || layout.template === 'matrix-10'
                        ? '140px minmax(0, 1fr) minmax(0, 1fr)'
                        : layout.template === 'three-col'
                          ? 'minmax(0, 1fr) minmax(0, 1fr)'
                          : 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'
                      : layout.mode === 'free'
                        ? `repeat(${freeRows}, minmax(0, 1fr))`
                        : undefined,
                  gap: layout.mode === 'template' ? 10 : gap,
                  alignItems: 'stretch',
                  minHeight: 0,
                  position: 'relative',
                }}
              >
                {layout.mode === 'free' && !readOnly && !previewMode ? (
                  <div
                    ref={freeOverlayRef}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                      gridTemplateRows: `repeat(${freeRows}, minmax(0, 1fr))`,
                      gap,
                      zIndex: 0,
                      pointerEvents: 'auto',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                    onMouseMove={(e) => {
                      if (layout.mode !== 'free') return
                      const el = freeOverlayRef.current
                      if (!el) return
                      const rect = el.getBoundingClientRect()
                      const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
                      const y = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top))
                      const col = Math.min(12, Math.max(1, Math.floor((x / rect.width) * 12) + 1))
                      const row = Math.min(freeRows, Math.max(1, Math.floor((y / rect.height) * freeRows) + 1))
                      if (freeRafRef.current != null) cancelAnimationFrame(freeRafRef.current)
                      freeRafRef.current = requestAnimationFrame(() => {
                        setFreeHoverPoint((prev) => (prev?.r === row && prev?.c === col ? prev : { r: row, c: col }))
                      })
                    }}
                    onMouseLeave={() => {
                      if (freeRafRef.current != null) cancelAnimationFrame(freeRafRef.current)
                      freeRafRef.current = null
                      setFreeHoverPoint(null)
                    }}
                    onClick={(e) => {
                      if (layout.mode !== 'free') return
                      const el = freeOverlayRef.current
                      if (!el) return
                      const rect = el.getBoundingClientRect()
                      const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
                      const y = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top))
                      const c = Math.min(12, Math.max(1, Math.floor((x / rect.width) * 12) + 1))
                      const r = Math.min(freeRows, Math.max(1, Math.floor((y / rect.height) * freeRows) + 1))

                      if (!freeStartPoint) {
                        setFreeStartPoint({ r, c })
                        setFreeHoverPoint({ r, c })
                        return
                      }

                      const rowStart = Math.min(freeStartPoint.r, r)
                      const rowEnd = Math.max(freeStartPoint.r, r)
                      const colStart = Math.min(freeStartPoint.c, c)
                      const colEnd = Math.max(freeStartPoint.c, c)
                      const nextCard = { colStart, colSpan: colEnd - colStart + 1, rowStart, rowSpan: rowEnd - rowStart + 1 }
                      const overlap = layout.cards.some((x) => {
                        const a1 = x.colStart
                        const a2 = x.colStart + x.colSpan - 1
                        const b1 = nextCard.colStart
                        const b2 = nextCard.colStart + nextCard.colSpan - 1
                        const c1 = x.rowStart
                        const c2 = x.rowStart + x.rowSpan - 1
                        const d1 = nextCard.rowStart
                        const d2 = nextCard.rowStart + nextCard.rowSpan - 1
                        const colOverlap = Math.max(a1, b1) <= Math.min(a2, b2)
                        const rowOverlap = Math.max(c1, d1) <= Math.min(c2, d2)
                        return colOverlap && rowOverlap
                      })
                      if (overlap) {
                        message.error('与已有卡片重叠')
                        return
                      }
                      applyLayout({ ...layout, cards: [...layout.cards, nextCard] })
                      setFreeStartPoint(null)
                      setFreeHoverPoint(null)
                    }}
                  >
                    <div style={{ position: 'absolute', left: 10, top: 10, zIndex: 2, pointerEvents: 'none' }}>
                      <div style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(9, 12, 18, 0.62)', color: token.colorTextSecondary, fontSize: 12, display: 'grid', gap: 4 }}>
                        <div style={{ color: freeStartPoint ? token.colorTextSecondary : token.colorText, fontWeight: freeStartPoint ? 600 : 800 }}>
                          1. 点击起点
                        </div>
                        <div style={{ color: freeStartPoint ? token.colorText : token.colorTextSecondary, fontWeight: freeStartPoint ? 800 : 600 }}>
                          2. 移动鼠标
                        </div>
                        <div style={{ color: freeStartPoint ? token.colorText : token.colorTextSecondary, fontWeight: freeStartPoint ? 800 : 600 }}>
                          3. 点击终点生成卡片
                        </div>
                      </div>
                    </div>
                    {freeStartPoint && freeHoverPoint ? (
                      <div
                        style={{
                          gridColumn: `${Math.min(freeStartPoint.c, freeHoverPoint.c)} / span ${Math.abs(freeStartPoint.c - freeHoverPoint.c) + 1}`,
                          gridRow: `${Math.min(freeStartPoint.r, freeHoverPoint.r)} / span ${Math.abs(freeStartPoint.r - freeHoverPoint.r) + 1}`,
                          background: 'rgba(59, 130, 246, 0.10)',
                          border: `1px solid ${accent}44`,
                          borderRadius: 0,
                        }}
                      />
                    ) : null}

                    {Array.from({ length: freeRows * 12 }).map((_, i) => {
                      const r = Math.floor(i / 12) + 1
                      const c = (i % 12) + 1
                      const isStart = freeStartPoint?.r === r && freeStartPoint?.c === c
                      return (
                        <div
                          key={i}
                          style={{
                            borderRadius: 0,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: isStart ? `radial-gradient(circle at 50% 50%, ${accent} 0 3px, transparent 4px)` : 'transparent',
                            cursor: 'crosshair',
                          }}
                        />
                      )
                    })}
                  </div>
                ) : null}

                {specs.map((spec, idx) => {
                  const slot = slots[idx]
                  if (!slot) return null
                  const isEditing = editingSlotId === slot.id
                  const isSelected = selectedSlotId === slot.id
                  const isDragFrom = dragFromIdx === idx
                  const isDragOver = dragOverIdx === idx
                  const isMoveOver = isDragOver && dragFromIdx != null && dragFromIdx !== idx
                  const pos = (layout.mode === 'free' ? layout.cards : templatePositions)?.[idx]
                  const colSpan = pos ? pos.colSpan : Math.max(1, Math.min(12, spec.colSpan))
                  const rowSpan = pos ? pos.rowSpan : Math.max(1, spec.rowSpan)
                  const borderColor = slot.kind
                    ? slot.error
                      ? token.colorError
                      : isEditing || isSelected
                        ? accent
                        : token.colorSplit
                    : token.colorSplit
                  const surfaceBg =
                    appearance.theme === 'obsidian'
                      ? token.colorBgContainer
                      : appearance.theme === 'tech'
                        ? 'linear-gradient(135deg, rgba(18, 44, 96, 0.62), rgba(10, 16, 28, 0.86))'
                        : appearance.theme === 'cyber'
                          ? 'linear-gradient(135deg, rgba(20, 30, 50, 0.60), rgba(10, 15, 25, 0.80))'
                          : 'rgba(10, 14, 24, 0.76)'
                  return (
                    <div
                      key={slot.id}
                      className={`studioSlot${slot.kind ? ' studioSlotFilled dashboardChartCard' : ' studioSlotEmpty'}${!slot.kind && !readOnly && !previewMode ? ' studioSlotCanDrop' : ''}${isDragFrom ? ' studioSlotDragging' : ''}${isDragOver ? ' studioSlotDragOver' : ''}${isMoveOver ? ' studioSlotMoveOver' : ''}`}
                      style={{
                        ['--studio-accent' as any]: accent,
                        gridColumn: pos ? `${pos.colStart} / span ${colSpan}` : `span ${colSpan}`,
                        gridRow: pos ? `${pos.rowStart} / span ${rowSpan}` : `span ${rowSpan}`,
                        height: layout.mode === 'template' || layout.mode === 'free' ? '100%' : undefined,
                        minHeight: layout.mode === 'template' ? undefined : undefined,
                        borderRadius: 14,
                        border:
                          slot.kind
                            ? `1px solid ${borderColor}`
                            : `1px dashed ${borderColor}`,
                        background:
                          slot.kind
                            ? surfaceBg
                            : appearance.theme === 'obsidian'
                              ? token.colorBgContainer
                              : appearance.theme === 'tech'
                                ? 'linear-gradient(135deg, rgba(18, 44, 96, 0.45), rgba(10, 16, 28, 0.84))'
                                : appearance.theme === 'cyber'
                                  ? 'linear-gradient(135deg, rgba(20, 30, 50, 0.60), rgba(10, 15, 25, 0.80))'
                                  : panelBg,
                        position: 'relative',
                        zIndex: layout.mode === 'free' ? 2 : 1,
                        overflow: 'hidden',
                        cursor: slot.kind ? 'default' : !readOnly && !previewMode ? 'pointer' : 'default',
                        boxShadow: undefined,
                        outline: undefined,
                      }}
                      onClick={() => {
                        if (!slot.kind) return
                        setSelectedSlotId((prev) => (prev === slot.id ? null : slot.id))
                      }}
                      draggable={false}
                      onDragEnter={() => {
                        if (readOnly || previewMode) return
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        setDragOverIdx((prev) => (prev === idx ? prev : idx))
                      }}
                      onDragEnterCapture={() => {
                        if (readOnly || previewMode) return
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        setDragOverIdx((prev) => (prev === idx ? prev : idx))
                      }}
                      onDragOver={(e) => {
                        if (readOnly || previewMode) return
                        e.preventDefault()
                        const isMove = Boolean(e.dataTransfer.types?.includes('application/x-dashboard-slot-index'))
                        const isAdd = Boolean(e.dataTransfer.types?.includes('application/x-dashboard-widget'))
                        e.dataTransfer.dropEffect = isMove ? 'move' : 'copy'
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        if (isMove || isAdd) setDragOverIdx((prev) => (prev === idx ? prev : idx))
                      }}
                      onDragOverCapture={(e) => {
                        if (readOnly || previewMode) return
                        e.preventDefault()
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        setDragOverIdx((prev) => (prev === idx ? prev : idx))
                      }}
                      onDragLeave={() => {}}
                      onDrop={(e) => {
                        if (readOnly || previewMode) return
                        e.preventDefault()
                        const movingIdxRaw = e.dataTransfer.getData('application/x-dashboard-slot-index')
                        if (movingIdxRaw) {
                          const from = Number(movingIdxRaw)
                          if (Number.isFinite(from) && from >= 0 && from < slots.length && from !== idx) {
                            swapSlots(from, idx)
                          }
                          setDragFromIdx(null)
                          setDragOverIdx(null)
                          setDraggingKind(null)
                          requestAnimationFrame(() => setDragOverIdx(null))
                          return
                        }
                        const k = (e.dataTransfer.getData('application/x-dashboard-widget') || e.dataTransfer.getData('text/plain')) as WidgetKind
                        if (!k || !KIND_NAME[k]) return
                        if (slot.kind) return
                        assignWidget(idx, k)
                        setDragOverIdx(null)
                        setDraggingKind(null)
                        requestAnimationFrame(() => setDragOverIdx(null))
                      }}
                    >
                      {isMoveOver ? (
                        <div className="studioMoveOverlay" style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                          <div className="studioMoveOverlayMask" style={{ position: 'absolute', inset: 0 }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                            <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
                              <div
                                className="studioMoveOverlayIcon"
                                style={{ width: 64, height: 64, borderRadius: 16, display: 'grid', placeItems: 'center' }}
                              >
                                <ArrowDownUp size={22} />
                              </div>
                              <Typography.Text className="studioMoveOverlayHint" style={{ fontSize: 14, fontWeight: 700 }}>
                                移入此位置
                              </Typography.Text>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {slot.kind ? (
                        <div className="studioSlotActions" style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tooltip title={readOnly || previewMode ? '查看代码' : '编辑代码'}>
                            <Button
                              type="text"
                              size="small"
                              className="studioSlotIconBtn"
                              icon={<CodeOutlined />}
                              draggable={false}
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation()
                                setEditingSlotId(slot.id)
                              }}
                              aria-label={readOnly || previewMode ? '查看代码' : '编辑代码'}
                            />
                          </Tooltip>
                          <Tooltip title="移除组件">
                            <Button
                              type="text"
                              size="small"
                              className="studioSlotIconBtn"
                              icon={<DeleteOutlined />}
                              disabled={readOnly || previewMode}
                              draggable={false}
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation()
                                setSlot(slot.id, { kind: null, configText: '', error: null })
                                if (editingSlotId === slot.id) setEditingSlotId(null)
                                if (selectedSlotId === slot.id) setSelectedSlotId(null)
                              }}
                              aria-label="移除组件"
                            />
                          </Tooltip>
                        </div>
                      ) : null}

                      {renderSlotBody(slot, idx)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={Boolean(editingSlot)}
          onCancel={() => setEditingSlotId(null)}
          width={editorFullscreen ? 'calc(100vw - 24px)' : 720}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Space size={6}>
                <CodeOutlined />
                <span>代码编辑器</span>
              </Space>
              <Space size={6}>
                <Button
                  type="text"
                  size="small"
                  icon={editorFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                  onClick={() => setEditorFullscreen((v) => !v)}
                />
                <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setEditingSlotId(null)} />
              </Space>
            </div>
          }
          closeIcon={null}
          centered={!editorFullscreen}
          destroyOnClose
          maskClosable
          footer={
            editingSlot && editingSlot.kind ? (
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    if (!editingSlot?.kind) return
                    const k = editingSlot.kind
                    const text = JSON.stringify(defaultConfig(k), null, 2)
                    const v = validateWidget(k, text)
                    setEditorDraft(text)
                    setEditorError('error' in v ? v.error : null)
                  }}
                >
                  重置
                </Button>
                <Space size={6}>
                  <Button onClick={() => setEditingSlotId(null)}>取消</Button>
                  <Button
                    type="primary"
                    disabled={readOnly || previewMode || Boolean(editorError)}
                    onClick={() => {
                      if (!editingSlot?.kind) return
                      const v = validateWidget(editingSlot.kind, editorDraft)
                      const err: WidgetSlot['error'] = 'error' in v ? v.error : null
                      setSlot(editingSlot.id, { configText: editorDraft, error: err })
                      setEditingSlotId(null)
                    }}
                  >
                    保存
                  </Button>
                </Space>
              </div>
            ) : null
          }
        >
          {editingSlot ? (
            <StudioJsonEditor
              slot={editingSlot}
              readOnly={readOnly || previewMode}
              onPickKind={(k) => {
                if (editingIdx < 0) return
                assignWidget(editingIdx, k)
              }}
              text={editorDraft}
              error={editorError}
              fullscreen={editorFullscreen}
              onChangeText={(txt) => {
                if (!editingSlot?.kind) return
                const v = validateWidget(editingSlot.kind, txt)
                setEditorDraft(txt)
                setEditorError('error' in v ? v.error : null)
              }}
            />
          ) : null}
        </Modal>

        {previewMode ? null : (
          <div style={{ borderLeft: `1px solid ${token.colorSplit}`, background: sidePanelBg, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}` }}>
              <Typography.Text strong>页面配置</Typography.Text>
            </div>
            <div style={{ padding: 12, overflow: 'auto', minHeight: 0 }}>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                {(() => {
                  const RequiredLabel = ({ label }: { label: string }) => (
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                      {label}
                    </Typography.Text>
                  )

                  return (
                    <>
                <div>
                  <RequiredLabel label="名称" />
                  <div style={{ height: 6 }} />
                  <Input value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} placeholder="例如：核心运营指标" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <RequiredLabel label="语言" />
                    <div style={{ height: 6 }} />
                    <Select
                      value={appearance.language}
                      disabled={readOnly}
                      onChange={(v) => {
                        setAppearance((p) => ({ ...p, language: v }))
                        setLocale(v)
                        translateSlots(v)
                      }}
                      options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English' }]}
                    />
                  </div>
                  <div>
                    <RequiredLabel label="时区" />
                    <div style={{ height: 6 }} />
                    <Select
                      value={appearance.timeZone}
                      disabled={readOnly}
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

                <div>
                  <RequiredLabel label="主题风格" />
                  <div style={{ height: 8 }} />
                  <ThemeStyleCardPicker
                    value={appearance.theme}
                    disabled={readOnly}
                    onChange={(v) =>
                      setAppearance((p) => ({
                        ...p,
                        theme: v,
                        chartPalette: v === 'tech' ? 'deepsea' : v === 'obsidian' ? 'obsidian' : 'cyber',
                      }))
                    }
                  />
                </div>

                <div>
                  <RequiredLabel label="图表色系" />
                  <div style={{ height: 8 }} />
                  <div className="studioPaletteGrid" style={{ ['--studio-accent' as any]: accent }}>
                    {(Object.keys(CHART_PALETTES) as Array<keyof typeof CHART_PALETTES>).map((id) => {
                      const meta = CHART_PALETTES[id]
                      const selected = appearance.chartPalette === id
                      const cols = meta.colors.slice(0, 6)
                      return (
                        <div
                          key={id}
                          className={`studioPaletteCard${selected ? ' studioPaletteCardActive' : ''}${readOnly ? ' studioPaletteCardDisabled' : ''}`}
                          onClick={() => {
                            if (readOnly) return
                            setAppearance((p) => ({ ...p, chartPalette: safeChartPalette(id) }))
                          }}
                        >
                          <div className="studioPaletteRow">
                            <Typography.Text className="studioPaletteLabel">{meta.name}</Typography.Text>
                            <div className="studioPaletteSwatches">
                              {cols.map((c, i) => (
                                <span key={`${c}-${i}`} className="studioPaletteSwatch" style={{ background: c }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <RequiredLabel label="页面布局" />
                  <div style={{ height: 8 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(
                      [
                        { key: 'main-sub' as const, title: '主次布局', desc: '主次分明/主体突出', icon: <LayoutWireframe kind="main-sub" /> },
                        { key: 'three-col' as const, title: '三列布局', desc: '等分并列/横向对比', icon: <LayoutWireframe kind="three-col" /> },
                        { key: 'sidebar' as const, title: '侧栏布局', desc: '主辅分区/侧边辅助', icon: <LayoutWireframe kind="sidebar" /> },
                        { key: 'matrix-10' as const, title: '矩阵布局', desc: '10宫格/分析主图', icon: <LayoutWireframe kind="matrix-10" /> },
                        { key: 'analysis-7' as const, title: '分析布局', desc: '左右分析/中间主区', icon: <LayoutWireframe kind="analysis-7" /> },
                        { key: 'free' as const, title: '自定义栅格', desc: '自由定义列数与间距', icon: <CustomGridPreview /> },
                      ] as const
                    ).map((it) => {
                      const selected = layout.mode === 'free' ? it.key === 'free' : it.key !== 'free' && layout.template === it.key
                      return (
                        <div
                          key={it.key}
                          onClick={() => {
                            if (readOnly) return
                            if (it.key === 'free') applyLayout({ mode: 'free', cols: 12, rows: 8, gap: 16, cards: [] })
                            else applyLayout({ mode: 'template', template: it.key as any })
                          }}
                          style={{
                            borderRadius: 14,
                            border: `2px solid ${selected ? accent : token.colorSplit}`,
                            background: token.colorBgContainer,
                            cursor: readOnly ? 'default' : 'pointer',
                            padding: 4,
                            opacity: readOnly ? 0.9 : 1,
                          }}
                        >
                          {it.icon}
                          <div style={{ height: 6 }} />
                          <div style={{ paddingInline: 2 }}>
                            <Typography.Text strong style={{ display: 'block', lineHeight: 1.25 }}>
                              {it.title}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.25, marginTop: 2 }}>
                              {it.desc}
                            </Typography.Text>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                    </>
                  )
                })()}

                {layout.mode === 'free' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <Space size={6}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          列数
                        </Typography.Text>
                        <Tooltip title="网格列数（默认 12）">
                          <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                        </Tooltip>
                      </Space>
                      <div style={{ height: 6 }} />
                      <InputNumber
                        style={{ width: '100%' }}
                        min={4}
                        max={24}
                        value={layout.cols}
                        disabled={readOnly}
                        onChange={(v) => setLayout((p) => (p.mode === 'free' ? { ...p, cols: Number(v || 12) } : p))}
                      />
                    </div>
                    <div>
                      <Space size={6}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          行数
                        </Typography.Text>
                        <Tooltip title="网格行数（默认 8）">
                          <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                        </Tooltip>
                      </Space>
                      <div style={{ height: 6 }} />
                      <InputNumber
                        style={{ width: '100%' }}
                        min={2}
                        max={24}
                        value={layout.rows}
                        disabled={readOnly}
                        onChange={(v) => setLayout((p) => (p.mode === 'free' ? { ...p, rows: Number(v || 8) } : p))}
                      />
                    </div>
                    <div>
                      <Space size={6}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          间距
                        </Typography.Text>
                        <Tooltip title="网格间距（像素）">
                          <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                        </Tooltip>
                      </Space>
                      <div style={{ height: 6 }} />
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={40}
                        value={layout.gap}
                        disabled={readOnly}
                        onChange={(v) => setLayout((p) => (p.mode === 'free' ? { ...p, gap: Number(v || 16) } : p))}
                      />
                    </div>
                  </div>
                ) : null}
              </Space>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
