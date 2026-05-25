import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import 'echarts-liquidfill'
import { useAppStore } from '../store/appStore'
import { broadcastGlobalSelection, GLOBAL_SELECTION_EVENT } from '../utils/globalSelection'

export type ChartHover = {
  seriesName?: string
  name?: string
  value?: unknown
  percent?: number
  data?: unknown
  seriesIndex?: number
  dataIndex?: number
  offsetX?: number
  offsetY?: number
  dataType?: string
  color?: string
}

function pickHover(params: any): ChartHover {
  return {
    seriesName: typeof params?.seriesName === 'string' ? params.seriesName : undefined,
    name: typeof params?.name === 'string' ? params.name : undefined,
    value: params?.value,
    percent: typeof params?.percent === 'number' ? params.percent : undefined,
    data: params?.data,
    seriesIndex: typeof params?.seriesIndex === 'number' ? params.seriesIndex : undefined,
    dataIndex: typeof params?.dataIndex === 'number' ? params.dataIndex : undefined,
    offsetX: typeof params?.event?.offsetX === 'number' ? params.event.offsetX : typeof params?.offsetX === 'number' ? params.offsetX : undefined,
    offsetY: typeof params?.event?.offsetY === 'number' ? params.event.offsetY : typeof params?.offsetY === 'number' ? params.offsetY : undefined,
    dataType: typeof params?.dataType === 'string' ? params.dataType : undefined,
    color: typeof params?.color === 'string' ? params.color : undefined,
  }
}

export function EChart({
  option,
  onHover,
  onLeave,
  onClick,
  selected,
  onSelectedChange,
  datumSelectable,
  pulseEnabled,
  selectionScope,
  legendSingleLine,
  style,
}: {
  option: EChartsOption
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
  selected?: { seriesIndex: number; dataIndex: number } | null
  onSelectedChange?: (next: { seriesIndex: number; dataIndex: number } | null, click: ChartHover) => void
  datumSelectable?: boolean
  pulseEnabled?: boolean
  selectionScope?: string
  legendSingleLine?: boolean
  style?: React.CSSProperties
}) {
  const onHoverRef = useRef<typeof onHover>(onHover)
  const onLeaveRef = useRef<typeof onLeave>(onLeave)
  const onClickRef = useRef<typeof onClick>(onClick)
  const onSelectedChangeRef = useRef<typeof onSelectedChange>(onSelectedChange)
  const selectedPropRef = useRef<typeof selected>(selected)
  const datumSelectableRef = useRef<typeof datumSelectable>(datumSelectable)
  const pulseEnabledRef = useRef<typeof pulseEnabled>(pulseEnabled)
  const selectionScopeRef = useRef<typeof selectionScope>(selectionScope)

  onHoverRef.current = onHover
  onLeaveRef.current = onLeave
  onClickRef.current = onClick
  onSelectedChangeRef.current = onSelectedChange
  selectedPropRef.current = selected
  datumSelectableRef.current = datumSelectable
  pulseEnabledRef.current = pulseEnabled
  selectionScopeRef.current = selectionScope

  const themeMode = useAppStore((s) => s.themeMode)
  const isDark = themeMode === 'dark'
  const ref = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.EChartsType | null>(null)
  const optRef = useRef<EChartsOption>(option)
  const rawOptRef = useRef<EChartsOption>(option)
  const legendMeasureCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const clickHandledRef = useRef(false)
  const internalSelectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const selectedHoverRef = useRef<ChartHover | null>(null)
  const uidRef = useRef(`echart_${Math.random().toString(36).slice(2)}`)
  const lineSymbolBackupRef = useRef<Map<string, { showSymbol: unknown; symbol: unknown; symbolSize: unknown }>>(new Map())
  const reapplyRafRef = useRef<number | null>(null)
  const optionApplyTimerRef = useRef<number | null>(null)
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    target: { seriesIndex: number; dataIndex: number } | null
    t0: number
  }>({ timer: null, on: false, target: null, t0: 0 })
  const PULSE_OVERLAY_SERIES_ID = '__echart_pulse_overlay__'

  const opt = useMemo(() => {
    return option
  }, [option])

  const ensureSelectedMode = (raw: EChartsOption) => {
    const o: any = raw ?? {}
    const s = o.series
    const normalizeSeries = (it: any, idx: number) => {
      if (!it || typeof it !== 'object') return it
      const id = it.id != null ? `${it.id}` : `__auto_series_${idx}`
      return { ...it, id, selectedMode: false, select: { disabled: true } }
    }
    const sanitizeSeriesList = (list: any[]) => list.filter((it) => it && typeof it === 'object')
    if (Array.isArray(s)) return { ...o, series: sanitizeSeriesList(s).map((it, idx) => normalizeSeries(it, idx)) }
    if (s && typeof s === 'object') return { ...o, series: normalizeSeries(s, 0) }
    return o
  }

  const measureLegendTextWidth = (text: string, fontSize: number, fontFamily?: string, fontWeight?: string | number) => {
    const canvas = document.createElement('canvas')
    if (!legendMeasureCtxRef.current) legendMeasureCtxRef.current = canvas.getContext('2d')
    const ctx = legendMeasureCtxRef.current
    if (!ctx) return text.length * fontSize
    const family = typeof fontFamily === 'string' && fontFamily.trim() ? fontFamily : 'sans-serif'
    const weight = fontWeight != null ? String(fontWeight) : 'normal'
    ctx.font = `${weight} ${fontSize}px ${family}`
    return ctx.measureText(text).width
  }

  const pickLegendNames = (raw: any, legend: any) => {
    const fromLegend = (() => {
      const data = legend?.data
      if (!Array.isArray(data)) return null
      const list = data
        .map((it: any) => (typeof it === 'string' ? it : typeof it?.name === 'string' ? it.name : null))
        .filter((v: any) => typeof v === 'string' && v.trim())
      return list.length ? list : null
    })()
    if (fromLegend) return fromLegend
    const series = Array.isArray(raw?.series) ? raw.series : raw?.series ? [raw.series] : []
    const list: string[] = []
    for (const s of series) {
      if (!s || typeof s !== 'object') continue
      const t = String((s as any).type ?? '')
      if (t === 'pie') {
        const data = Array.isArray((s as any).data) ? (s as any).data : []
        for (const it of data) {
          const nm = typeof it === 'string' ? it : typeof it?.name === 'string' ? it.name : null
          if (typeof nm === 'string' && nm.trim()) list.push(nm)
        }
        continue
      }
      const nm = typeof (s as any).name === 'string' ? (s as any).name : null
      if (typeof nm === 'string' && nm.trim()) list.push(nm)
    }
    const uniq = Array.from(new Set(list))
    return uniq.length ? uniq : []
  }

  const fitLegendSingleLine = (raw: EChartsOption, containerWidth: number) => {
    const base: any = raw ?? {}
    const legendsRaw = base.legend
    const legends = Array.isArray(legendsRaw) ? legendsRaw.filter((it) => it && typeof it === 'object') : legendsRaw && typeof legendsRaw === 'object' ? [legendsRaw] : []
    const enabled = legendSingleLine !== false || legends.some((it: any) => Boolean(it?.__autoHideOverflow))
    if (!enabled) return raw
    if (!Number.isFinite(containerWidth) || containerWidth <= 0) return raw
    if (!legends.length) return raw

    const parseLen = (v: any) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string') {
        const s = v.trim()
        if (!s) return null
        if (s.endsWith('%')) {
          const n = Number(s.slice(0, -1))
          if (!Number.isFinite(n)) return null
          return (containerWidth * n) / 100
        }
        const n = Number(s)
        if (!Number.isFinite(n)) return null
        return n
      }
      return null
    }

    const getPaddingLR = (p: any) => {
      if (typeof p === 'number' && Number.isFinite(p)) return [p, p] as const
      if (Array.isArray(p)) {
        const a = p.map((x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0))
        if (a.length === 2) return [a[1], a[1]] as const
        if (a.length === 3) return [a[1], a[1]] as const
        if (a.length >= 4) return [a[3], a[1]] as const
      }
      return [0, 0] as const
    }

    const tryFitOne = (legend: any) => {
      if (!legend || typeof legend !== 'object') return legend
      if (legend.show === false) return legend
      if (String(legend.orient ?? '') === 'vertical') return legend
      const names = pickLegendNames(base, legend)
      if (!names.length) return legend
      const baseItemWidth = typeof legend.itemWidth === 'number' ? legend.itemWidth : 25
      const iconTextGap = 5
      const baseGap = typeof legend.itemGap === 'number' ? legend.itemGap : 16
      const baseFontSize = typeof legend.textStyle?.fontSize === 'number' ? legend.textStyle.fontSize : 12
      const family = legend.textStyle?.fontFamily
      const weight = legend.textStyle?.fontWeight

      const gaps = Array.from(new Set([baseGap, 16, 12, 10, 8, 6, 4, 2, 0].filter((n) => n <= baseGap).concat([baseGap]).filter((n) => n >= 0))).sort((a, b) => b - a)
      const fonts = Array.from(new Set([baseFontSize, baseFontSize - 1, baseFontSize - 2, baseFontSize - 3].map((n) => Math.max(9, n))))
      const itemWidths = Array.from(new Set([baseItemWidth, 20, 18, 16, 14].filter((n) => n <= baseItemWidth).filter((n) => n >= 10))).sort((a, b) => b - a)

      const avail = (() => {
        const w = parseLen(legend.width)
        const left = parseLen(legend.left)
        const right = parseLen(legend.right)
        const [pl, pr] = getPaddingLR(legend.padding)
        const baseAvail = typeof w === 'number' ? w : Math.max(0, containerWidth - (left ?? 0) - (right ?? 0) - 16)
        return Math.max(0, Math.floor(baseAvail - pl - pr))
      })()

      const calcTotal = (fontSize: number, gap: number, itemWidth: number) => {
        let sum = 0
        for (const nm of names) sum += itemWidth + iconTextGap + measureLegendTextWidth(nm, fontSize, family, weight)
        if (names.length > 1) sum += gap * (names.length - 1)
        return sum + 10 + names.length * 2
      }

      for (const fontSize of fonts) {
        for (const gap of gaps) {
          for (const itemWidth of itemWidths) {
            if (calcTotal(fontSize, gap, itemWidth) <= avail) {
              return {
                ...legend,
                width: avail,
                itemGap: gap,
                itemWidth,
                textStyle: { ...(legend.textStyle ?? {}), fontSize },
              }
            }
          }
        }
      }
      return { ...legend, show: false }
    }

    const nextLegends = legends.map(tryFitOne)
    const next: any = { ...base, legend: Array.isArray(legendsRaw) ? nextLegends : nextLegends[0] }
    return next
  }

  const getCurrentSelected = () => (selectedPropRef.current !== undefined ? selectedPropRef.current : internalSelectedRef.current)

  const isValidSelectedIndex = (inst: echarts.EChartsType, sel: { seriesIndex: number; dataIndex: number } | null) => {
    if (!sel) return false
    if (typeof sel.seriesIndex !== 'number' || typeof sel.dataIndex !== 'number') return false
    if (sel.seriesIndex < 0 || sel.dataIndex < 0) return false
    try {
      const model: any = (inst as any).getModel?.()
      const sm = model?.getSeriesByIndex?.(sel.seriesIndex)
      const data = sm?.getData?.()
      const count = typeof data?.count === 'function' ? data.count() : null
      if (!sm) return false
      if (typeof count === 'number' && Number.isFinite(count) && count > 0 && sel.dataIndex >= count) return false
      return true
    } catch {
      return false
    }
  }

  const safeDownplayAll = (inst: echarts.EChartsType) => {
    try {
      inst.dispatchAction({ type: 'downplay' } as any)
    } catch {}
  }

  const safeDownplayItem = (inst: echarts.EChartsType, sel: { seriesIndex: number; dataIndex: number } | null) => {
    if (!sel) return
    if (!isValidSelectedIndex(inst, sel)) return
    try {
      inst.dispatchAction({ type: 'downplay', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex } as any)
    } catch {}
  }

  const safeHighlightItem = (inst: echarts.EChartsType, sel: { seriesIndex: number; dataIndex: number } | null) => {
    if (!sel) return
    if (!isValidSelectedIndex(inst, sel)) return
    try {
      inst.dispatchAction({ type: 'highlight', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex } as any)
    } catch {}
  }

  const scheduleReapplySelection = (opts?: { full?: boolean }) => {
    if (reapplyRafRef.current != null) {
      cancelAnimationFrame(reapplyRafRef.current)
      reapplyRafRef.current = null
    }
    reapplyRafRef.current = requestAnimationFrame(() => {
      reapplyRafRef.current = null
      const inst = instanceRef.current
      if (!inst) return
      const cur = getCurrentSelected()
      if (!cur) return
      if (!isValidSelectedIndex(inst, cur)) {
        safeDownplayAll(inst)
        stopPulse()
        applyLineSymbolVisibility(false)
        if (selectedPropRef.current === undefined) internalSelectedRef.current = null
        return
      }
      if (opts?.full) safeDownplayAll(inst)
      safeHighlightItem(inst, cur)
      if (opts?.full) {
        applyLineSymbolVisibility(true)
        startPulse(cur.seriesIndex, cur.dataIndex)
      }
    })
  }

  const shouldReapplyOnMouseout = () => {
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    for (let i = 0; i < baseSeries.length; i += 1) {
      const t = String(baseSeries[i]?.type ?? '')
      if (t === 'pie' || t === 'funnel' || t === 'radar') return false
    }
    return true
  }

  const getAxisX = (idx: number) => {
    const xAxis: any = (optRef.current as any)?.xAxis
    const data = Array.isArray(xAxis) ? xAxis[0]?.data : xAxis?.data
    return Array.isArray(data) ? data[idx] : idx
  }

  const getAxisXData = () => {
    const xAxis: any = (optRef.current as any)?.xAxis
    const data = Array.isArray(xAxis) ? xAxis[0]?.data : xAxis?.data
    return Array.isArray(data) ? data : null
  }

  const inferDataIndexFromPixel = (seriesIndex: number, offsetX?: number, offsetY?: number) => {
    const inst = instanceRef.current
    if (!inst) return null
    if (typeof offsetX !== 'number' || typeof offsetY !== 'number') return null
    try {
      const converted = inst.convertFromPixel({ seriesIndex } as any, [offsetX, offsetY] as any)
      if (!Array.isArray(converted) || converted.length < 1) return null
      const x = converted[0]
      let idx: number | null = null
      if (typeof x === 'number' && Number.isFinite(x)) idx = Math.round(x)
      else {
        const list = getAxisXData()
        if (list) {
          const key = String(x)
          const found = list.findIndex((v) => String(v) === key)
          if (found >= 0) idx = found
        }
      }
      if (typeof idx !== 'number') return null
      if (idx < 0) return null
      const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
      const s = baseSeries[seriesIndex]
      const data = Array.isArray(s?.data) ? s.data : null
      if (data && idx >= data.length) return null
      return idx
    } catch {
      return null
    }
  }

  const getSeriesColor = (series: any, seriesIndex: number) => {
    const fromSeries = (() => {
      if (!series || typeof series !== 'object') return null
      const isObj = (v: unknown) => Boolean(v && typeof v === 'object')
      if (isObj(series.itemStyle) && (series.itemStyle as any).color != null) return (series.itemStyle as any).color
      if (isObj(series.lineStyle) && (series.lineStyle as any).color != null) return (series.lineStyle as any).color
      return null
    })()
    const fromPalette = (optRef.current as any)?.color?.[seriesIndex] ?? null
    return String(fromSeries ?? fromPalette ?? '#6CB6FF')
  }

  const getCoordFromModel = (seriesIndex: number, dataIndex: number) => {
    const inst = instanceRef.current
    if (!inst) return null
    try {
      const seriesModel = (inst as any).getModel().getSeriesByIndex(seriesIndex)
      const data = seriesModel?.getData?.()
      if (!data) return null
      const layout = data.getItemLayout?.(dataIndex)
      if (layout) {
        const px = Array.isArray(layout) ? layout : [layout?.x, layout?.y]
        if (Array.isArray(px) && px.length >= 2 && typeof px[0] === 'number' && typeof px[1] === 'number') {
          const converted = inst.convertFromPixel({ seriesIndex } as any, px as any)
          if (Array.isArray(converted) && converted.length >= 2) return [converted[0], converted[1]]
        }
      }
      const raw = data.getRawValue(dataIndex)
      const nm = data.getName(dataIndex)
      if (Array.isArray(raw) && raw.length >= 2) return [raw[0], raw[1]]
      if (typeof raw === 'number' || typeof raw === 'string') return [dataIndex, raw]
      if (nm != null) return [String(nm), raw]
      return null
    } catch {
      return null
    }
  }

  const getColorFromModel = (seriesIndex: number, dataIndex: number) => {
    const inst = instanceRef.current
    if (!inst) return null
    try {
      const seriesModel = (inst as any).getModel().getSeriesByIndex(seriesIndex)
      const data = seriesModel?.getData?.()
      const c = data?.getItemVisual?.(dataIndex, 'color')
      if (typeof c === 'string') return c
    } catch {}
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex]
    return getSeriesColor(base, seriesIndex)
  }

  const setPulseOverlayByIndex = (seriesIndex: number, dataIndex: number, symbolSize: number, shadowBlur: number, rippleScale: number) => {
    const inst = instanceRef.current
    if (!inst) return
    const coord = getCoordFromModel(seriesIndex, dataIndex)
    if (!coord) {
      setPulseOverlayFallback(seriesIndex, dataIndex)
      return
    }
    const c = getColorFromModel(seriesIndex, dataIndex) ?? '#6CB6FF'
    window.setTimeout(() => {
      const current = instanceRef.current
      if (!current || current !== inst) return
      try {
        current.setOption(
          {
            series: [
              {
                id: PULSE_OVERLAY_SERIES_ID,
                type: 'effectScatter',
                zlevel: 10,
                z: 1000,
                silent: true,
                coordinateSystem: 'cartesian2d',
                symbol: 'circle',
                symbolSize,
                data: [{ value: coord }],
                itemStyle: { color: c, borderWidth: 2, borderColor: '#fff', shadowBlur, shadowColor: c, opacity: 0.92 },
                rippleEffect: { scale: rippleScale, brushType: 'stroke', period: 3.2, number: 2 },
                tooltip: { show: false },
              },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } catch {}
    }, 0)
  }

  const setPulseOverlayFallback = (seriesIndex: number, dataIndex: number) => {
    const inst = instanceRef.current
    if (!inst) return
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex]
    const type = String(base?.type ?? '')
    if (type !== 'line' && type !== 'scatter' && type !== 'effectScatter') return
    const rawCoord = (() => {
      const data = Array.isArray(base?.data) ? base.data : []
      const item = data[dataIndex]
      if (type === 'scatter' || type === 'effectScatter') {
        const v = Array.isArray(item) ? item : Array.isArray(item?.value) ? item.value : null
        return Array.isArray(v) && v.length >= 2 ? [v[0], v[1]] : null
      }
      const raw = typeof item === 'number' || typeof item === 'string' ? item : Array.isArray(item) ? item[1] : item?.value
      const y = typeof raw === 'number' || typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[1] : null
      if (y == null) return null
      return [getAxisX(dataIndex), y]
    })()
    if (!rawCoord) return
    const c = getSeriesColor(base, seriesIndex)
    const isLine = type === 'line'
    const symbolSize = isLine ? 18 : 22
    const shadowBlur = isLine ? 28 : 34
    const rippleScale = isLine ? 3.0 : 3.4
    window.setTimeout(() => {
      const current = instanceRef.current
      if (!current || current !== inst) return
      try {
        current.setOption(
          {
            series: [
              {
                id: PULSE_OVERLAY_SERIES_ID,
                type: 'effectScatter',
                zlevel: 10,
                z: 1000,
                silent: true,
                coordinateSystem: 'cartesian2d',
                symbol: 'circle',
                symbolSize,
                data: [{ value: rawCoord }],
                itemStyle: { color: c, borderWidth: 2, borderColor: '#fff', shadowBlur, shadowColor: c, opacity: 0.92 },
                rippleEffect: { scale: rippleScale, brushType: 'stroke', period: 3.2, number: 2 },
                tooltip: { show: false },
              },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } catch {}
    }, 0)
  }

  const applyLineSymbolVisibility = (on: boolean) => {
    const inst = instanceRef.current
    if (!inst) return
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const patches: any[] = []
    for (let i = 0; i < baseSeries.length; i += 1) {
      const s = baseSeries[i]
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const id = `${(s as any).id ?? `__auto_series_${i}`}`
      if (on) {
        if (!lineSymbolBackupRef.current.has(id)) {
          lineSymbolBackupRef.current.set(id, { showSymbol: (s as any).showSymbol, symbol: (s as any).symbol, symbolSize: (s as any).symbolSize })
        }
        const symbol = (s as any).symbol
        const symbolSize = (s as any).symbolSize
        patches.push({
          id,
          showSymbol: true,
          symbol: symbol === 'none' ? 'circle' : symbol,
          symbolSize: typeof symbolSize === 'number' && symbolSize > 0 ? symbolSize : 6,
        })
      } else {
        const backup = lineSymbolBackupRef.current.get(id)
        if (!backup) continue
        patches.push({ id, showSymbol: backup.showSymbol, symbol: backup.symbol, symbolSize: backup.symbolSize })
      }
    }
    if (!patches.length) return
    window.setTimeout(() => {
      const current = instanceRef.current
      if (!current || current !== inst) return
      try {
        current.setOption({ series: patches }, { notMerge: false, lazyUpdate: true })
      } catch {}
    }, 0)
  }

  const stopPulse = (opts?: { hide?: boolean }) => {
    const inst = instanceRef.current
    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false
    pulseRef.current.target = null
    pulseRef.current.t0 = 0
    if (!inst) return
    if (opts?.hide === false) return
    const hasOverlay = (() => {
      try {
        const opt: any = inst.getOption?.()
        const list = Array.isArray(opt?.series) ? opt.series : []
        return list.some((s: any) => s && String(s.id ?? '') === PULSE_OVERLAY_SERIES_ID)
      } catch {
        return false
      }
    })()
    if (!hasOverlay) return
    window.setTimeout(() => {
      const current = instanceRef.current
      if (!current || current !== inst) return
      try {
        current.setOption(
          {
            series: [
              {
                id: PULSE_OVERLAY_SERIES_ID,
                symbolSize: 0,
                itemStyle: { opacity: 0 },
                rippleEffect: { scale: 0.1 },
              },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } catch {}
    }, 0)
  }

  const startPulse = (seriesIndex: number, dataIndex: number) => {
    if (pulseEnabledRef.current === false) return
    stopPulse({ hide: false })
    const inst = instanceRef.current
    if (!inst) return
    pulseRef.current.target = { seriesIndex, dataIndex }
    pulseRef.current.t0 = performance.now()
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex] ?? null
    const type = String(base?.type ?? '')
    if (type !== 'line') return
    const baseSymbolSize = 16
    const baseShadowBlur = 26
    const rippleScale = 3.0
    setPulseOverlayByIndex(seriesIndex, dataIndex, baseSymbolSize, baseShadowBlur, rippleScale)
  }

  const broadcastSelection = (next: { seriesIndex: number; dataIndex: number } | null) => {
    broadcastGlobalSelection({ uid: uidRef.current, scope: selectionScopeRef.current ?? undefined, next, kind: 'echart' })
  }

  const clearSelection = (click: ChartHover, opts?: { broadcast?: boolean }) => {
    const inst = instanceRef.current
    if (!inst) return
    const cur = getCurrentSelected()
    if (!cur) return
    safeDownplayItem(inst, cur)
    safeDownplayAll(inst)
    if (selectedPropRef.current === undefined) internalSelectedRef.current = null
    stopPulse()
    applyLineSymbolVisibility(false)
    if (opts?.broadcast !== false) broadcastSelection(null)
    try {
      onSelectedChangeRef.current?.(null, click)
    } catch {}
  }

  const setSelection = (next: { seriesIndex: number; dataIndex: number }, click: ChartHover) => {
    const inst = instanceRef.current
    if (!inst) return
    broadcastSelection(next)
    const cur = getCurrentSelected()
    if (cur) {
      safeDownplayItem(inst, cur)
    }
    if (selectedPropRef.current === undefined) internalSelectedRef.current = next
    applyLineSymbolVisibility(true)
    safeDownplayAll(inst)
    safeHighlightItem(inst, next)
    if (isValidSelectedIndex(inst, next)) startPulse(next.seriesIndex, next.dataIndex)
    try {
      onSelectedChangeRef.current?.(next, click)
    } catch {}
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (instanceRef.current) {
      instanceRef.current.dispose()
      instanceRef.current = null
    }

    const inst = echarts.init(el, isDark ? 'dark' : undefined, { renderer: 'canvas' })
    instanceRef.current = inst
    optRef.current = ensureSelectedMode(optRef.current)

    let raf = 0
    let tries = 0
    const applyUntilStable = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 10 || h < 10) {
        tries += 1
        if (tries < 30) raf = requestAnimationFrame(applyUntilStable)
        return
      }
      try {
        inst.resize()
      } catch {}
    }
    raf = requestAnimationFrame(applyUntilStable)

    const fillHoverFromModel = (hv: ChartHover) => {
      const si = hv.seriesIndex
      const di = hv.dataIndex
      if (typeof si !== 'number' || typeof di !== 'number') return
      try {
        const model = (instanceRef.current as any)?.getModel?.()
        const sm = model?.getSeriesByIndex?.(si)
        if (hv.seriesName == null && typeof sm?.name === 'string') hv.seriesName = sm.name
        const data = sm?.getData?.()
        if (hv.name == null) {
          const nm = data?.getName?.(di)
          if (nm != null) hv.name = String(nm)
        }
        if (hv.value == null) hv.value = data?.getRawValue?.(di)
        if (hv.color == null) hv.color = getColorFromModel(si, di) ?? undefined
      } catch {}
    }

    inst.on('mouseover', (p: any) => {
      onHoverRef.current?.(pickHover(p))
    })
    inst.on('mouseout', () => {
      onLeaveRef.current?.()
      if (getCurrentSelected() && shouldReapplyOnMouseout()) scheduleReapplySelection()
    })
    inst.on('globalout', () => {
      if (getCurrentSelected()) scheduleReapplySelection()
    })
    inst.on('click', (p: any) => {
      if (clickHandledRef.current) return
      try {
        const markHandled = () => {
          clickHandledRef.current = true
          window.setTimeout(() => {
            clickHandledRef.current = false
          }, 0)
        }
        const hv0 = pickHover(p)
        const hv: ChartHover = (() => {
          if (typeof hv0.seriesIndex === 'number' && typeof hv0.dataIndex === 'number') return hv0
          if (typeof hv0.seriesIndex === 'number') {
            const inferred = inferDataIndexFromPixel(hv0.seriesIndex, hv0.offsetX, hv0.offsetY)
            if (typeof inferred === 'number') return { ...hv0, dataIndex: inferred }
          }
          return hv0
        })()
        fillHoverFromModel(hv)
        try {
          onClickRef.current?.(hv)
        } catch {}
        if (datumSelectableRef.current === false) return
        if (typeof hv.seriesIndex === 'number' && typeof hv.dataIndex === 'number') {
          markHandled()
          selectedHoverRef.current = hv
          const cur = getCurrentSelected()
          const isSame = !!cur && cur.seriesIndex === hv.seriesIndex && cur.dataIndex === hv.dataIndex
          if (isSame) clearSelection(hv)
          else setSelection({ seriesIndex: hv.seriesIndex, dataIndex: hv.dataIndex }, hv)
          return
        }
        clearSelection(hv)
      } catch {
        try {
          clearSelection({} as any)
        } catch {}
      }
    })

    const zr = inst.getZr()
    const handleZrClick = (ev: any) => {
      if (datumSelectableRef.current === false) return
      const ox = typeof ev?.offsetX === 'number' ? ev.offsetX : undefined
      const oy = typeof ev?.offsetY === 'number' ? ev.offsetY : undefined
      if (typeof ox !== 'number' || typeof oy !== 'number') return
      window.setTimeout(() => {
        if (clickHandledRef.current) return

        const fromTarget = (() => {
          try {
            const found = (zr as any)?.findHover?.(ox, oy) as any
            const target = found?.topTarget ?? found?.target ?? ev?.topTarget ?? ev?.target
            const ecData = target?.__ecData
            const first = Array.isArray(ecData) ? ecData[0] : null
            const si = typeof first?.seriesIndex === 'number' ? first.seriesIndex : null
            const di = typeof first?.dataIndex === 'number' ? first.dataIndex : null
            if (typeof si !== 'number' || typeof di !== 'number') return null
            const hv: ChartHover = { seriesIndex: si, dataIndex: di, offsetX: ox, offsetY: oy, dataType: first?.dataType }
            fillHoverFromModel(hv)
            return hv
          } catch {
            return null
          }
        })()

        const hvFromLoop = (() => {
          const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
          for (let si = 0; si < baseSeries.length; si += 1) {
            const inferred = inferDataIndexFromPixel(si, ox, oy)
            if (typeof inferred !== 'number') continue
            const hv: ChartHover = { seriesIndex: si, dataIndex: inferred, offsetX: ox, offsetY: oy }
            fillHoverFromModel(hv)
            return hv
          }
          return null
        })()

        const hv = fromTarget ?? hvFromLoop
        if (!hv || typeof hv.seriesIndex !== 'number' || typeof hv.dataIndex !== 'number') return

        clickHandledRef.current = true
        window.setTimeout(() => {
          clickHandledRef.current = false
        }, 0)

        const cur = getCurrentSelected()
        const isSame = !!cur && cur.seriesIndex === hv.seriesIndex && cur.dataIndex === hv.dataIndex
        if (isSame) clearSelection(hv)
        else setSelection({ seriesIndex: hv.seriesIndex, dataIndex: hv.dataIndex }, hv)
      }, 0)
    }
    zr.on('click', handleZrClick as any)

    const handleDomClick = (e: MouseEvent) => {
      if (clickHandledRef.current) return
      if (datumSelectableRef.current === false) return
      const rect = el.getBoundingClientRect()
      const ox = e.clientX - rect.left
      const oy = e.clientY - rect.top
      if (!Number.isFinite(ox) || !Number.isFinite(oy)) return

      const markHandled = () => {
        clickHandledRef.current = true
        window.setTimeout(() => {
          clickHandledRef.current = false
        }, 0)
      }

      const fromHoverTarget = (() => {
        try {
          const found = (zr as any)?.findHover?.(ox, oy) as any
          const target = found?.topTarget ?? found?.target
          const ecData = target?.__ecData
          const first = Array.isArray(ecData) ? ecData[0] : null
          const si = typeof first?.seriesIndex === 'number' ? first.seriesIndex : null
          const di = typeof first?.dataIndex === 'number' ? first.dataIndex : null
          if (typeof si !== 'number' || typeof di !== 'number') return null

          let name: string | undefined
          let seriesName: string | undefined
          let value: unknown
          let dataType: string | undefined
          try {
            const model = (instanceRef.current as any)?.getModel?.()
            const sm = model?.getSeriesByIndex?.(si)
            seriesName = typeof sm?.name === 'string' ? sm.name : undefined
            const data = sm?.getData?.()
            const nm = data?.getName?.(di)
            name = nm != null ? String(nm) : undefined
            value = data?.getRawValue?.(di)
          } catch {}
          dataType = typeof first?.dataType === 'string' ? first.dataType : undefined
          const color = getColorFromModel(si, di) ?? undefined
          return { seriesIndex: si, dataIndex: di, offsetX: ox, offsetY: oy, name, seriesName, value, dataType, color } satisfies ChartHover
        } catch {
          return null
        }
      })()

      if (fromHoverTarget) {
        markHandled()
        selectedHoverRef.current = fromHoverTarget
        const cur = getCurrentSelected()
        const isSame =
          !!cur && cur.seriesIndex === fromHoverTarget.seriesIndex && cur.dataIndex === fromHoverTarget.dataIndex
        if (isSame) clearSelection(fromHoverTarget)
        else setSelection({ seriesIndex: fromHoverTarget.seriesIndex!, dataIndex: fromHoverTarget.dataIndex! }, fromHoverTarget)
        return
      }

      const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
      for (let si = 0; si < baseSeries.length; si += 1) {
        const inferred = inferDataIndexFromPixel(si, ox, oy)
        if (typeof inferred !== 'number') continue
        markHandled()
        const hv: ChartHover = { seriesIndex: si, dataIndex: inferred, offsetX: ox, offsetY: oy }
        const cur = getCurrentSelected()
        const isSame = !!cur && cur.seriesIndex === si && cur.dataIndex === inferred
        if (isSame) clearSelection(hv)
        else setSelection({ seriesIndex: si, dataIndex: inferred }, hv)
        return
      }
    }
    el.addEventListener('click', handleDomClick)

    const ro = new ResizeObserver(() => {
      tries = 0
      try {
        inst.resize()
      } catch {}
      const baseOpt = rawOptRef.current
      const needsLegendFit = legendSingleLine !== false || (() => {
        const lg: any = (baseOpt as any)?.legend
        if (Array.isArray(lg)) return lg.some((it) => Boolean(it?.__autoHideOverflow))
        return Boolean(lg?.__autoHideOverflow)
      })()
      if (needsLegendFit) {
        if (optionApplyTimerRef.current != null) window.clearTimeout(optionApplyTimerRef.current)
        optionApplyTimerRef.current = window.setTimeout(() => {
          optionApplyTimerRef.current = null
          const current = instanceRef.current
          const el0 = ref.current
          if (!current || current !== inst || !el0) return
          const applied = fitLegendSingleLine(baseOpt, el0.clientWidth)
          optRef.current = applied
          try {
            current.setOption(applied, { notMerge: true, lazyUpdate: false, silent: true } as any)
          } catch {}
          if (getCurrentSelected()) scheduleReapplySelection({ full: true })
        }, 0)
        return
      }
      if (getCurrentSelected()) scheduleReapplySelection({ full: true })
    })
    ro.observe(el)

    const handleWindowClick = (e: any) => {
      const el0 = ref.current
      if (!el0) return
      const path = typeof e?.composedPath === 'function' ? e.composedPath() : []
      const insideContainer = Array.isArray(path) ? path.includes(el0) : el0.contains(e?.target)
      const insideTooltip =
        Array.isArray(path) &&
        path.some((n: any) => {
          const cls = typeof n?.className === 'string' ? n.className : ''
          if (cls.includes('echarts-tooltip')) return true
          if (typeof n?.classList?.contains === 'function' && n.classList.contains('echarts-tooltip')) return true
          return false
        })
      const insideSelectionCanvas = (() => {
        const hit = (n: any) => String(n?.dataset?.selectionCanvas ?? '') === '1'
        if (Array.isArray(path)) return path.some(hit)
        const t: any = e?.target
        return Boolean(t?.closest?.('[data-selection-canvas="1"]'))
      })()
      if (!insideSelectionCanvas) return
      const inside = insideContainer || insideTooltip
      if (inside) return
      clearSelection({} as any)
    }
    window.addEventListener('click', handleWindowClick, true)

    const handleExternalSelection = (e: any) => {
      try {
        const d = e?.detail
        if (!d || d.uid === uidRef.current) return
        const myScope = selectionScopeRef.current
        if (myScope != null) {
          if (d.scope !== myScope) return
        } else {
          if (d.scope != null) return
        }
        const cur = getCurrentSelected()
        if (!cur) return
        clearSelection({} as any, { broadcast: false })
      } catch {}
    }
    window.addEventListener(GLOBAL_SELECTION_EVENT, handleExternalSelection as any)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      if (reapplyRafRef.current != null) cancelAnimationFrame(reapplyRafRef.current)
      if (optionApplyTimerRef.current != null) window.clearTimeout(optionApplyTimerRef.current)
      window.removeEventListener('click', handleWindowClick, true)
      window.removeEventListener(GLOBAL_SELECTION_EVENT, handleExternalSelection as any)
      try {
        zr.off('click', handleZrClick as any)
      } catch {}
      el.removeEventListener('click', handleDomClick)
      inst.dispose()
      instanceRef.current = null
    }
  }, [isDark])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    const baseOpt = ensureSelectedMode(opt)
    rawOptRef.current = baseOpt
    const el = ref.current
    const nextOpt = el ? fitLegendSingleLine(baseOpt, el.clientWidth) : baseOpt
    optRef.current = nextOpt
    if (optionApplyTimerRef.current != null) window.clearTimeout(optionApplyTimerRef.current)
    optionApplyTimerRef.current = window.setTimeout(() => {
      optionApplyTimerRef.current = null
      const current = instanceRef.current
      if (!current || current !== inst) return
      try {
        current.setOption(nextOpt, { notMerge: true, lazyUpdate: false, silent: true } as any)
      } catch {}
      if (getCurrentSelected()) scheduleReapplySelection({ full: true })
    }, 0)
  }, [legendSingleLine, opt])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    if (!selected) {
      stopPulse()
      applyLineSymbolVisibility(false)
      safeDownplayAll(inst)
      return
    }
    selectedHoverRef.current = {
      seriesIndex: selected.seriesIndex,
      dataIndex: selected.dataIndex,
    }
    safeDownplayAll(inst)
    safeHighlightItem(inst, selected)
    if (isValidSelectedIndex(inst, selected)) {
      applyLineSymbolVisibility(true)
      startPulse(selected.seriesIndex, selected.dataIndex)
    }
  }, [pulseEnabled, selected])

  return <div ref={ref} data-echart-root="1" style={{ width: '100%', height: '100%', minHeight: 220, ...style }} />
}
