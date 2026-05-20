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
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    target: { seriesIndex: number; dataIndex: number; seriesId: string | number | null; baseScaleSize: number; baseBlur: number } | null
  }>({ timer: null, on: false, target: null })
  const PULSE_OVERLAY_SERIES_ID = '__echart_pulse_overlay__'

  const opt = useMemo(() => {
    if (!legendSingleLine) return option
    const o: any = option ?? {}
    if (!o.legend) return o
    const legend = Array.isArray(o.legend) ? o.legend : [o.legend]
    return {
      ...o,
      legend: legend.map((x: any) => ({
        ...x,
        type: 'scroll',
        orient: 'horizontal',
        top: 6,
        left: 10,
        right: 10,
      })),
    }
  }, [legendSingleLine, option])

  const getCurrentSelected = () => (selectedPropRef.current !== undefined ? selectedPropRef.current : internalSelectedRef.current)

  const getAxisX = (idx: number) => {
    const xAxis: any = (optRef.current as any)?.xAxis
    const data = Array.isArray(xAxis) ? xAxis[0]?.data : xAxis?.data
    return Array.isArray(data) ? data[idx] : idx
  }

  const getSeriesColor = (series: any, seriesIndex: number) => {
    const c =
      (series?.itemStyle && typeof series.itemStyle === 'object' ? series.itemStyle.color : null) ??
      (series?.lineStyle && typeof series.lineStyle === 'object' ? series.lineStyle.color : null) ??
      ((optRef.current as any)?.color?.[seriesIndex] ?? null) ??
      '#6CB6FF'
    return String(c)
  }

  const setPulseOverlay = (seriesIndex: number, dataIndex: number) => {
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
    const symbolSize = isLine ? 20 : 24
    const shadowBlur = isLine ? 32 : 36
    const rippleScale = isLine ? 3.4 : 3.6
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
    for (const s of baseSeries) {
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const id = s.id ?? null
      if (id == null) continue
      patches.push({ id, showSymbol: on })
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
    setPulseOverlay(seriesIndex, dataIndex)
    pulseRef.current.timer = window.setInterval(() => {
      const current = instanceRef.current
      const target = pulseRef.current.target
      if (!current || !target) return
      const on = !pulseRef.current.on
      pulseRef.current.on = on
      try {
        if (target.seriesId != null) {
          const scaleSize = Math.max(2, Math.round(target.baseScaleSize + (on ? 3 : 0)))
          const blur = Math.max(1, Math.round(target.baseBlur * (on ? 1.28 : 0.94)))
          current.setOption(
            { series: [{ id: target.seriesId, select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } }, emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } } }] },
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
        const cur = getCurrentSelected()
        const isSame = !!cur && cur.seriesIndex === hv.seriesIndex && cur.dataIndex === hv.dataIndex
        if (isSame) clearSelection(hv)
        else setSelection({ seriesIndex: hv.seriesIndex, dataIndex: hv.dataIndex }, hv)
        return
      }
      clearSelection(hv)
    })

    const ro = new ResizeObserver(() => inst.resize())
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
      ro.disconnect()
      window.removeEventListener('click', handleWindowClick, true)
      inst.dispose()
      instanceRef.current = null
    }
  }, [isDark])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    optRef.current = opt
    inst.setOption(opt, { notMerge: true, lazyUpdate: true })
    const cur = getCurrentSelected()
    if (cur) {
      applyLineSymbolVisibility(true)
      setPulseOverlay(cur.seriesIndex, cur.dataIndex)
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
    inst.dispatchAction({ type: 'highlight', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    applyLineSymbolVisibility(true)
    inst.dispatchAction({ type: 'showTip', seriesIndex: selected.seriesIndex, dataIndex: selected.dataIndex } as any)
    startPulse(selected.seriesIndex, selected.dataIndex)
  }, [pulseEnabled, selected])

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 220, ...style }} />
}
