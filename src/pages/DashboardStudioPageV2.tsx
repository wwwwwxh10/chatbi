import { Badge, Button, Empty, Input, InputNumber, Modal, Popover, Select, Space, Tag, Tooltip, Typography, message, theme } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CopyPlus,
  Save,
  AlertTriangle,
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
  ArrowLeftRight,
  Network,
  CircleDot,
  Filter,
  Flower2,
} from 'lucide-react'
import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { EChart } from '../components/EChart'
import { FlipCounter } from '../components/MetricCards'
import { DatasetPreviewModal } from '../components/DatasetPreviewModal'
import { DataTableIcon } from '../components/icons/DataTableIcon'
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
import type { StudioAppearance, StudioLayout, WidgetKind, WidgetSlot } from './studioModel'
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
import { enhanceDashboardChartOption } from './dashboardChartInteractions'
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

  const getStudioPopupContainer = useCallback((node: HTMLElement) => {
    const root = node.closest?.('.studioThemeRoot') as HTMLElement | null
    return root ?? document.body
  }, [])


  const dashboards = useDashboardsStore((s) => s.items)
  const addItem = useDashboardsStore((s) => s.addItem)
  const updateItem = useDashboardsStore((s) => s.updateItem)

  const readOnly = mode === 'preview'
  const dataSources = useMemo(() => buildTables(), [])
  const demoConfigErrorDashboard = useMemo(() => (mode === 'edit' || mode === 'preview') && String(id ?? '') === 'custom-3', [id, mode])
  const demoConfigErrorSlotIndex = useMemo(() => (demoConfigErrorDashboard ? 4 : null), [demoConfigErrorDashboard])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tables, setTables] = useState<string[]>([])
  const [presetId, setPresetId] = useState<string | null>(null)
  const [tablePreviewOpen, setTablePreviewOpen] = useState(false)

  const [appearance, setAppearance] = useState<StudioAppearance>({
    language: locale,
    timeZone: 'UTC+08:00',
    theme: 'obsidian',
    chartPalette: 'cyber',
  })
  const appearanceRef = useRef(appearance)
  appearanceRef.current = appearance
  const [layout, setLayout] = useState<StudioLayout>({ mode: 'template', template: 'main-sub' })

  const specs = useMemo(() => layoutSpecs(layout), [layout])
  const [slots, setSlots] = useState<WidgetSlot[]>(() => normalizeSlots(specs, []))
  const [unplacedSlots, setUnplacedSlots] = useState<WidgetSlot[]>([])
  const [freeStartPoint, setFreeStartPoint] = useState<{ r: number; c: number } | null>(null)
  const [freeHoverPoint, setFreeHoverPoint] = useState<{ r: number; c: number } | null>(null)
  const [freeCursor, setFreeCursor] = useState<{ x: number; y: number } | null>(null)
  const [moveTip, setMoveTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const freeOverlayRef = useRef<HTMLDivElement | null>(null)
  const freeRafRef = useRef<number | null>(null)
  const moveTipRafRef = useRef<number | null>(null)
  const moveTipPendingRef = useRef<{ x: number; y: number; text: string } | null>(null)
  const previewMode = mode === 'preview'
  const unplacedRef = useRef<WidgetSlot[]>([])
  const debugLiveRef = useRef(false)

  const scheduleMoveTip = (next: { x: number; y: number; text: string } | null) => {
    if (next == null) {
      if (moveTipRafRef.current != null) cancelAnimationFrame(moveTipRafRef.current)
      moveTipRafRef.current = null
      moveTipPendingRef.current = null
      setMoveTip(null)
      return
    }
    moveTipPendingRef.current = next
    if (moveTipRafRef.current != null) return
    moveTipRafRef.current = requestAnimationFrame(() => {
      moveTipRafRef.current = null
      const v = moveTipPendingRef.current
      if (!v) return
      setMoveTip((prev) => (prev && prev.x === v.x && prev.y === v.y && prev.text === v.text ? prev : v))
    })
  }

  const openDebug = () => {
    debugLiveRef.current = true
    const payload = {
      title: title.trim() || '未命名仪表盘',
      description: description.trim(),
      tables,
      layout,
      appearance: appearanceRef.current,
      slots: slots.map((s) => ({
        kind: s.kind,
        configText: s.configText,
      })),
    }
    localStorage.setItem('studio:debug-dashboard-v1', JSON.stringify(payload))
    try {
      const ch = new BroadcastChannel('studio:debug-dashboard-v1')
      ch.postMessage(payload)
      ch.close()
    } catch {
    }
    window.open('/dashboard/chat-workspace?debug=studio', '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
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
    const t = window.setTimeout(() => {
      localStorage.setItem('studio:debug-dashboard-v1', JSON.stringify(payload))
      try {
        const ch = new BroadcastChannel('studio:debug-dashboard-v1')
        ch.postMessage(payload)
        ch.close()
      } catch {
      }
    }, 120)
    return () => window.clearTimeout(t)
  }, [title, description, tables, layout, appearance, slots])

  useEffect(() => {
    setSlots((prev) => normalizeSlots(specs, prev))
  }, [specs])

  useEffect(() => {
    unplacedRef.current = unplacedSlots
  }, [unplacedSlots])

  useEffect(() => {
    if (mode === 'new') {
      const initialLayout: StudioLayout = { mode: 'template', template: 'main-sub' }
      setTitle('未命名仪表盘')
      setDescription('')
      setTables([])
      setPresetId(null)
      setAppearance({ language: locale, timeZone: 'UTC+08:00', theme: 'obsidian', chartPalette: 'cyber' })
      setLayout(initialLayout)
      setSlots(normalizeSlots(layoutSpecs(initialLayout), []))
      setUnplacedSlots([])
      return
    }

    const targetId = String(id ?? '')
    const hit = dashboards.find((d) => d.id === targetId)
    if (!hit) return

    setTitle(hit.title)
    setDescription(hit.description ?? '')
    setTables(hit.tables ?? [])

    let obj: any = (() => {
      try {
        return hit.configText ? JSON.parse(hit.configText) : null
      } catch {
        return null
      }
    })()

    const looksLikeStudioConfig = Boolean(obj && typeof obj === 'object' && ('appearance' in obj || 'layout' in obj || 'widgets' in obj || 'unplacedWidgets' in obj))
    const isSampleDashboard = String(hit.id ?? '').startsWith('custom-')
    const isSamplePreset = obj && typeof obj === 'object' && String((obj as any).__preset ?? '') === 'studio-sample-v1'
    const shouldForceSample =
      isSampleDashboard &&
      (mode === 'edit' || mode === 'preview') &&
      (!isSamplePreset || (obj as any)?.appearance?.theme !== 'cyber')
    if (!looksLikeStudioConfig || shouldForceSample) {
      const seedConfig = {
        __preset: 'studio-sample-v1',
        name: hit.title,
        description: hit.description ?? '',
        tables: hit.tables ?? [],
        appearance: { language: locale, timeZone: 'UTC+08:00', theme: 'cyber', chartPalette: 'deepsea' },
        layout: { mode: 'template', template: 'main-sub' },
        widgets: [
          { kind: 'kpi', config: { title: 'ARPU均值', format: 'currency', valueKey: 'arpu' } },
          { kind: 'kpi', config: { title: 'ARPU均值', format: 'currency', valueKey: 'arpu' } },
          { kind: 'flip', config: { title: '在网总用户数', unit: '万', valueKey: 'subs' } },
          { kind: 'progress', config: { title: '告警处理进度', valueKey: 'progress', max: 100 } },
          { kind: 'line', config: { title: 'GMV 趋势', unit: '万', xKey: 'date', yKey: 'gmv' } },
          { kind: 'radar', config: { title: '能力雷达', indicators: ['维度A', '维度B', '维度C', '维度D', '维度E'], valueKey: 'score' } },
          { kind: 'bar', config: { title: '品类对比', unit: '万', xKey: 'category', yKey: 'gmv' } },
          { kind: 'bubble', config: { title: '散点分布', xKey: 'x', yKey: 'y', sizeKey: 'size' } },
        ],
      }
      const nextText = JSON.stringify(seedConfig, null, 2)
      updateItem(String(hit.id ?? ''), { configText: nextText })
      obj = seedConfig
    }
    setPresetId(obj && typeof obj === 'object' ? (typeof (obj as any).__preset === 'string' ? (obj as any).__preset : null) : null)

    const nextAppearance: StudioAppearance = (() => {
      const a = obj?.appearance
      if (!a || typeof a !== 'object') return { language: locale, timeZone: 'UTC+08:00', theme: 'obsidian', chartPalette: 'cyber' }
      const themeVal = (a as any).theme === 'tech' ? 'tech' : (a as any).theme === 'cyber' ? 'cyber' : 'obsidian'
      const pal = safeChartPalette((a as any).chartPalette ?? mapThemeIdToChartPalette((a as any).chartThemeId))
      return {
        language: (a as any).language === 'en-US' ? 'en-US' : 'zh-CN',
        timeZone: typeof (a as any).timeZone === 'string' ? (a as any).timeZone : 'UTC+08:00',
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
    const unplacedWidgets = Array.isArray((obj as any)?.unplacedWidgets) ? ((obj as any).unplacedWidgets as any[]) : []
    const forceRefreshWidgetKinds = new Set<WidgetKind>([
      'kpi',
      'line',
      'line-area',
      'line-curve',
      'bar',
      'bar-h',
      'bar-stacked',
      'bar-grouped',
      'bar-gradient',
      'pie',
      'donut',
      'radar',
      'bubble',
      'funnel',
      'sankey',
    ])
    const nextWidgets = widgets.map((w) => {
      const kind = w?.kind as WidgetKind | undefined
      if (!kind || !KIND_NAME[kind]) return w
      if (!forceRefreshWidgetKinds.has(kind)) return w
      return { ...w, config: defaultConfig(kind) }
    })
    const nextUnplacedWidgets = unplacedWidgets.map((w) => {
      const kind = w?.kind as WidgetKind | undefined
      if (!kind || !KIND_NAME[kind]) return w
      if (!forceRefreshWidgetKinds.has(kind)) return w
      return { ...w, config: defaultConfig(kind) }
    })
    if (looksLikeStudioConfig) {
      const nextText = JSON.stringify({ ...(obj ?? {}), widgets: nextWidgets, unplacedWidgets: nextUnplacedWidgets }, null, 2)
      if (nextText !== String(hit.configText ?? '')) updateItem(String(hit.id ?? ''), { configText: nextText })
    }
    const allWidgets = [...nextWidgets, ...nextUnplacedWidgets]
    const nextSpecs = layoutSpecs(nextLayout)
    const baseSlots =
      nextLayout.mode === 'free'
        ? nextLayout.cards.map((_, idx) => ({ id: `free-${idx + 1}`, kind: null as any, configText: '', error: null }))
        : normalizeSlots(nextSpecs, [])
    const resolvedSlots: WidgetSlot[] = baseSlots.map((s) => ({ ...s }))
    const carry: WidgetSlot[] = []
    for (let i = 0; i < allWidgets.length; i++) {
      const w = allWidgets[i]
      const kind = w?.kind as WidgetKind | undefined
      const cfg = w?.config
      if (!kind || !KIND_NAME[kind]) continue
      const text = JSON.stringify(forceRefreshWidgetKinds.has(kind) ? defaultConfig(kind) : (cfg ?? {}), null, 2)
      const v = validateWidget(kind, text)
      let err: WidgetSlot['error'] = null
      if ('error' in v) err = v.error
      const slot: WidgetSlot = { id: `carry-${i}-${Date.now()}`, kind, configText: text, error: err }
      carry.push(slot)
    }
    const cap = resolvedSlots.length
    for (let i = 0; i < cap; i++) {
      const c = carry[i]
      if (!c) break
      resolvedSlots[i] = { ...resolvedSlots[i], kind: c.kind, configText: c.configText, error: c.error }
    }
    setSlots(resolvedSlots)
    setUnplacedSlots(carry.slice(cap))
  }, [dashboards, dataSources, id, mode])

  const accent = appearance.theme === 'obsidian' ? token.colorPrimary : THEME_ACCENT[appearance.theme]
  const panelBg = appearance.theme === 'obsidian' ? token.colorFillQuaternary : 'rgba(255,255,255,0.020)'

  const cyberPageBgNoGrid =
    'radial-gradient(1200px 700px at 30% 10%, rgba(45, 100, 255, 0.18), transparent 55%), radial-gradient(900px 520px at 80% 30%, rgba(20, 160, 255, 0.14), transparent 58%), radial-gradient(1200px 900px at 60% 120%, rgba(20, 255, 185, 0.08), transparent 60%), #03060c'

  const techPageBgNoGrid =
    'radial-gradient(1200px 700px at 28% 8%, rgba(43, 123, 255, 0.22), transparent 55%), radial-gradient(900px 520px at 78% 30%, rgba(20, 160, 255, 0.16), transparent 58%), radial-gradient(1200px 900px at 60% 120%, rgba(90, 200, 255, 0.10), transparent 60%), #03060c'

  const canvasBg = appearance.theme === 'obsidian' ? token.colorBgLayout : 'transparent'

  const studioShellBg =
    previewMode
      ? appearance.theme === 'obsidian'
        ? token.colorBgLayout
        : '#03060c'
      : appearance.theme === 'obsidian'
        ? token.colorBgLayout
        : appearance.theme === 'tech'
          ? techPageBgNoGrid
          : cyberPageBgNoGrid
  const sidePanelBg = appearance.theme === 'obsidian' ? token.colorBgContainer : 'transparent'

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [draggingKind, setDraggingKind] = useState<WidgetKind | null>(null)
  const [dragFromUnplacedIdx, setDragFromUnplacedIdx] = useState<number | null>(null)
  const [unplacedOpen, setUnplacedOpen] = useState(false)
  const [hoveredUnplacedId, setHoveredUnplacedId] = useState<string | null>(null)

  const [editorDraft, setEditorDraft] = useState<string>('')
  const [editorError, setEditorError] = useState<WidgetSlot['error']>(null)
  const [editorFullscreen, setEditorFullscreen] = useState(false)

  const editingIdx = useMemo(() => (editingSlotId ? slots.findIndex((s) => s.id === editingSlotId) : -1), [editingSlotId, slots])
  const editingSlot = useMemo(() => (editingIdx >= 0 ? slots[editingIdx] : null), [editingIdx, slots])
  const liveEditorError = useMemo(() => {
    if (!editingSlot?.kind) return null
    const v = validateWidget(editingSlot.kind, editorDraft)
    return 'error' in v ? v.error : null
  }, [editorDraft, editingSlot?.kind])

  useEffect(() => {
    if (!editingSlot || !editingSlot.kind) {
      setEditorDraft('')
      setEditorError(null)
      setEditorFullscreen(false)
      return
    }
    const text = editingSlot.configText
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
    const demoInjectedError =
      demoConfigErrorSlotIndex != null && editingIdx === demoConfigErrorSlotIndex && editingSlot.kind
        ? ({
            message:
              editingSlot.kind === 'radar'
                ? 'Schema: metrics 至少 3 项'
                : editingSlot.kind === 'pie' || editingSlot.kind === 'donut'
                  ? 'Schema: 缺少 metric.field'
                  : editingSlot.kind === 'bubble'
                    ? 'Schema: 缺少 bubbleSize.field'
                    : editingSlot.kind === 'funnel'
                      ? 'Schema: 缺少 stageField'
                      : editingSlot.kind === 'sankey'
                        ? 'Schema: 缺少 weight.field'
                        : editingSlot.kind === 'bar' ||
                            editingSlot.kind === 'bar-h' ||
                            editingSlot.kind === 'bar-grouped' ||
                            editingSlot.kind === 'bar-stacked' ||
                            editingSlot.kind === 'bar-gradient' ||
                            editingSlot.kind === 'waterfall'
                          ? 'Schema: yAxis 至少 1 项'
                          : 'Schema: 缺少 xAxis.field',
            line: (() => {
              const msg = String(
                editingSlot.kind === 'radar'
                  ? 'metrics'
                  : editingSlot.kind === 'pie' || editingSlot.kind === 'donut'
                    ? 'metric'
                    : editingSlot.kind === 'bubble'
                      ? 'bubbleSize'
                      : editingSlot.kind === 'funnel'
                        ? 'stageField'
                        : editingSlot.kind === 'sankey'
                          ? 'weight'
                          : editingSlot.kind === 'bar' ||
                              editingSlot.kind === 'bar-h' ||
                              editingSlot.kind === 'bar-grouped' ||
                              editingSlot.kind === 'bar-stacked' ||
                              editingSlot.kind === 'bar-gradient' ||
                              editingSlot.kind === 'waterfall'
                            ? 'yAxis'
                            : 'xAxis',
              )
              return guessLine([msg])
            })(),
          } as WidgetSlot['error'])
        : null
    setEditorDraft(text)
    setEditorError(demoInjectedError ?? editingSlot.error)
    setEditorFullscreen(false)
  }, [demoConfigErrorSlotIndex, editingIdx, editingSlot])

  const applyLayout = (nextLayout: StudioLayout, opts?: { fillFromUnplaced?: boolean }) => {
    const fillFromUnplaced = opts?.fillFromUnplaced !== false
    setEditingSlotId(null)
    setSelectedSlotId(null)
    setDragFromIdx(null)
    setDragOverIdx(null)
    setDragFromUnplacedIdx(null)
    setLayout(nextLayout)
    if (nextLayout.mode === 'free' && layout.mode === 'free') {
      const nextLen = nextLayout.cards.length
      const removed = slots.slice(nextLen).filter((s) => s.kind)
      const remainingUnplaced = unplacedRef.current.filter((s) => s.kind)
      setUnplacedSlots([...remainingUnplaced, ...removed.map((s) => ({ ...s }))])
      setSlots((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]))
        const next = nextLayout.cards.map((_, idx) => {
          const id = `free-${idx + 1}`
          const hit = byId.get(id)
          return hit ? { ...hit, id } : { id, kind: null, configText: '', error: null }
        })
        if (fillFromUnplaced && next.length > prev.length && remainingUnplaced.length) {
          const appendCount = next.length - prev.length
          const take = remainingUnplaced.slice(0, appendCount)
          for (let i = 0; i < take.length; i++) {
            const targetIdx = prev.length + i
            if (!next[targetIdx]) continue
            const c = take[i]
            next[targetIdx] = { ...next[targetIdx], kind: c.kind, configText: c.configText, error: c.error }
          }
          setUnplacedSlots((p) => p.filter((_, idx) => idx >= take.length))
        }
        return next
      })
      return
    }
    const nextSpecs = layoutSpecs(nextLayout)
    const cap = nextSpecs.length
    const placed = slots.filter((s) => s.kind).map((s) => ({ ...s }))
    const unplaced = unplacedRef.current.filter((s) => s.kind).map((s) => ({ ...s }))
    const all = [...placed, ...unplaced]
    const keep = all.slice(0, cap)
    const rest = all.slice(cap)
    const base =
      nextLayout.mode === 'free'
        ? nextLayout.cards.map((_, idx) => ({ id: `free-${idx + 1}`, kind: null as any, configText: '', error: null }))
        : normalizeSlots(nextSpecs, [])
    const nextSlots = base.map((s, idx) => {
      const c = keep[idx]
      if (!c) return { ...s }
      return { ...s, kind: c.kind, configText: c.configText, error: c.error }
    })
    setSlots(nextSlots)
    setUnplacedSlots(rest)
  }

  const unplacedCount = useMemo(() => unplacedSlots.filter((s) => s.kind).length, [unplacedSlots])

  useEffect(() => {
    if (!unplacedCount && unplacedOpen) setUnplacedOpen(false)
  }, [unplacedCount, unplacedOpen])

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

  const removeFreeCard = (idx: number) => {
    if (readOnly || previewMode) return
    if (layout.mode !== 'free') return
    if (idx < 0 || idx >= layout.cards.length) return
    const removed = slots[idx]
    const nextCards = layout.cards.filter((_, i) => i !== idx)
    const nextSlots = slots
      .filter((_, i) => i !== idx)
      .map((s, i) => ({
        ...s,
        id: `free-${i + 1}`,
      }))
    setEditingSlotId(null)
    setSelectedSlotId(null)
    setDragFromIdx(null)
    setDragOverIdx(null)
    setDraggingKind(null)
    setDragFromUnplacedIdx(null)
    scheduleMoveTip(null)
    setLayout({ ...layout, cards: nextCards })
    setSlots(nextSlots)
    if (removed?.kind) {
      const nextUnplaced = unplacedSlots.slice(0)
      nextUnplaced.push({ ...removed, id: `unplaced-${Date.now()}-${Math.random().toString(36).slice(2)}` })
      setUnplacedSlots(nextUnplaced)
    }
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
    scheduleMoveTip(null)
  }

  useEffect(() => {
    if (dragFromIdx == null && dragFromUnplacedIdx == null && draggingKind == null && dragOverIdx != null) {
      setDragOverIdx(null)
      requestAnimationFrame(() => setDragOverIdx(null))
    }
  }, [dragFromIdx, dragFromUnplacedIdx, dragOverIdx, draggingKind])

  useEffect(() => {
    const clear = () => {
      setDragFromIdx(null)
      setDragOverIdx(null)
      setDraggingKind(null)
      setDragFromUnplacedIdx(null)
    }
    window.addEventListener('dragend', clear)
    window.addEventListener('drop', clear)
    return () => {
      window.removeEventListener('dragend', clear)
      window.removeEventListener('drop', clear)
    }
  }, [])

  useEffect(() => {
    if (readOnly || previewMode) return
    if (dragFromIdx == null) return
    const onDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault()
      scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
    }
    window.addEventListener('dragover', onDragOver)
    return () => {
      window.removeEventListener('dragover', onDragOver)
    }
  }, [dragFromIdx, previewMode, readOnly])

  useEffect(() => {
    if (readOnly || previewMode) return
    if (dragFromIdx == null && dragFromUnplacedIdx == null) return
    const prev = document.body.style.cursor
    document.body.style.cursor = 'default'
    return () => {
      document.body.style.cursor = prev
    }
  }, [dragFromIdx, dragFromUnplacedIdx, previewMode, readOnly])

  const canSave = useMemo(() => {
    if (readOnly) return false
    if (!title.trim()) return false
    if (slots.some((s) => s.kind && s.error)) return false
    if (unplacedSlots.some((s) => s.kind && s.error)) return false
    return true
  }, [readOnly, slots, title, unplacedSlots])

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
        if (typeof next.unit === 'string') {
          if (to === 'en-US' && next.unit === '万') next.unit = 'k'
          if (to === 'zh-CN' && next.unit === 'k') next.unit = '万'
        }
        const text = JSON.stringify(next, null, 2)
        const v = validateWidget(s.kind, text)
        const err: WidgetSlot['error'] = 'error' in v ? v.error : null
        return { ...s, configText: text, error: err }
      }),
    )
    setUnplacedSlots((prev) =>
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
        if (typeof next.unit === 'string') {
          if (to === 'en-US' && next.unit === '万') next.unit = 'k'
          if (to === 'zh-CN' && next.unit === 'k') next.unit = '万'
        }
        const text = JSON.stringify(next, null, 2)
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
    const unit = (() => {
      if (typeof parsed.unit === 'string') return String(parsed.unit)
      const ct = typeof parsed.chartType === 'string' ? String(parsed.chartType) : ''
      if (ct === 'MetricCard') return String(parsed.metrics?.[0]?.unit ?? '')
      if (ct === 'Line') return String(parsed.yAxis?.[0]?.unit ?? '')
      if (ct === 'Bar') return String(parsed.yAxis?.[0]?.unit ?? '')
      if (ct === 'Donut') return String(parsed.metric?.unit ?? '')
      if (ct === 'Bubble') return String(parsed.bubbleSize?.unit ?? parsed.yAxis?.unit ?? parsed.xAxis?.unit ?? '')
      if (ct === 'Funnel') return String(parsed.metric?.unit ?? '')
      if (ct === 'Sankey') return String(parsed.settings?.unit ?? parsed.weight?.unit ?? '')
      return ''
    })()
    const colors = CHART_PALETTES[appearance.chartPalette].colors.slice(0, 10)
    const name = String(parsed.title ?? KIND_NAME[slot.kind])
    const base =
      slot.kind === 'bar'
        ? buildBarOption(name, colors, unit)
        : slot.kind === 'bar-h'
          ? buildHBarOption(name, colors, unit)
        : slot.kind === 'bar-stacked'
          ? buildStackedBarOption(name, colors, unit)
          : slot.kind === 'bar-grouped'
            ? buildGroupedBarOption(name, colors, unit)
            : slot.kind === 'bar-gradient'
              ? buildGradientBarOption(name, colors, unit)
                : slot.kind === 'waterfall'
                  ? buildBarOption(name, colors, unit)
              : slot.kind === 'line'
          ? buildLineOption(name, colors, unit)
          : slot.kind === 'line-area'
            ? buildAreaOption(name, colors, unit)
            : slot.kind === 'line-curve'
              ? buildCurveOption(name, colors, unit)
              : slot.kind === 'scatter'
                ? buildScatterOption(name, colors, unit)
                : slot.kind === 'bubble'
                  ? buildBubbleOption(name, colors, unit)
                  : slot.kind === 'pie'
                    ? buildPieOption(name, colors, unit)
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

  const fitOptionForFreeCard = (opt: any, idx: number) => {
    if (layout.mode !== 'free') return opt
    const pos = layout.cards?.[idx]
    if (!pos) return opt
    const colSpan = Math.max(1, Number(pos.colSpan || 1))
    const rowSpan = Math.max(1, Number(pos.rowSpan || 1))
    const area = colSpan * rowSpan
    const compact = rowSpan <= 1 || area <= 6
    const tiny = area <= 3
    const next: any = { ...(opt ?? {}) }

    if (next.legend && typeof next.legend === 'object') {
      const legendShow = Boolean((next.legend as any).show)
      const show = legendShow && !compact
      next.legend = {
        ...(next.legend as any),
        show,
        bottom: show ? (compact ? 4 : (next.legend as any).bottom ?? 8) : (next.legend as any).bottom,
        itemGap: compact ? 12 : (next.legend as any).itemGap ?? 24,
        textStyle: {
          ...((next.legend as any).textStyle ?? {}),
          fontSize: compact ? 11 : ((next.legend as any).textStyle?.fontSize ?? 12),
        },
      }
    }

    if (next.grid && typeof next.grid === 'object' && !Array.isArray(next.grid)) {
      const legendShown = Boolean(next.legend && (next.legend as any).show)
      const lr = tiny ? 8 : compact ? 10 : (next.grid as any).left ?? 30
      const top = tiny ? 22 : compact ? 24 : (next.grid as any).top ?? 36
      const bottom = tiny ? (legendShown ? 30 : 10) : compact ? (legendShown ? 30 : 12) : (next.grid as any).bottom
      next.grid = {
        ...(next.grid as any),
        left: lr,
        right: lr,
        top,
        bottom,
        containLabel: true,
      }
    }

    const patchAxis = (axis: any) => {
      if (!axis || typeof axis !== 'object') return axis
      const t = String(axis.type ?? '')
      const isCategory = t === 'category'
      const isValue = t === 'value' || t === 'log' || t === 'time'
      const isEn = appearance.language === 'en-US'
      const formatCompactNumber = (v: any) => {
        const n = typeof v === 'number' ? v : Number(v)
        if (!Number.isFinite(n)) return String(v ?? '')
        const abs = Math.abs(n)
        if (isEn) {
          if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`
          if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
          if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`
          return String(n)
        }
        if (abs >= 1e8) return `${(n / 1e8).toFixed(1)}亿`
        if (abs >= 1e4) return `${(n / 1e4).toFixed(1)}万`
        if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`
        return String(n)
      }
      const formatCompactText = (v: any) => {
        const s = String(v ?? '')
        if (!compact) return s
        const maxLen = tiny ? 3 : 5
        return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
      }
      return {
        ...axis,
        ...(compact && isValue ? { splitNumber: axis.splitNumber ?? 3 } : null),
        axisLabel: {
          ...(axis.axisLabel ?? {}),
          show: axis.axisLabel?.show ?? true,
          hideOverlap: compact ? true : axis.axisLabel?.hideOverlap,
          rotate: isCategory && compact ? (tiny ? 45 : 30) : axis.axisLabel?.rotate,
          interval: isCategory && compact ? 'auto' : axis.axisLabel?.interval,
          fontSize: compact ? 11 : axis.axisLabel?.fontSize,
          margin: compact ? 2 : axis.axisLabel?.margin,
          formatter: compact
            ? isCategory
              ? (v: any) => formatCompactText(v)
              : isValue
                ? (v: any) => formatCompactNumber(v)
                : axis.axisLabel?.formatter
            : axis.axisLabel?.formatter,
        },
      }
    }
    if (Array.isArray(next.xAxis)) next.xAxis = next.xAxis.map(patchAxis)
    else if (next.xAxis) next.xAxis = patchAxis(next.xAxis)
    if (Array.isArray(next.yAxis)) next.yAxis = next.yAxis.map(patchAxis)
    else if (next.yAxis) next.yAxis = patchAxis(next.yAxis)

    const seriesList: any[] = Array.isArray(next.series) ? next.series : next.series ? [next.series] : []
    if (seriesList.length) {
      const type = String(seriesList[0]?.type ?? '')
      if (type === 'pie') {
        next.series = seriesList.map((s) => ({
          ...s,
          center: ['50%', compact ? '52%' : '45%'],
          radius: (() => {
            const r = Array.isArray(s.radius) ? s.radius : null
            if (compact) {
              if (r && r.length >= 2) return [r[0], '82%']
              return ['0%', '82%']
            }
            return r ?? ['0%', '76%']
          })(),
          label: compact ? { ...(s.label ?? {}), show: false } : s.label,
          labelLine: compact ? { ...(s.labelLine ?? {}), show: false } : s.labelLine,
        }))
      } else if (type === 'radar') {
        if (next.radar && typeof next.radar === 'object') {
          next.radar = { ...(next.radar as any), radius: compact ? '58%' : (next.radar as any).radius ?? '62%', center: ['50%', '56%'] }
        }
      } else if (type === 'funnel') {
        next.series = seriesList.map((s) => ({
          ...s,
          left: compact ? 8 : s.left,
          right: compact ? 8 : s.right,
          top: compact ? 18 : s.top,
          bottom: compact ? 8 : s.bottom,
        }))
      } else if (type === 'gauge') {
        next.series = seriesList.map((s) => ({
          ...s,
          center: ['50%', compact ? '56%' : '58%'],
          radius: s.radius ?? (compact ? '92%' : '96%'),
        }))
      } else if (type === 'liquidFill') {
        next.series = seriesList.map((s) => ({
          ...s,
          radius: s.radius ?? (compact ? '82%' : '88%'),
          center: ['50%', compact ? '56%' : '58%'],
        }))
      } else if (type === 'line') {
        next.series = seriesList.map((s) => ({
          ...s,
          symbolSize: compact ? 6 : s.symbolSize,
          lineStyle: { ...(s.lineStyle ?? {}), width: compact ? Math.min(2, Number(s.lineStyle?.width ?? 2) || 2) : s.lineStyle?.width },
        }))
      } else if (type === 'bar') {
        next.series = seriesList.map((s) => ({
          ...s,
          barWidth: compact ? Math.min(14, Number(s.barWidth ?? 14) || 14) : s.barWidth,
        }))
      } else if (type === 'treemap' || type === 'sankey' || type === 'graph' || type === 'heatmap') {
        next.series = seriesList.map((s) => ({
          ...s,
          left: compact ? 10 : s.left,
          right: compact ? 10 : s.right,
          top: compact ? 10 : s.top,
          bottom: compact ? 10 : s.bottom,
        }))
      }
    }

    return next
  }

  const renderSlotBody = (slot: WidgetSlot, idx: number) => {
    if (!slot.kind) {
      if (readOnly || previewMode) {
        return (
          <div style={{ height: '100%', position: 'relative', display: 'grid', placeItems: 'center', color: token.colorTextSecondary }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
              {appearance.language === 'en-US' ? 'Not Configured' : '未配置'}
            </Typography.Text>
          </div>
        )
      }
      return (
        <div style={{ height: '100%', position: 'relative', display: 'grid', placeItems: 'center', color: token.colorTextSecondary }}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <div className="studioSlotAdd" style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center' }}>
              <CopyPlus size={20} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 34px)', display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <Typography.Text className="studioSlotHint" style={{ fontSize: 12, color: 'inherit', fontWeight: 600 }}>
              {appearance.language === 'en-US' ? 'Drag from the left panel to add' : '从左侧拖拽组件到此处'}
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
    const swapHint = appearance.language === 'en-US' ? 'Drag to reorder' : '拖拽可移动换位'

    const demoInjectedError =
      demoConfigErrorSlotIndex != null && idx === demoConfigErrorSlotIndex && slot.kind && !slot.error
        ? ({
            message:
              slot.kind === 'radar'
                ? 'Schema: indicators 至少 3 项'
                : slot.kind === 'pie' || slot.kind === 'donut' || slot.kind === 'rose'
                  ? 'Schema: 缺少 valueKey'
                  : slot.kind === 'heatmap'
                    ? 'Schema: 缺少 valueKey'
                    : slot.kind === 'funnel'
                      ? 'Schema: 缺少 stageKey'
                      : slot.kind === 'treemap'
                        ? 'Schema: 缺少 labelKey'
                        : slot.kind === 'sankey'
                          ? 'Schema: 缺少 sourceKey'
                          : slot.kind === 'graph'
                            ? 'Schema: 缺少 sourceKey'
                            : 'Schema: 缺少 xKey',
          } as WidgetSlot['error'])
        : null
    const slotError = slot.error ?? demoInjectedError
    if (slotError) {
      return (
        <div style={{ padding: 16, height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: 10, textAlign: 'center' }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(248,113,113,0.10)',
                color: 'rgba(248,113,113,0.95)',
              }}
            >
              <AlertTriangle size={20} />
            </span>
            <Typography.Text style={{ fontWeight: 700, color: token.colorText }}>
              {appearance.language === 'en-US' ? 'Invalid widget config' : '组件配置异常'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
              {slotError.message}
            </Typography.Text>
          </div>
        </div>
      )
    }

    if (slot.kind === 'flip') {
      const baseRaw = Number(parsed?.value ?? 6_894)
      const base = Number.isFinite(baseRaw) ? baseRaw : 0
      const value = Math.max(0, Math.round(base))
      const unit = String(parsed?.unit ?? '次')
      const titleText = chartTitle
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div
            className="studioSlotHeader"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
            draggable={!readOnly && !previewMode}
            onMouseMove={(e) => {
              if (readOnly || previewMode) return
              if (dragFromIdx != null || draggingKind != null) return
              scheduleMoveTip({ x: e.clientX, y: e.clientY, text: swapHint })
            }}
            onMouseLeave={() => scheduleMoveTip(null)}
            onDragStart={(e) => onSlotDragStart(idx, e)}
            onDragEnd={onSlotDragEnd}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Space size={4}>
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
                  {titleText}
                </Typography.Text>
              </Space>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'grid', alignContent: 'center', gap: 10, paddingTop: 12 }}>
            <FlipCounter title={titleText} unit={unit} target={value} showTitle={false} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span />
            {slot.error ? <Tag color="error">解析失败</Tag> : null}
          </div>
        </div>
      )
    }

    if (slot.kind === 'progress') {
      const pct = Math.max(0, Math.min(100, Number(parsed?.percent ?? 78) || 0))
      const v = String(parsed?.value ?? '15.6k')
      const unit = String(parsed?.unit ?? '个')
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            className="studioSlotHeader"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
            draggable={!readOnly && !previewMode}
            onMouseMove={(e) => {
              if (readOnly || previewMode) return
              if (dragFromIdx != null || draggingKind != null) return
              scheduleMoveTip({ x: e.clientX, y: e.clientY, text: swapHint })
            }}
            onMouseLeave={() => scheduleMoveTip(null)}
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
                    color: accent,
                  }}
                >
                  <Workflow size={14} />
                </span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {chartTitle}
                </Typography.Text>
              </Space>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'grid', alignContent: 'center', gap: 10, paddingTop: 12 }}>
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
          <div
            className="studioSlotHeader"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
            draggable={!readOnly && !previewMode}
            onMouseMove={(e) => {
              if (readOnly || previewMode) return
              if (dragFromIdx != null || draggingKind != null) return
              scheduleMoveTip({ x: e.clientX, y: e.clientY, text: swapHint })
            }}
            onMouseLeave={() => scheduleMoveTip(null)}
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
                    color: accent,
                  }}
                >
                  <Zap size={14} />
                </span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {name}
                </Typography.Text>
              </Space>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>{kpiValue(fmt)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Typography.Text style={{ fontSize: 12, color: '#22c55e' }}>
              {appearance.language === 'en-US' ? 'YoY +12.4%' : '同比 +12.4%'}
            </Typography.Text>
            {slot.error ? <Tag color="error">解析失败</Tag> : null}
          </div>
        </div>
      )
    }


    const opt = optionForSlot(slot)
    const fittedOpt = opt ? fitOptionForFreeCard(opt as any, idx) : null
    const renderOpt =
      fittedOpt && slot.kind
        ? (enhanceDashboardChartOption(slot.kind, fittedOpt as any, { accent, mode: 'preview' }) as any)
        : fittedOpt
    const freePos = layout.mode === 'free' ? layout.cards?.[idx] : null
    const freeArea = freePos ? Math.max(1, Number(freePos.colSpan || 1)) * Math.max(1, Number(freePos.rowSpan || 1)) : 0
    const freeCompact = layout.mode === 'free' && freePos ? Math.max(1, Number(freePos.rowSpan || 1)) <= 1 || freeArea <= 6 : false
    const freeTiny = layout.mode === 'free' && freePos ? freeArea <= 3 : false
    const shellPadding = freeTiny ? 8 : freeCompact ? 10 : 16
    return opt ? (
      <div style={{ padding: shellPadding, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          className="studioSlotHeader"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
          draggable={!readOnly && !previewMode}
          onMouseMove={(e) => {
            if (readOnly || previewMode) return
            if (dragFromIdx != null || draggingKind != null) return
            scheduleMoveTip({ x: e.clientX, y: e.clientY, text: swapHint })
          }}
          onMouseLeave={() => scheduleMoveTip(null)}
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
                  color: accent,
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
                          ? Activity
                          : k === 'bar'
                            ? BarChart3
                            : k === 'bar-h'
                              ? ArrowDownUp
                              : k === 'bar-grouped'
                                ? Boxes
                                : k === 'bar-stacked'
                                  ? Layers
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
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {chartTitle}
              </Typography.Text>
            </Space>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, paddingTop: slot.kind === 'funnel' ? 0 : freeTiny ? 2 : freeCompact ? 4 : 10 }}>
          <EChart option={renderOpt as any} datumSelectable={previewMode ? undefined : false} legendSingleLine style={layout.mode === 'free' ? { minHeight: 0 } : undefined} />
        </div>
      </div>
    ) : (
      <div style={{ padding: shellPadding, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          className="studioSlotHeader"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
          draggable={!readOnly && !previewMode}
          onMouseMove={(e) => {
            if (readOnly || previewMode) return
            if (dragFromIdx != null || draggingKind != null) return
            scheduleMoveTip({ x: e.clientX, y: e.clientY, text: swapHint })
          }}
          onMouseLeave={() => scheduleMoveTip(null)}
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
                  color: accent,
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
                          ? Activity
                          : k === 'bar'
                            ? BarChart3
                            : k === 'bar-h'
                              ? ArrowDownUp
                              : k === 'bar-grouped'
                                ? Boxes
                                : k === 'bar-stacked'
                                  ? Layers
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
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {chartTitle}
              </Typography.Text>
            </Space>
          </div>
          {null}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
        </div>
      </div>
    )
  }

  const save = async () => {
    if (!canSave) return
    const widgets = slots
      .filter((s) => s.kind)
      .map((s) => ({ kind: s.kind, config: (() => { try { return JSON.parse(s.configText) } catch { return {} } })() }))
    const unplacedWidgets = unplacedSlots
      .filter((s) => s.kind)
      .map((s) => ({ kind: s.kind, config: (() => { try { return JSON.parse(s.configText) } catch { return {} } })() }))
    const payload = {
      ...(presetId ? { __preset: presetId } : {}),
      name: title.trim(),
      description: description.trim(),
      tables,
      layout,
      appearance,
      widgets,
      ...(unplacedWidgets.length ? { unplacedWidgets } : {}),
    }
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

  const libraryMetaByKind = useMemo(() => {
    const m = new Map<WidgetKind, { icon: any; title: string }>()
    for (const g of libraryGroups) {
      for (const it of g.items) {
        m.set(it.kind, { icon: it.icon, title: it.title })
      }
    }
    return m
  }, [libraryGroups])

  const ThemeStyleCardPicker = ({
    value,
    onChange,
    disabled,
  }: {
    value: StudioAppearance['theme']
    onChange: (v: StudioAppearance['theme']) => void
    disabled?: boolean
  }) => {
    const themeSurfaceBg: Record<StudioAppearance['theme'], string> = {
      obsidian: token.colorBgContainer,
      tech: 'rgba(10, 16, 28, 0.86)',
      cyber: 'rgba(10, 15, 25, 0.82)',
    }
    const items = [
      {
        key: 'obsidian' as const,
        label: '曜石蓝黑',
        desc: '沉稳克制，适合运维监控',
      },
      {
        key: 'cyber' as const,
        label: '暗影墨蓝',
        desc: '幽邃暗沉，适合科技感主题',
      },
      {
        key: 'tech' as const,
        label: '深海湛蓝',
        desc: '睿智深邃，适合指挥大屏',
      },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {items.map((it) => {
          const selected = value === it.key
          const surfaceBg = themeSurfaceBg[it.key]
          return (
            <div
              key={it.key}
              onClick={() => {
                if (disabled) return
                onChange(it.key)
              }}
              style={{
                borderRadius: 14,
                border: `1px solid ${selected ? accent : 'var(--studio-field-border)'}`,
                background: surfaceBg,
                cursor: disabled ? 'default' : 'pointer',
                padding: 10,
                opacity: disabled ? 0.9 : 1,
                transition: 'border-color 200ms ease, transform 200ms ease',
                position: 'relative',
                overflow: 'hidden',
                color: token.colorTextSecondary,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', zIndex: 1 }}>
                <Typography.Text strong style={{ display: 'block', lineHeight: 1.25, color: selected ? accent : undefined }}>
                  {it.label}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.25, marginTop: 2, opacity: 0.8 }}>
                  {it.desc}
                </Typography.Text>
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
      const padX = 0
      const padY = 0
      const gap = 3
      const cellW = (160 - padX * 2 - gap * (cols - 1)) / cols
      const cellH = (110 - padY * 2 - gap * (rows - 1)) / rows
      return (
        <svg viewBox="0 0 160 110" width="100%" height={74} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
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
      <div
        style={{
          height: 74,
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 8,
          border: `1px dashed ${token.colorSplit}`,
          display: 'grid',
          placeItems: 'center',
          color: token.colorTextTertiary,
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7h16M4 12h16M4 17h16M7 4v16M12 4v16M17 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        </svg>
      </div>
    )
  }

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const rightPanelBodyRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToFreeRef = useRef(false)

  const scrollRightPanelToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = rightPanelBodyRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    if (!shouldScrollToFreeRef.current) return
    if (layout.mode !== 'free') return
    shouldScrollToFreeRef.current = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollRightPanelToBottom('smooth'))
    })
  }, [layout.mode, scrollRightPanelToBottom])

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
  const freeCols = layout.mode === 'free' ? Math.max(4, Math.min(24, Math.floor(layout.cols || 12))) : 12
  const freeRows = layout.mode === 'free' ? Math.max(2, Math.min(24, Math.floor(layout.rows || 8))) : 0

  const fieldBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'rgba(10, 20, 38, 0.70)'
        : 'rgba(10, 16, 32, 0.70)'
  const fieldBorder =
    appearance.theme === 'obsidian'
      ? token.colorSplit
      : appearance.theme === 'tech'
        ? 'rgba(43, 123, 255, 0.22)'
        : 'rgba(45, 100, 255, 0.22)'
  const panelCardBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'rgba(10, 20, 38, 0.76)'
        : 'rgba(10, 16, 32, 0.76)'
  const popupBg = appearance.theme === 'obsidian' ? token.colorBgElevated : 'rgba(6, 10, 18, 0.98)'

  const slotBodies = useMemo(
    () => slots.map((s, idx) => renderSlotBody(s, idx)),
    [
      slots,
      appearance.chartPalette,
      appearance.language,
      appearance.theme,
      readOnly,
      previewMode,
      accent,
      token.colorError,
      token.colorText,
      token.colorTextSecondary,
      demoConfigErrorSlotIndex,
    ],
  )

  return (
    <div
      className="studioThemeRoot"
      style={{
        height: '100%',
        width: '100%',
        background: studioShellBg,
        ['--studio-accent' as any]: accent,
        ['--studio-field-bg' as any]: fieldBg,
        ['--studio-field-border' as any]: fieldBorder,
        ['--studio-panel-card-bg' as any]: panelCardBg,
        ['--studio-popup-bg' as any]: popupBg,
      }}
    >
      <div
        className="studioShellGrid"
        style={{ height: '100%', display: 'grid', gridTemplateColumns: '300px 1fr 300px', minHeight: 0, position: 'relative' }}
      >
        <div
          style={{
            borderRight: `1px solid ${token.colorSplit}`,
            background: sidePanelBg,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 3,
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06), inset -2px 0 0 rgba(0,0,0,0.35)',
          }}
        >
          <div className="studioColHeader" style={{ background: sidePanelBg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
              <Button type="text" onClick={() => navigate('/dashboard')} className="iconOnly" aria-label="返回" icon={<ArrowLeft size={18} />} />
              <Typography.Text strong>组件库</Typography.Text>
            </div>
          </div>
          <div className="studioColBody studioLibraryBody" style={{ padding: 12 }}>
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
                        className="studioLibraryCard"
                        draggable={!readOnly}
                        onDragStart={(e) => {
                          setDraggingKind(it.kind)
                          e.dataTransfer.setData('text/plain', it.kind)
                          e.dataTransfer.setData('application/x-dashboard-widget', it.kind)
                          e.dataTransfer.effectAllowed = 'copy'
                          try {
                            const img = new Image()
                            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
                            e.dataTransfer.setDragImage(img, 0, 0)
                          } catch {
                            // ignore
                          }
                        }}
                        onDragEnd={() => {
                          setDraggingKind(null)
                          setDragOverIdx(null)
                        }}
                        style={{ border: `1px solid var(--studio-field-border)`, background: 'var(--studio-panel-card-bg)', borderRadius: 14, padding: 12, cursor: readOnly ? 'default' : 'grab' }}
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
                            <Typography.Text
                              type="secondary"
                              style={{ display: 'block', fontSize: 12, lineHeight: 1.25, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
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

        <div style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          <div className="studioColHeader" style={{ justifyContent: 'space-between', gap: 12, background: sidePanelBg }}>
            <Space size={10}>
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', lineHeight: 1.1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title.trim() || '未命名仪表盘'}
                    </span>
                    <span
                      onClick={() => setTablePreviewOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: token.colorTextSecondary,
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: 1,
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        flex: 'none',
                      }}
                    >
                      <DataTableIcon size={14} color={token.colorTextSecondary} />
                      {tables.length}
                    </span>
                  </span>
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {THEME_NAME[appearance.theme]} · {CHART_PALETTES[appearance.chartPalette].name}
                </Typography.Text>
              </div>
            </Space>
            <Space size={6}>
              {previewMode ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/dashboard/studio/${encodeURIComponent(String(id ?? ''))}`)}>
                  编辑
                </Button>
              ) : (
                <>
                  <Button icon={<PlayCircleOutlined />} onClick={openDebug}>
                    预览
                  </Button>
                  <Button type="primary" icon={<Save size={16} />} disabled={!canSave} onClick={save}>
                    保存
                  </Button>
                </>
              )}
            </Space>
          </div>

          <div style={{ flex: 1, minHeight: 0, padding: 10, background: canvasBg }}>
            <div
              ref={canvasRef}
              onDragOver={(e) => {
                if (readOnly || previewMode) return
                if (dragFromIdx != null) {
                  e.preventDefault()
                  scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
                }
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
                overflow: layout.mode === 'free' ? 'hidden' : 'auto',
                padding: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 12,
                backdropFilter: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? undefined : 'blur(14px)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${layout.mode === 'free' ? freeCols : 12}, minmax(0, 1fr))`,
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
                  padding: 0,
                }}
              >
                {!readOnly && !previewMode && unplacedCount ? (
                  <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 80, pointerEvents: 'auto' }}>
                    <Popover
                      placement="topLeft"
                      open={unplacedOpen}
                      onOpenChange={(next) => {
                        setUnplacedOpen(next)
                        if (!next) setHoveredUnplacedId(null)
                      }}
                      getPopupContainer={getStudioPopupContainer}
                      overlayInnerStyle={{
                        padding: 0,
                        borderRadius: 12,
                        background: 'rgba(6, 10, 18, 0.62)',
                        border: `1px solid ${accent}1f`,
                        overflow: 'hidden',
                        backdropFilter: 'blur(14px)',
                      }}
                      content={
                        <div style={{ width: 240, maxWidth: 'calc(100vw - 40px)' }}>
                          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: `1px solid ${accent}22` }}>
                            <Typography.Text strong style={{ color: token.colorText }}>
                              未放置组件
                            </Typography.Text>
                            <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                              {unplacedCount}
                            </Tag>
                          </div>
                          <div style={{ padding: 8, maxHeight: 240, overflow: 'auto' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', padding: '2px 4px 8px 4px' }}>
                              拖到空槽位，或拖拽替换已有图表
                            </Typography.Text>
                            {unplacedSlots
                              .map((s, i) => ({ s, i }))
                              .filter(({ s }) => Boolean(s.kind))
                              .map(({ s, i }) => {
                                const kind = s.kind as WidgetKind
                                const meta = libraryMetaByKind.get(kind)
                                const Icon = (meta?.icon ?? Layers) as any
                                const titleText = (() => {
                                  try {
                                    const obj: any = s.configText ? JSON.parse(s.configText) : null
                                    const t = typeof obj?.title === 'string' ? obj.title : ''
                                    return t.trim() || meta?.title || KIND_NAME[kind] || '组件'
                                  } catch {
                                    return meta?.title || KIND_NAME[kind] || '组件'
                                  }
                                })()
                                return (
                                  <div
                                    key={s.id}
                                    draggable={!readOnly && !previewMode}
                                    onDragStart={(e) => {
                                      setDragFromUnplacedIdx(i)
                                      scheduleMoveTip(null)
                                      setDragOverIdx(null)
                                      e.dataTransfer.setData('application/x-dashboard-unplaced-index', String(i))
                                      e.dataTransfer.effectAllowed = 'move'
                                      try {
                                        const img = new Image()
                                        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
                                        e.dataTransfer.setDragImage(img, 0, 0)
                                      } catch {
                                        // ignore
                                      }
                                    }}
                                    onDragEnd={() => {
                                      setDragFromUnplacedIdx(null)
                                    }}
                                    onMouseEnter={() => setHoveredUnplacedId(s.id)}
                                    onMouseLeave={() => setHoveredUnplacedId((prev) => (prev === s.id ? null : prev))}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '6px 8px',
                                      borderRadius: 10,
                                      cursor: readOnly || previewMode ? 'default' : 'grab',
                                      border: `1px solid ${dragFromUnplacedIdx === i ? accent : 'transparent'}`,
                                      background: dragFromUnplacedIdx === i ? `${accent}12` : 'rgba(255,255,255,0.03)',
                                      color: token.colorText,
                                      marginBottom: 8,
                                    }}
                                    title={titleText}
                                  >
                                    <span style={{ width: 22, height: 22, borderRadius: 8, display: 'grid', placeItems: 'center', flex: 'none', background: 'rgba(255,255,255,0.05)', color: token.colorTextSecondary }}>
                                      <Icon size={14} />
                                    </span>
                                    <Typography.Text
                                      style={{
                                        minWidth: 0,
                                        flex: 1,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: token.colorText,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {titleText}
                                    </Typography.Text>
                                    <Button
                                      type="text"
                                      size="small"
                                      className="iconOnly"
                                      icon={<CloseOutlined style={{ fontSize: 12 }} />}
                                      draggable={false}
                                      onMouseDown={(ev) => {
                                        ev.stopPropagation()
                                        ev.preventDefault()
                                      }}
                                      onClick={(ev) => {
                                        ev.stopPropagation()
                                        setUnplacedSlots((prev) => prev.filter((x) => x.id !== s.id))
                                      }}
                                      style={{
                                        width: 28,
                                        height: 24,
                                        padding: 0,
                                        opacity: hoveredUnplacedId === s.id ? 0.9 : 0,
                                        pointerEvents: hoveredUnplacedId === s.id ? 'auto' : 'none',
                                      }}
                                    />
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      }
                      trigger="click"
                    >
                      <Badge count={unplacedCount} size="small" color={accent} offset={[-2, 2]}>
                        <Button
                          shape="circle"
                          size="small"
                          style={{
                            width: 32,
                            minWidth: 32,
                            height: 32,
                            padding: 0,
                            background: 'rgba(6, 10, 18, 0.28)',
                            border: `1px solid ${accent}22`,
                            color: token.colorText,
                            boxShadow: `0 10px 24px rgba(0,0,0,0.30)`,
                            backdropFilter: 'blur(10px)',
                            opacity: unplacedOpen ? 1 : 0.78,
                          }}
                          aria-label="暂存区"
                        >
                          <Layers size={16} />
                        </Button>
                      </Badge>
                    </Popover>
                  </div>
                ) : null}

                {layout.mode === 'free' && !readOnly && !previewMode ? (
                  <div
                    ref={freeOverlayRef}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      pointerEvents: 'auto',
                      cursor: 'crosshair',
                      overflow: 'hidden',
                    }}
                    onMouseMove={(e) => {
                      if (layout.mode !== 'free') return
                      const el = freeOverlayRef.current
                      if (!el) return
                      const cx = e.clientX
                      const cy = e.clientY
                      const rect = el.getBoundingClientRect()
                      const pad = 0
                      const rawX = cx - rect.left
                      const rawY = cy - rect.top
                      const x = Math.max(pad, Math.min(rect.width - pad - 1, rawX))
                      const y = Math.max(pad, Math.min(rect.height - pad - 1, rawY))
                      const lx = x - pad
                      const ly = y - pad
                      const innerW = Math.max(1, rect.width - pad * 2)
                      const innerH = Math.max(1, rect.height - pad * 2)
                      const cellW = Math.max(1, (innerW - gap * Math.max(0, freeCols - 1)) / Math.max(1, freeCols))
                      const cellH = Math.max(1, (innerH - gap * Math.max(0, freeRows - 1)) / Math.max(1, freeRows))
                      const unitW = cellW + gap
                      const unitH = cellH + gap
                      const col = Math.min(freeCols, Math.max(1, Math.floor((lx + gap / 2) / unitW) + 1))
                      const row = Math.min(freeRows, Math.max(1, Math.floor((ly + gap / 2) / unitH) + 1))
                      if (freeRafRef.current != null) cancelAnimationFrame(freeRafRef.current)
                      freeRafRef.current = requestAnimationFrame(() => {
                        setFreeHoverPoint((prev) => (prev?.r === row && prev?.c === col ? prev : { r: row, c: col }))
                        setFreeCursor((prev) => (prev?.x === cx && prev?.y === cy ? prev : { x: cx, y: cy }))
                      })
                    }}
                    onMouseLeave={() => {
                      if (freeRafRef.current != null) cancelAnimationFrame(freeRafRef.current)
                      freeRafRef.current = null
                      setFreeHoverPoint(null)
                      setFreeCursor(null)
                    }}
                    onClick={(e) => {
                      if (layout.mode !== 'free') return
                      const el = freeOverlayRef.current
                      if (!el) return
                      const rect = el.getBoundingClientRect()
                      const pad = 0
                      const rawX = e.clientX - rect.left
                      const rawY = e.clientY - rect.top
                      const x = Math.max(pad, Math.min(rect.width - pad - 1, rawX))
                      const y = Math.max(pad, Math.min(rect.height - pad - 1, rawY))
                      const lx = x - pad
                      const ly = y - pad
                      const innerW = Math.max(1, rect.width - pad * 2)
                      const innerH = Math.max(1, rect.height - pad * 2)
                      const cellW = Math.max(1, (innerW - gap * Math.max(0, freeCols - 1)) / Math.max(1, freeCols))
                      const cellH = Math.max(1, (innerH - gap * Math.max(0, freeRows - 1)) / Math.max(1, freeRows))
                      const unitW = cellW + gap
                      const unitH = cellH + gap
                      const c = Math.min(freeCols, Math.max(1, Math.floor((lx + gap / 2) / unitW) + 1))
                      const r = Math.min(freeRows, Math.max(1, Math.floor((ly + gap / 2) / unitH) + 1))

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
                        message.error(appearance.language === 'en-US' ? 'Overlaps with an existing card' : '与已有卡片重叠')
                        return
                      }
                      applyLayout({ ...layout, cards: [...layout.cards, nextCard] }, { fillFromUnplaced: false })
                      setFreeStartPoint(null)
                      setFreeHoverPoint(null)
                    }}
                  >
                    {freeCursor ? (
                      <div style={{ position: 'fixed', left: freeCursor.x + 12, top: freeCursor.y + 12, zIndex: 120, pointerEvents: 'none' }}>
                        <div style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(9, 12, 18, 0.62)', color: token.colorText, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {freeStartPoint
                            ? appearance.language === 'en-US'
                              ? 'Click end point to create'
                              : '点击终点生成卡片'
                            : appearance.language === 'en-US'
                              ? 'Click start point'
                              : '点击起点'}
                        </div>
                      </div>
                    ) : null}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${freeCols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${freeRows}, minmax(0, 1fr))`,
                        gap,
                        padding: 0,
                        pointerEvents: 'none',
                      }}
                    >
                      {Array.from({ length: freeRows * freeCols }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: 12,
                            border: `1px solid ${fieldBorder}`,
                            opacity: appearance.theme === 'obsidian' ? 0.28 : 0.26,
                            background: 'transparent',
                          }}
                        />
                      ))}
                    </div>

                    {freeStartPoint && freeHoverPoint ? (
                      (() => {
                        const rowStart = Math.min(freeStartPoint.r, freeHoverPoint.r)
                        const rowEnd = Math.max(freeStartPoint.r, freeHoverPoint.r)
                        const colStart = Math.min(freeStartPoint.c, freeHoverPoint.c)
                        const colEnd = Math.max(freeStartPoint.c, freeHoverPoint.c)
                        const rowSpan = rowEnd - rowStart + 1
                        const colSpan = colEnd - colStart + 1
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'grid',
                              gridTemplateColumns: `repeat(${freeCols}, minmax(0, 1fr))`,
                              gridTemplateRows: `repeat(${freeRows}, minmax(0, 1fr))`,
                              gap,
                              padding: 0,
                              pointerEvents: 'none',
                              zIndex: 40,
                            }}
                          >
                            <div
                              style={{
                                gridColumn: `${colStart} / span ${colSpan}`,
                                gridRow: `${rowStart} / span ${rowSpan}`,
                                position: 'relative',
                                background: `${accent}10`,
                                border: `1px solid ${accent}B8`,
                                borderRadius: 14,
                                boxShadow: `0 0 0 1px ${accent}22, 0 0 12px ${accent}2e`,
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 12,
                                  top: -26,
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  background: 'rgba(6, 10, 18, 0.92)',
                                  border: `1px solid ${accent}66`,
                                  color: accent,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  lineHeight: 1,
                                  whiteSpace: 'nowrap',
                                  zIndex: 60,
                                }}
                              >
                                {rowSpan}行*{colSpan}列
                              </div>
                              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                {(
                                  [
                                    { top: 0, left: 0, borders: ['borderBottom', 'borderRight'] as const },
                                    { top: 0, right: 0, borders: ['borderBottom', 'borderLeft'] as const },
                                    { bottom: 0, left: 0, borders: ['borderTop', 'borderRight'] as const },
                                    { bottom: 0, right: 0, borders: ['borderTop', 'borderLeft'] as const },
                                  ] as Array<{
                                    top?: number
                                    right?: number
                                    bottom?: number
                                    left?: number
                                    borders: ReadonlyArray<'borderTop' | 'borderRight' | 'borderBottom' | 'borderLeft'>
                                  }>
                                ).map((p, i) => {
                                  const style: any = {
                                    position: 'absolute',
                                    width: 18,
                                    height: 18,
                                    borderColor: accent,
                                    borderStyle: 'solid',
                                    borderRadius: 0,
                                  }
                                  if (p.top != null) style.top = -2
                                  if (p.bottom != null) style.bottom = -2
                                  if (p.left != null) style.left = -2
                                  if (p.right != null) style.right = -2
                                  for (const k of p.borders) style[k] = '40px'
                                  return <div key={i} style={style} />
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    ) : null}
                  </div>
                ) : null}

                {specs.map((spec, idx) => {
                  const slot = slots[idx]
                  if (!slot) return null
                  const isEditing = editingSlotId === slot.id
                  const isSelected = selectedSlotId === slot.id
                  const isDragFrom = dragFromIdx === idx
                  const isDragOver = dragOverIdx === idx
                  const isMoveOver = isDragOver && (dragFromIdx != null ? dragFromIdx !== idx : dragFromUnplacedIdx != null)
                  const pos = (layout.mode === 'free' ? layout.cards : templatePositions)?.[idx]
                  const colSpan = pos ? pos.colSpan : Math.max(1, Math.min(freeCols, spec.colSpan))
                  const rowSpan = pos ? pos.rowSpan : Math.max(1, spec.rowSpan)
                  const demoInjectedError = demoConfigErrorSlotIndex != null && idx === demoConfigErrorSlotIndex && slot.kind && !slot.error
                  const borderColor = slot.kind
                    ? slot.error || demoInjectedError
                      ? token.colorError
                      : isEditing || isSelected
                        ? accent
                        : token.colorSplit
                    : token.colorSplit
                  const surfaceBg =
                    appearance.theme === 'obsidian'
                      ? token.colorBgContainer
                      : appearance.theme === 'tech'
                        ? 'rgba(10, 16, 28, 0.86)'
                        : appearance.theme === 'cyber'
                          ? 'rgba(10, 15, 25, 0.82)'
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
                            : layout.mode === 'free'
                              ? `1px dashed ${borderColor}`
                              : `1px dashed ${borderColor}`,
                        background:
                          slot.kind
                            ? surfaceBg
                            : layout.mode === 'free'
                              ? panelCardBg
                              : appearance.theme === 'obsidian'
                                ? token.colorBgContainer
                                : appearance.theme === 'tech'
                                  ? 'rgba(10, 16, 28, 0.72)'
                                  : appearance.theme === 'cyber'
                                    ? 'rgba(10, 15, 25, 0.72)'
                                    : panelBg,
                        position: 'relative',
                        zIndex: layout.mode === 'free' ? 2 : 1,
                        overflow: layout.mode === 'free' ? 'visible' : 'hidden',
                        cursor: slot.kind ? 'default' : !readOnly && !previewMode ? 'pointer' : 'default',
                        boxShadow:
                          slot.kind && (slot.error || demoInjectedError)
                            ? '0 0 0 1px rgba(248,113,113,0.35), 0 0 18px rgba(248,113,113,0.10)'
                            : undefined,
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
                        const isUnplaced = Boolean(e.dataTransfer.types?.includes('application/x-dashboard-unplaced-index'))
                        e.dataTransfer.dropEffect = isMove || isUnplaced ? 'move' : 'copy'
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        if (isMove || isAdd || isUnplaced) setDragOverIdx((prev) => (prev === idx ? prev : idx))
                        if (isMove) scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
                        if (isUnplaced && slot.kind) scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
                      }}
                      onDragOverCapture={(e) => {
                        if (readOnly || previewMode) return
                        e.preventDefault()
                        if (dragFromIdx != null && dragFromIdx === idx) return
                        setDragOverIdx((prev) => (prev === idx ? prev : idx))
                        const isMove = Boolean(e.dataTransfer.types?.includes('application/x-dashboard-slot-index'))
                        const isUnplaced = Boolean(e.dataTransfer.types?.includes('application/x-dashboard-unplaced-index'))
                        if (isMove) scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
                        if (isUnplaced && slot.kind) scheduleMoveTip({ x: e.clientX, y: e.clientY, text: '' })
                      }}
                      onDrop={(e) => {
                        if (readOnly || previewMode) return
                        e.preventDefault()
                        scheduleMoveTip(null)
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
                        const unplacedIdxRaw = e.dataTransfer.getData('application/x-dashboard-unplaced-index')
                        if (unplacedIdxRaw) {
                          const from = Number(unplacedIdxRaw)
                          if (!Number.isFinite(from) || from < 0 || from >= unplacedSlots.length) return
                          const moving = unplacedSlots[from]
                          if (!moving?.kind) return
                          const nextSlots = slots.slice(0)
                          const target = nextSlots[idx]
                          if (!target) return
                          const replaced = target.kind ? { ...target } : null
                          nextSlots[idx] = { ...target, kind: moving.kind, configText: moving.configText, error: moving.error }
                          const nextUnplaced = unplacedSlots.filter((_, i) => i !== from)
                          if (replaced?.kind) nextUnplaced.push(replaced)
                          setSlots(nextSlots)
                          setUnplacedSlots(nextUnplaced)
                          setDragFromUnplacedIdx(null)
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
                      {slot.kind && !previewMode ? (
                        <div className="studioSlotActions" style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tooltip title={readOnly || previewMode ? '查看代码' : '编辑代码'}>
                            <Button
                              type="text"
                              size="small"
                              className="studioSlotIconBtn"
                              icon={<CodeOutlined />}
                              disabled={readOnly || previewMode}
                              draggable={false}
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation()
                                if (readOnly || previewMode) return
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
                      ) : layout.mode === 'free' && !readOnly && !previewMode ? (
                        <div className="studioSlotActions" style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tooltip title="删除卡片">
                            <Button
                              type="text"
                              size="small"
                              className="studioSlotIconBtn"
                              icon={<CloseOutlined />}
                              draggable={false}
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation()
                                removeFreeCard(idx)
                              }}
                              aria-label="删除卡片"
                            />
                          </Tooltip>
                        </div>
                      ) : null}

                      {layout.mode === 'free' && isSelected && slot.kind ? (
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 22 }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: 12,
                              top: -26,
                              padding: '4px 9px',
                              borderRadius: 8,
                              background: 'rgba(6, 10, 18, 0.92)',
                              border: `1px solid ${accent}66`,
                              color: accent,
                              fontSize: 12,
                              fontWeight: 800,
                              lineHeight: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {rowSpan}行*{colSpan}列
                          </div>
                          {(
                            [
                              { top: 0, left: 0, borders: ['borderBottom', 'borderRight'] as const },
                              { top: 0, right: 0, borders: ['borderBottom', 'borderLeft'] as const },
                              { bottom: 0, left: 0, borders: ['borderTop', 'borderRight'] as const },
                              { bottom: 0, right: 0, borders: ['borderTop', 'borderLeft'] as const },
                            ] as Array<{
                              top?: number
                              right?: number
                              bottom?: number
                              left?: number
                              borders: ReadonlyArray<'borderTop' | 'borderRight' | 'borderBottom' | 'borderLeft'>
                            }>
                          ).map((p, i) => {
                            const style: any = {
                              position: 'absolute',
                              width: 18,
                              height: 18,
                              borderColor: accent,
                              borderStyle: 'solid',
                              borderRadius: 0,
                            }
                            if (p.top != null) style.top = -2
                            if (p.bottom != null) style.bottom = -2
                            if (p.left != null) style.left = -2
                            if (p.right != null) style.right = -2
                            for (const k of p.borders) style[k] = '40px'
                            return <div key={i} style={style} />
                          })}
                        </div>
                      ) : null}

                      <div style={{ height: '100%', borderRadius: 14, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                        {slotBodies[idx]}
                      </div>
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
              <Space size={4}>
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
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: editorFullscreen ? 'calc(100vw - 92px)' : 640,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
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
                  <Space size={4}>
                    <Button onClick={() => setEditingSlotId(null)}>取消</Button>
                    <Button
                      type="primary"
                      disabled={readOnly || previewMode || Boolean(editorError ?? liveEditorError)}
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
              error={editorError ?? liveEditorError}
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

        <div
          style={{
            borderLeft: `1px solid ${token.colorSplit}`,
            background: sidePanelBg,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 3,
            boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.06), inset 2px 0 0 rgba(0,0,0,0.35)',
          }}
        >
          <div className="studioColHeader" style={{ background: sidePanelBg }}>
            <Typography.Text strong>页面配置</Typography.Text>
          </div>
          <div
            className="studioColBody studioScrollbarHidden"
            data-page-config-seal="start"
            ref={rightPanelBodyRef}
            style={{ padding: 12, overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {(() => {
              const RequiredLabel = ({ label }: { label: string }) => (
                <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  <span style={{ color: token.colorError, marginRight: 4 }}>*</span>
                  {label}
                </Typography.Text>
              )

              return (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <RequiredLabel label="名称" />
                    <div style={{ height: 4 }} />
                    <Input value={title} disabled={readOnly} onChange={(e) => setTitle(e.target.value)} placeholder="例如：核心运营指标" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <RequiredLabel label="语言" />
                      <div style={{ height: 4 }} />
                      <Select
                        value={appearance.language}
                        disabled={readOnly}
                        getPopupContainer={getStudioPopupContainer}
                        onChange={(v) => {
                          if (typeof document !== 'undefined') document.documentElement.lang = v
                          setAppearance((p) => ({ ...p, language: v }))
                          setLocale(v)
                          translateSlots(v)
                        }}
                        options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English' }]}
                      />
                    </div>
                    <div>
                      <RequiredLabel label="时区" />
                      <div style={{ height: 4 }} />
                      <Select
                        value={appearance.timeZone}
                        disabled={readOnly}
                        getPopupContainer={getStudioPopupContainer}
                        onChange={(v) => setAppearance((p) => ({ ...p, timeZone: String(v) }))}
                        style={{ width: '100%', minWidth: 0 }}
                        placement="bottomRight"
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{ minWidth: 360 }}
                        optionLabelProp="shortLabel"
                        optionFilterProp="searchText"
                        options={[
                        {
                          value: 'UTC+00:00',
                          shortLabel: 'UTC+00:00',
                          searchText: 'UTC+00:00 格林威治标准时间 GMT',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+00:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>格林威治标准时间 (GMT)</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+08:00',
                          shortLabel: 'UTC+08:00',
                          searchText: 'UTC+08:00 中国 北京 新加坡 吉隆坡 马尼拉',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+08:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>中国 (北京)、新加坡、吉隆坡、马尼拉</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+07:00',
                          shortLabel: 'UTC+07:00',
                          searchText: 'UTC+07:00 曼谷 雅加达 河内 胡志明市',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+07:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>曼谷、雅加达、河内、胡志明市</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+03:00',
                          shortLabel: 'UTC+03:00',
                          searchText: 'UTC+03:00 利雅得 巴格达 卡塔尔 莫斯科',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+03:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>利雅得、巴格达、卡塔尔、(莫斯科)</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+04:00',
                          shortLabel: 'UTC+04:00',
                          searchText: 'UTC+04:00 迪拜 阿布扎比 马斯喀特',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+04:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>迪拜、阿布扎比、马斯喀特</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+02:00',
                          shortLabel: 'UTC+02:00',
                          searchText: 'UTC+02:00 开罗 安曼 耶路撒冷',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+02:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>开罗、安曼、耶路撒冷</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+05:00',
                          shortLabel: 'UTC+05:00',
                          searchText: 'UTC+05:00 塔什干 乌兹别克斯坦 伊斯兰堡',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+05:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>塔什干 (乌兹别克斯坦)、伊斯兰堡</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC+06:00',
                          shortLabel: 'UTC+06:00',
                          searchText: 'UTC+06:00 阿拉木图 哈萨克斯坦 比什凯克',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC+06:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>阿拉木图 (哈萨克斯坦)、比什凯克</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC-03:00',
                          shortLabel: 'UTC-03:00',
                          searchText: 'UTC-03:00 圣保罗 巴西 布宜诺斯艾利斯 阿根廷',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC-03:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>圣保罗 (巴西)、布宜诺斯艾利斯 (阿根廷)</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC-05:00',
                          shortLabel: 'UTC-05:00',
                          searchText: 'UTC-05:00 波哥大 哥伦比亚 利马 秘鲁 墨西哥城',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC-05:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>波哥大 (哥伦比亚)、利马 (秘鲁)、墨西哥城</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC-04:00',
                          shortLabel: 'UTC-04:00',
                          searchText: 'UTC-04:00 圣地亚哥 智利 加拉加斯 委内瑞拉',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC-04:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>圣地亚哥 (智利)、加拉加斯 (委内瑞拉)</div>
                            </div>
                          ),
                        },
                        {
                          value: 'UTC-06:00',
                          shortLabel: 'UTC-06:00',
                          searchText: 'UTC-06:00 墨西哥中部 哥斯达黎加',
                          label: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.25 }}>
                              <div style={{ fontWeight: 700 }}>UTC-06:00</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>墨西哥中部、哥斯达黎加</div>
                            </div>
                          ),
                        },
                      ]}
                      showSearch
                    />
                  </div>
                </div>

                <div>
                  <RequiredLabel label="主题风格" />
                  <div style={{ height: 4 }} />
                  <ThemeStyleCardPicker
                    value={appearance.theme}
                    disabled={readOnly}
                    onChange={(v) => {
                      const next: StudioAppearance = {
                        ...appearanceRef.current,
                        theme: v,
                        chartPalette: v === 'tech' ? 'deepsea' : v === 'obsidian' ? 'obsidian' : 'cyber',
                      }
                      appearanceRef.current = next
                      setAppearance(next)
                    }}
                  />
                </div>

                <div>
                  <RequiredLabel label="图表色系" />
                  <div style={{ height: 4 }} />
                  <Select
                    value={appearance.chartPalette}
                    disabled={readOnly}
                    getPopupContainer={getStudioPopupContainer}
                    onChange={(v) => setAppearance((p) => ({ ...p, chartPalette: safeChartPalette(v) }))}
                    style={{ width: '100%' }}
                    optionLabelProp="label"
                    options={(Object.keys(CHART_PALETTES) as Array<keyof typeof CHART_PALETTES>).map((id) => {
                      const meta = CHART_PALETTES[id]
                      return {
                        value: id,
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
                            <div style={{ minWidth: 0 }}>
                              <Typography.Text style={{ display: 'block', lineHeight: 1.25, fontSize: 14 }}>
                                {meta.name}
                              </Typography.Text>
                            </div>
                            <div className="studioPaletteSwatches">
                              {meta.colors.slice(0, 10).map((hex, i) => (
                                <span key={`${hex}-${i}`} className="studioPaletteSwatch" style={{ background: hex }} />
                              ))}
                            </div>
                          </div>
                        ),
                      }
                    })}
                  />
                </div>

                <div>
                  <RequiredLabel label="页面布局" />
                  <div style={{ height: 4 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(
                      [
                        { key: 'main-sub' as const, title: '主次布局', desc: '主次分明/主体突出', icon: <LayoutWireframe kind="main-sub" /> },
                        { key: 'three-col' as const, title: '三列布局', desc: '等分并列/横向对比', icon: <LayoutWireframe kind="three-col" /> },
                        { key: 'sidebar' as const, title: '侧栏布局', desc: '主辅分区/侧边辅助', icon: <LayoutWireframe kind="sidebar" /> },
                        { key: 'matrix-10' as const, title: '矩阵布局', desc: '10宫格/分析主图', icon: <LayoutWireframe kind="matrix-10" /> },
                        { key: 'analysis-7' as const, title: '分析布局', desc: '左右分析/中间主区', icon: <LayoutWireframe kind="analysis-7" /> },
                        { key: 'free' as const, title: '自定义栅格', desc: '自由定义卡片布局', icon: <CustomGridPreview /> },
                      ] as const
                    ).map((it) => {
                      const selected = layout.mode === 'free' ? it.key === 'free' : it.key !== 'free' && layout.template === it.key
                      return (
                        <div
                          key={it.key}
                          onClick={() => {
                            if (readOnly) return
                            if (it.key === 'free') {
                              shouldScrollToFreeRef.current = true
                              applyLayout({ mode: 'free', cols: 12, rows: 8, gap: 16, cards: [] })
                              setTimeout(() => {
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => scrollRightPanelToBottom('smooth'))
                                })
                              }, 0)
                            }
                            else applyLayout({ mode: 'template', template: it.key as any })
                          }}
                          style={{
                            borderRadius: 14,
                            border: `1px solid ${selected ? accent : 'var(--studio-field-border)'}`,
                            background: 'var(--studio-panel-card-bg)',
                            cursor: readOnly ? 'default' : 'pointer',
                            padding: 6,
                            opacity: readOnly ? 0.9 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div
                            style={{
                              height: 82,
                              padding: '6px 6px 2px',
                              boxSizing: 'border-box',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'stretch',
                              width: '100%',
                            }}
                          >
                            <div style={{ width: '100%' }}>{it.icon}</div>
                          </div>
                          <div style={{ height: 0 }} />
                          <div style={{ paddingInline: 6 }}>
                            <Typography.Text strong style={{ display: 'block', lineHeight: 1.2, fontSize: 13, textAlign: 'left' }}>
                              {it.title}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11, lineHeight: 1.2, marginTop: 0, textAlign: 'left' }}>
                              {it.desc}
                            </Typography.Text>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                </div>
              )
            })()}

            {layout.mode === 'free' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <Space size={4}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      列数
                    </Typography.Text>
                    <Tooltip title="网格列数（默认 12）">
                      <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                    </Tooltip>
                  </Space>
                  <div style={{ height: 4 }} />
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
                  <Space size={4}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      行数
                    </Typography.Text>
                    <Tooltip title="网格行数（默认 8）">
                      <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                    </Tooltip>
                  </Space>
                  <div style={{ height: 4 }} />
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
                  <Space size={4}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      间距
                    </Typography.Text>
                    <Tooltip title="网格间距（像素）">
                      <InfoCircleOutlined style={{ color: token.colorTextTertiary }} />
                    </Tooltip>
                  </Space>
                  <div style={{ height: 4 }} />
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
            <span data-page-config-seal="end" style={{ display: 'none' }} />
          </div>
        </div>

        {moveTip && !readOnly && !previewMode ? (
          <div
            style={{
              position: 'fixed',
              left: moveTip.x,
              top: moveTip.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
              pointerEvents: 'none',
              display:
                dragFromIdx != null ||
                (dragFromUnplacedIdx != null && dragOverIdx != null && Boolean(slots[dragOverIdx]?.kind)) ||
                (draggingKind == null && moveTip.text)
                  ? 'block'
                  : 'none',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(9, 12, 18, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeftRight size={16} style={{ color: '#C9CBD3' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: accent, whiteSpace: 'nowrap', textAlign: 'center' }}>
                {dragFromIdx != null
                  ? dragOverIdx != null
                    ? appearance.language === 'en-US'
                      ? 'Drop here'
                      : '移入此位置'
                    : appearance.language === 'en-US'
                      ? 'Drag to reorder'
                      : '拖拽可移动换位'
                  : dragFromUnplacedIdx != null
                    ? dragOverIdx != null
                      ? appearance.language === 'en-US'
                        ? 'Drop here'
                        : '移入此位置'
                      : ''
                    : moveTip.text}
              </div>
            </div>
          </div>
        ) : null}

        <DatasetPreviewModal open={tablePreviewOpen} onClose={() => setTablePreviewOpen(false)} tables={tables} zIndex={2500} />
      </div>
    </div>
  )
}
