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
  const pulseEnabledRef = useRef<typeof pulseEnabled>(pulseEnabled)
  const selectionScopeRef = useRef<typeof selectionScope>(selectionScope)

  onHoverRef.current = onHover
  onLeaveRef.current = onLeave
  onClickRef.current = onClick
  onSelectedChangeRef.current = onSelectedChange
  selectedPropRef.current = selected
  pulseEnabledRef.current = pulseEnabled
  selectionScopeRef.current = selectionScope

  const themeMode = useAppStore((s) => s.themeMode)
  const isDark = themeMode === 'dark'
  const ref = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.EChartsType | null>(null)
  const optRef = useRef<EChartsOption>(option)
  const internalSelectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const selectedHoverRef = useRef<ChartHover | null>(null)
  const uidRef = useRef(`echart_${Math.random().toString(36).slice(2)}`)
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    target: { seriesIndex: number; dataIndex: number } | null
    t0: number
  }>({ timer: null, on: false, target: null, t0: 0 })
  const PULSE_OVERLAY_SERIES_ID = '__echart_pulse_overlay__'

  const opt = useMemo(() => {
    void legendSingleLine
    return option
  }, [legendSingleLine, option])

  const ensureSelectedMode = (raw: EChartsOption) => {
    const o: any = raw ?? {}
    const s = o.series
    const normalize = (it: any) => {
      if (!it || typeof it !== 'object') return it
      if (it.selectedMode != null) return it
      return { ...it, selectedMode: 'single' }
    }
    if (Array.isArray(s)) return { ...o, series: s.map(normalize) }
    if (s && typeof s === 'object') return { ...o, series: normalize(s) }
    return o
  }

  const getCurrentSelected = () => (selectedPropRef.current !== undefined ? selectedPropRef.current : internalSelectedRef.current)

  const getAxisX = (idx: number) => {
    const xAxis: any = (optRef.current as any)?.xAxis
    const data = Array.isArray(xAxis) ? xAxis[0]?.data : xAxis?.data
    return Array.isArray(data) ? data[idx] : idx
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
    try {
      inst.setOption(
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
    try {
      inst.setOption(
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
  }

  const applyLineSymbolVisibility = (on: boolean) => {
    const inst = instanceRef.current
    if (!inst) return
    if (!on) return
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const patches: any[] = new Array(baseSeries.length).fill(0).map(() => ({}))
    for (let i = 0; i < baseSeries.length; i += 1) {
      const s = baseSeries[i]
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const symbol = (s as any).symbol
      const symbolSize = (s as any).symbolSize
      patches[i] = {
        showSymbol: true,
        symbol: symbol === 'none' ? 'circle' : symbol,
        symbolSize: typeof symbolSize === 'number' && symbolSize > 0 ? symbolSize : 6,
      }
    }
    if (!patches.some((p) => p && typeof p === 'object' && 'showSymbol' in p)) return
    try {
      inst.setOption({ series: patches }, { notMerge: false, lazyUpdate: true })
    } catch {}
  }

  const stopPulse = () => {
    const inst = instanceRef.current
    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false
    pulseRef.current.target = null
    pulseRef.current.t0 = 0
    if (inst) {
      try {
        inst.setOption(
          {
            series: [
              { id: PULSE_OVERLAY_SERIES_ID, type: 'effectScatter', coordinateSystem: 'cartesian2d', silent: true, data: [], tooltip: { show: false } },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } catch {}
    }
  }

  const startPulse = (seriesIndex: number, dataIndex: number) => {
    if (pulseEnabledRef.current === false) return
    stopPulse()
    const inst = instanceRef.current
    if (!inst) return
    pulseRef.current.target = { seriesIndex, dataIndex }
    pulseRef.current.t0 = performance.now()
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex] ?? null
    const type = String(base?.type ?? '')
    if (type !== 'line' && type !== 'scatter' && type !== 'effectScatter') return
    const isLine = type === 'line'
    const baseSymbolSize = isLine ? 16 : 20
    const baseShadowBlur = isLine ? 26 : 30
    const rippleScale = isLine ? 3.0 : 3.4
    setPulseOverlayByIndex(seriesIndex, dataIndex, baseSymbolSize, baseShadowBlur, rippleScale)
    pulseRef.current.timer = window.setInterval(() => {
      const current = instanceRef.current
      const target = pulseRef.current.target
      if (!current || !target) return
      const t = performance.now()
      const phase = ((t - pulseRef.current.t0) / 1600) * Math.PI * 2
      const k = (Math.sin(phase) + 1) / 2
      try {
        const baseSeries0 = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
        const base0 = baseSeries0[target.seriesIndex] ?? null
        const type0 = String(base0?.type ?? '')
        if (type0 !== 'line' && type0 !== 'scatter' && type0 !== 'effectScatter') return
        const isLine0 = type0 === 'line'
        const baseSymbolSize0 = isLine0 ? 16 : 20
        const baseShadowBlur0 = isLine0 ? 26 : 30
        const rippleScale0 = isLine0 ? 3.0 : 3.4
        const symbolSize = Math.round(baseSymbolSize0 + k * 7)
        const blur = Math.round(baseShadowBlur0 + k * 22)
        setPulseOverlayByIndex(target.seriesIndex, target.dataIndex, symbolSize, blur, rippleScale0)
        current.dispatchAction({ type: 'select', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex } as any)
        current.dispatchAction({ type: 'highlight', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex } as any)
      } catch {}
    }, 60)
  }

  const broadcastSelection = (next: { seriesIndex: number; dataIndex: number } | null) => {
    broadcastGlobalSelection({ uid: uidRef.current, scope: selectionScopeRef.current ?? undefined, next, kind: 'echart' })
  }

  const clearSelection = (click: ChartHover, opts?: { broadcast?: boolean }) => {
    const inst = instanceRef.current
    if (!inst) return
    const cur = getCurrentSelected()
    if (!cur) return
    try {
      inst.dispatchAction({ type: 'downplay', seriesIndex: cur.seriesIndex, dataIndex: cur.dataIndex } as any)
      inst.dispatchAction({ type: 'unselect', seriesIndex: cur.seriesIndex, dataIndex: cur.dataIndex } as any)
    } catch {}
    if (selectedPropRef.current === undefined) internalSelectedRef.current = null
    stopPulse()
    applyLineSymbolVisibility(false)
    try {
      inst.setOption(optRef.current, { notMerge: true, lazyUpdate: true })
    } catch {}
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
      try {
        inst.dispatchAction({ type: 'downplay', seriesIndex: cur.seriesIndex, dataIndex: cur.dataIndex } as any)
        inst.dispatchAction({ type: 'unselect', seriesIndex: cur.seriesIndex, dataIndex: cur.dataIndex } as any)
      } catch {}
    }
    if (selectedPropRef.current === undefined) internalSelectedRef.current = next
    applyLineSymbolVisibility(true)
    try {
      inst.dispatchAction({ type: 'select', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex } as any)
      inst.dispatchAction({ type: 'highlight', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex } as any)
      inst.dispatchAction({ type: 'showTip', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex } as any)
    } catch {}
    startPulse(next.seriesIndex, next.dataIndex)
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
      try {
        inst.setOption(optRef.current, { notMerge: true, lazyUpdate: true })
      } catch {}
      const cur = getCurrentSelected()
      if (cur) {
        applyLineSymbolVisibility(true)
        startPulse(cur.seriesIndex, cur.dataIndex)
      }
    }
    raf = requestAnimationFrame(applyUntilStable)

    inst.on('mouseover', (p: any) => {
      onHoverRef.current?.(pickHover(p))
    })
    inst.on('mouseout', () => {
      onLeaveRef.current?.()
    })
    inst.on('click', (p: any) => {
      try {
        const hv = pickHover(p)
        try {
          onClickRef.current?.(hv)
        } catch {}
        if (typeof hv.seriesIndex === 'number' && typeof hv.dataIndex === 'number') {
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

    const ro = new ResizeObserver(() => {
      tries = 0
      try {
        inst.resize()
      } catch {}
      try {
        inst.setOption(optRef.current, { notMerge: true, lazyUpdate: true })
      } catch {}
      const cur = getCurrentSelected()
      if (cur) {
        applyLineSymbolVisibility(true)
        startPulse(cur.seriesIndex, cur.dataIndex)
      }
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
      const inside = insideContainer || insideTooltip
      if (inside) return
      clearSelection({} as any)
    }
    window.addEventListener('click', handleWindowClick, true)

    const handleExternalSelection = (e: any) => {
      try {
        const d = e?.detail
        if (!d || d.uid === uidRef.current) return
        const cur = getCurrentSelected()
        if (!cur) return
        clearSelection({} as any, { broadcast: false })
      } catch {}
    }
    window.addEventListener(GLOBAL_SELECTION_EVENT, handleExternalSelection as any)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('click', handleWindowClick, true)
      window.removeEventListener(GLOBAL_SELECTION_EVENT, handleExternalSelection as any)
      inst.dispose()
      instanceRef.current = null
    }
  }, [isDark])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    const nextOpt = ensureSelectedMode(opt)
    optRef.current = nextOpt
    inst.setOption(nextOpt, { notMerge: true, lazyUpdate: true })
    const cur = getCurrentSelected()
    if (cur) {
      applyLineSymbolVisibility(true)
      startPulse(cur.seriesIndex, cur.dataIndex)
    }
  }, [opt])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    if (!selected) {
      stopPulse()
      applyLineSymbolVisibility(false)
      try {
        inst.dispatchAction({ type: 'downplay' } as any)
        inst.dispatchAction({ type: 'unselect' } as any)
      } catch {}
      try {
        inst.setOption(optRef.current, { notMerge: true, lazyUpdate: true })
      } catch {}
      return
    }
    selectedHoverRef.current = {
      seriesIndex: selected.seriesIndex,
      dataIndex: selected.dataIndex,
    }
    inst.dispatchAction({ type: 'select', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    inst.dispatchAction({ type: 'highlight', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    applyLineSymbolVisibility(true)
    inst.dispatchAction({ type: 'showTip', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    startPulse(selected.seriesIndex, selected.dataIndex)
  }, [pulseEnabled, selected])

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 220, ...style }} />
}
