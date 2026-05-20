import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import 'echarts-liquidfill'
import { useAppStore } from '../store/appStore'

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
  legendSingleLine?: boolean
  style?: React.CSSProperties
}) {
  const onHoverRef = useRef<typeof onHover>(onHover)
  const onLeaveRef = useRef<typeof onLeave>(onLeave)
  const onClickRef = useRef<typeof onClick>(onClick)
  const onSelectedChangeRef = useRef<typeof onSelectedChange>(onSelectedChange)
  const selectedPropRef = useRef<typeof selected>(selected)
  const pulseEnabledRef = useRef<typeof pulseEnabled>(pulseEnabled)

  onHoverRef.current = onHover
  onLeaveRef.current = onLeave
  onClickRef.current = onClick
  onSelectedChangeRef.current = onSelectedChange
  selectedPropRef.current = selected
  pulseEnabledRef.current = pulseEnabled

  const themeMode = useAppStore((s) => s.themeMode)
  const isDark = themeMode === 'dark'
  const ref = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.EChartsType | null>(null)
  const optRef = useRef<EChartsOption>(option)
  const internalSelectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const selectedHoverRef = useRef<ChartHover | null>(null)
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    target: { seriesIndex: number; dataIndex: number; seriesId: string | number | null; baseScaleSize: number; baseBlur: number } | null
  }>({ timer: null, on: false, target: null })
  const PULSE_OVERLAY_SERIES_ID = '__echart_pulse_overlay__'

  const patchSeriesByIndex = (seriesIndex: number, patch: any) => {
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const out = new Array(Math.max(baseSeries.length, seriesIndex + 1)).fill(0).map(() => ({}))
    out[seriesIndex] = patch
    return out
  }

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

  const setPulseOverlayFromHover = (hv: ChartHover) => {
    const inst = instanceRef.current
    if (!inst) return
    const si = typeof hv.seriesIndex === 'number' ? hv.seriesIndex : -1
    const coord = (() => {
      if (si >= 0 && typeof hv.offsetX === 'number' && typeof hv.offsetY === 'number') {
        try {
          const r = (inst as any).convertFromPixel({ seriesIndex: si }, [hv.offsetX, hv.offsetY])
          if (Array.isArray(r) && r.length >= 2) return [r[0], r[1]]
        } catch {}
      }
      const v = hv.value
      if (Array.isArray(v) && v.length >= 2) return [v[0], v[1]]
      if (typeof hv.name === 'string' && (typeof v === 'number' || typeof v === 'string')) {
        return [hv.name, v]
      }
      return null
    })()
    if (!coord) return
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = si >= 0 ? baseSeries[si] : null
    const type = String(base?.type ?? '')
    const c = typeof hv.color === 'string' ? hv.color : getSeriesColor(base, si >= 0 ? si : 0)
    const isLine = type === 'line'
    const symbolSize = isLine ? 22 : 26
    const shadowBlur = isLine ? 34 : 38
    const rippleScale = isLine ? 3.6 : 3.8
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
              rippleEffect: { scale: rippleScale, brushType: 'stroke', period: 3.8, number: 2 },
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
    const data = Array.isArray(base?.data) ? base.data : []
    const item = data[dataIndex]
    const coord = (() => {
      if (type === 'scatter' || type === 'effectScatter') {
        const v = Array.isArray(item) ? item : Array.isArray(item?.value) ? item.value : null
        return Array.isArray(v) && v.length >= 2 ? [v[0], v[1]] : null
      }
      const raw = typeof item === 'number' || typeof item === 'string' ? item : Array.isArray(item) ? item[1] : item?.value
      const y = typeof raw === 'number' || typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[1] : null
      if (y == null) return null
      return [getAxisX(dataIndex), y]
    })()
    if (!coord) return
    const c = getSeriesColor(base, seriesIndex)
    const isLine = type === 'line'
    const symbolSize = isLine ? 22 : 26
    const shadowBlur = isLine ? 34 : 38
    const rippleScale = isLine ? 3.6 : 3.8
    try {
      inst.setOption(
        {
          series: [
            {
              id: PULSE_OVERLAY_SERIES_ID,
              type: 'effectScatter',
              z: 999,
              silent: true,
              coordinateSystem: 'cartesian2d',
              symbol: 'circle',
              symbolSize,
              data: [{ value: coord }],
              itemStyle: { color: c, borderWidth: 2, borderColor: '#fff', shadowBlur, shadowColor: c, opacity: 0.92 },
              rippleEffect: { scale: rippleScale, brushType: 'stroke', period: 3.8, number: 2 },
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
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const patches: any[] = []
    for (let i = 0; i < baseSeries.length; i += 1) {
      const s = baseSeries[i]
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const id = s.id ?? null
      if (id != null) patches.push({ id, showSymbol: on })
      else patches.push({ showSymbol: on })
    }
    if (!patches.length) return
    try {
      inst.setOption({ series: patches }, { notMerge: false, lazyUpdate: true })
    } catch {}
  }

  const stopPulse = () => {
    const inst = instanceRef.current
    const prev = pulseRef.current.target
    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false
    pulseRef.current.target = null
    if (inst) {
      try {
        inst.setOption(
          {
            series: [
              ...(prev?.seriesId != null
                ? [
                    {
                      id: prev.seriesId,
                      select: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
                      emphasis: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
                    },
                  ]
                : []),
              ...(prev && prev.seriesId == null
                ? patchSeriesByIndex(prev.seriesIndex, {
                    select: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
                    emphasis: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
                  })
                : []),
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
    const baseSeries = Array.isArray((optRef.current as any)?.series) ? ((optRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex] ?? null
    const seriesId = base && typeof base === 'object' ? (base.id ?? null) : null
    const baseScaleSize = Number(base?.select?.scaleSize ?? base?.emphasis?.scaleSize ?? 10) || 10
    const baseBlur = Number(base?.select?.itemStyle?.shadowBlur ?? base?.emphasis?.itemStyle?.shadowBlur ?? 30) || 30
    pulseRef.current.target = { seriesIndex, dataIndex, seriesId, baseScaleSize, baseBlur }
    const hv = selectedHoverRef.current
    if (hv && hv.seriesIndex === seriesIndex && hv.dataIndex === dataIndex) setPulseOverlayFromHover(hv)
    else setPulseOverlayFallback(seriesIndex, dataIndex)
    try {
      const scaleSize = Math.max(2, Math.round(baseScaleSize + 8))
      const blur = Math.max(1, Math.round(baseBlur * 1.8))
      if (seriesId != null) {
        inst.setOption(
          {
            series: [
              {
                id: seriesId,
                selectedMode: 'single',
                select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
              },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } else {
        inst.setOption(
          {
            series: patchSeriesByIndex(seriesIndex, {
              selectedMode: 'single',
              select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
              emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
            }),
          },
          { notMerge: false, lazyUpdate: true },
        )
      }
    } catch {}
    pulseRef.current.timer = window.setInterval(() => {
      const current = instanceRef.current
      const target = pulseRef.current.target
      if (!current || !target) return
      const on = !pulseRef.current.on
      pulseRef.current.on = on
      try {
        const scaleSize = Math.max(2, Math.round(target.baseScaleSize + (on ? 8 : 0)))
        const blur = Math.max(1, Math.round(target.baseBlur * (on ? 1.8 : 0.9)))
        if (target.seriesId != null) {
          current.setOption(
            { series: [{ id: target.seriesId, select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } }, emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } } }] },
            { notMerge: false, lazyUpdate: true },
          )
        } else {
          current.setOption(
            {
              series: patchSeriesByIndex(target.seriesIndex, {
                select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
              }),
            },
            { notMerge: false, lazyUpdate: true },
          )
        }
        current.dispatchAction({ type: 'select', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex } as any)
        current.dispatchAction({ type: 'highlight', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex } as any)
      } catch {}
    }, 420)
  }

  const clearSelection = (click: ChartHover) => {
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
    onSelectedChangeRef.current?.(null, click)
  }

  const setSelection = (next: { seriesIndex: number; dataIndex: number }, click: ChartHover) => {
    const inst = instanceRef.current
    if (!inst) return
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
    onSelectedChangeRef.current?.(next, click)
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
      const hv = pickHover(p)
      onClickRef.current?.(hv)
      if (typeof hv.seriesIndex === 'number' && typeof hv.dataIndex === 'number') {
        selectedHoverRef.current = hv
        const cur = getCurrentSelected()
        const isSame = !!cur && cur.seriesIndex === hv.seriesIndex && cur.dataIndex === hv.dataIndex
        if (isSame) clearSelection(hv)
        else setSelection({ seriesIndex: hv.seriesIndex, dataIndex: hv.dataIndex }, hv)
        return
      }
      clearSelection(hv)
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
      const inside = Array.isArray(path) ? path.includes(el0) : el0.contains(e?.target)
      if (inside) return
      clearSelection({} as any)
    }
    window.addEventListener('click', handleWindowClick, true)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('click', handleWindowClick, true)
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
      const hv = selectedHoverRef.current
      if (hv && hv.seriesIndex === cur.seriesIndex && hv.dataIndex === cur.dataIndex) setPulseOverlayFromHover(hv)
      else setPulseOverlayFallback(cur.seriesIndex, cur.dataIndex)
    }
  }, [opt])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    if (!selected) {
      stopPulse()
      applyLineSymbolVisibility(false)
      inst.dispatchAction({ type: 'downplay' } as any)
      return
    }
    selectedHoverRef.current = {
      seriesIndex: selected.seriesIndex,
      dataIndex: selected.dataIndex,
    }
    inst.dispatchAction({ type: 'highlight', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    applyLineSymbolVisibility(true)
    inst.dispatchAction({ type: 'showTip', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    startPulse(selected.seriesIndex, selected.dataIndex)
  }, [pulseEnabled, selected])

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 220, ...style }} />
}
