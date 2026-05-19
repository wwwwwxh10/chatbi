import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import 'echarts-liquidfill'

export type ChartHover = {
  seriesName?: string
  name?: string
  value?: unknown
  dataIndex?: number
  seriesIndex?: number
  dataType?: string
  offsetX?: number
  offsetY?: number
  color?: string
  isGroup?: boolean
}

type ChartSelection = {
  seriesIndex: number
  dataIndex: number
  isGroup?: boolean
}

type PulseTarget = {
  seriesIndex: number
  dataIndex: number
  seriesId: string | number | null
  baseScaleSize: number
  baseBlur: number
  baseSymbolSize: number
  baseBorderWidth: number
  baseBorderColor: string | null
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function EChart({
  option,
  onHover,
  onLeave,
  onClick,
  onBlankAreaClick,
  selected,
  selectedItems,
  onSelectedChange,
  suspended,
  pulseEnabled,
  selectionEnabled = true,
  legendSingleLine,
  style,
  className,
}: {
  option: EChartsOption
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
  onBlankAreaClick?: () => void
  selected?: ChartSelection | null
  selectedItems?: ChartSelection[] | null
  onSelectedChange?: (next: ChartSelection | null, v: ChartHover) => void
  suspended?: boolean
  pulseEnabled?: boolean
  selectionEnabled?: boolean
  legendSingleLine?: boolean
  style?: CSSProperties
  className?: string
}) {
  const PULSE_OVERLAY_ID = '__chart_selected_pulse_overlay__'
  const elRef = useRef<HTMLDivElement | null>(null)
  const instRef = useRef<echarts.ECharts | null>(null)
  const optionRef = useRef<EChartsOption>(option)
  const baseSizeRef = useRef<number>(13)
  const scaleRef = useRef<number>(1)
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const selectedRef = useRef<ChartSelection | null>(null)
  const selectedItemsRef = useRef<ChartSelection[]>([])
  const hoverRef = useRef<ChartSelection | null>(null)
  const hoverItemsRef = useRef<ChartSelection[]>([])
  const hoverModeRef = useRef<'item' | 'group' | null>(null)
  const suppressZrClickUntilRef = useRef<number>(0)
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    startTime: number
    target: PulseTarget | null
  }>({
    timer: null,
    on: false,
    startTime: 0,
    target: null,
  })

  const nowMs = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now())

  const stopPulse = () => {
    const prev = pulseRef.current.target
    const inst = instRef.current
    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false
    pulseRef.current.target = null
    if (inst) {
      try {
        const patches: any[] = [
          {
            id: PULSE_OVERLAY_ID,
            data: [],
          },
        ]
        if (prev?.seriesId != null) {
          patches.push({
            id: prev.seriesId,
            select: {
              scale: true,
              scaleSize: prev.baseScaleSize,
              symbolSize: prev.baseSymbolSize,
              itemStyle: {
                shadowBlur: prev.baseBlur,
                borderWidth: prev.baseBorderWidth,
                borderColor: prev.baseBorderColor ?? undefined,
              },
            },
            emphasis: {
              scale: true,
              scaleSize: prev.baseScaleSize,
              symbolSize: prev.baseSymbolSize,
              itemStyle: {
                shadowBlur: prev.baseBlur,
                borderWidth: prev.baseBorderWidth,
                borderColor: prev.baseBorderColor ?? undefined,
              },
            },
          })
        }
        inst.setOption(
          {
            series: patches,
          },
          { notMerge: false, lazyUpdate: false },
        )
      } catch {}
    }
  }

  const renderPulseFrame = (target: PulseTarget, elapsed: number, immediate = false) => {
    const inst = instRef.current
    if (!inst) return

    const overlayValue = getPulseOverlayValue(target.seriesIndex, target.dataIndex)
    const overlayColor = getSeriesColor(target.seriesIndex)
    const lineLike = isLineSeries(target.seriesIndex)
    const pulseBaseScaleSize = lineLike ? 18 : target.baseScaleSize
    const pulseBaseBlur = lineLike ? 56 : target.baseBlur
    const pulseBaseSymbolSize = lineLike ? 28 : target.baseSymbolSize
    const t = ((elapsed % 3200) / 3200) * Math.PI * 2
    const pulse = Math.sin(t)
    const scaleSize = Math.max(4, pulseBaseScaleSize + 1 + pulse * 1.2)
    const blur = Math.max(8, pulseBaseBlur * (0.72 + pulse * 0.1))
    const symbolSize = Math.max(pulseBaseSymbolSize + 1, pulseBaseSymbolSize + 2 + pulse * 1.1)
    const overlayGlow = Math.min(Math.max(pulseBaseBlur * 0.22, 10), 22)

    try {
      const seriesPatches: any[] = [
        overlayValue
          ? {
              id: PULSE_OVERLAY_ID,
              type: 'effectScatter',
              coordinateSystem: 'cartesian2d',
              xAxisIndex: getSeriesAxisIndex(target.seriesIndex, 'x'),
              yAxisIndex: getSeriesAxisIndex(target.seriesIndex, 'y'),
              silent: true,
              z: 100,
              animationDuration: 0,
              rippleEffect: { scale: 1.78, brushType: 'stroke' },
              symbol: 'circle',
              symbolSize: Math.max(pulseBaseSymbolSize - 1, 6),
              itemStyle: {
                color: overlayColor,
                shadowBlur: overlayGlow,
                shadowColor: overlayColor,
                opacity: 0.8,
              },
              emphasis: { scale: false, disabled: true },
              tooltip: { show: false },
              data: [{ value: overlayValue }],
            }
          : {
              id: PULSE_OVERLAY_ID,
              data: [],
            },
      ]

      if (target.seriesId != null) {
        seriesPatches.push({
          id: target.seriesId,
          showSymbol: true,
          select: {
            scale: true,
            scaleSize,
            symbolSize,
            itemStyle: {
              shadowBlur: blur,
              borderWidth: lineLike ? 0 : target.baseBorderWidth,
              borderColor: lineLike ? 'transparent' : target.baseBorderColor ?? undefined,
            },
          },
          emphasis: {
            scale: true,
            scaleSize,
            symbolSize,
            itemStyle: {
              shadowBlur: blur,
              borderWidth: lineLike ? 0 : target.baseBorderWidth,
              borderColor: lineLike ? 'transparent' : target.baseBorderColor ?? undefined,
            },
          },
        })
      }

      inst.setOption(
        {
          series: seriesPatches,
        },
        { notMerge: false, lazyUpdate: !immediate },
      )
    } catch {}

    try {
      inst.dispatchAction({ type: 'select', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex })
      inst.dispatchAction({ type: 'highlight', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex })
    } catch {}
  }

  const startPulse = (seriesIndex: number, dataIndex: number) => {
    if (pulseEnabled === false) return
    const inst = instRef.current
    if (!inst) return
    const prev = pulseRef.current.target
    const sameTarget = Boolean(prev && prev.seriesIndex === seriesIndex && prev.dataIndex === dataIndex)

    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex] ?? null
    const seriesId = base && typeof base === 'object' ? (base.id ?? null) : null
    const baseSelect = base?.select
    const baseEmphasis = base?.emphasis
    const baseScaleSize = Number(baseSelect?.scaleSize ?? baseEmphasis?.scaleSize ?? 10) || 10
    const baseBlur = Number(baseSelect?.itemStyle?.shadowBlur ?? baseEmphasis?.itemStyle?.shadowBlur ?? 30) || 30
    const baseSymbolSize = resolveSeriesSymbolSize(seriesIndex, dataIndex)
    const baseBorderWidth =
      Number(
        baseSelect?.itemStyle?.borderWidth ??
          baseEmphasis?.itemStyle?.borderWidth ??
          base?.itemStyle?.borderWidth ??
          0,
      ) || 0
    const borderColor =
      baseSelect?.itemStyle?.borderColor ??
      baseEmphasis?.itemStyle?.borderColor ??
      base?.itemStyle?.borderColor ??
      null
    const baseBorderColor = typeof borderColor === 'string' && borderColor.trim() ? borderColor : null

    if (sameTarget && pulseRef.current.timer) {
      pulseRef.current.on = true
      renderPulseFrame(prev as PulseTarget, Date.now() - pulseRef.current.startTime, true)
      return
    }

    stopPulse()

    const target: PulseTarget = {
      seriesIndex,
      dataIndex,
      seriesId,
      baseScaleSize,
      baseBlur,
      baseSymbolSize,
      baseBorderWidth,
      baseBorderColor,
    }

    pulseRef.current.target = target
    pulseRef.current.on = true
    pulseRef.current.startTime = Date.now()
    renderPulseFrame(target, 0, true)

    pulseRef.current.timer = window.setInterval(() => {
      const current = instRef.current
      const pulseTarget = pulseRef.current.target
      if (!current || !pulseTarget) return
      if (typeof (current as any).isDisposed === 'function' && (current as any).isDisposed()) return
      renderPulseFrame(pulseTarget, Date.now() - pulseRef.current.startTime)
    }, 80)
  }

  const applyLineHoverSymbols = (seriesIndex: number | null) => {
    const inst = instRef.current
    if (!inst) return
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const patches: any[] = []

    for (let i = 0; i < baseSeries.length; i += 1) {
      const s = baseSeries[i]
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const id = s.id ?? null
      if (id == null) continue

      const on = seriesIndex != null && i === seriesIndex
      patches.push({ id, showSymbol: Boolean(on), symbol: 'circle' })
    }
    if (!patches.length) return
    try {
      inst.setOption({ series: patches }, { notMerge: false, lazyUpdate: true })
    } catch {}
  }

  const dispatchStateAction = (type: 'highlight' | 'downplay' | 'select' | 'unselect', items: ChartSelection[]) => {
    const inst = instRef.current
    if (!inst || items.length === 0) return
    for (const item of items) {
      if (!Number.isFinite(item.seriesIndex) || !Number.isFinite(item.dataIndex)) continue
      try {
        inst.dispatchAction({ type, seriesIndex: item.seriesIndex, dataIndex: item.dataIndex })
      } catch {}
    }
  }

  const hideTooltip = () => {
    const inst = instRef.current
    if (!inst) return
    try {
      inst.dispatchAction({ type: 'hideTip' })
    } catch {}
  }

  const clearSelectionStates = (items: ChartSelection[]) => {
    dispatchStateAction('downplay', items)
    dispatchStateAction('unselect', items)
  }

  const clearHighlightStates = (items: ChartSelection[]) => {
    dispatchStateAction('downplay', items)
  }

  const restoreBaseOption = () => {
    const inst = instRef.current
    if (!inst) return
    try {
      const w = elRef.current?.clientWidth ?? sizeRef.current.w
      inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current, w, legendSingleLine), { notMerge: true, lazyUpdate: true })
    } catch {}
  }

  const resetHoverState = () => {
    if (hoverItemsRef.current.length) {
      clearHighlightStates(hoverItemsRef.current)
    }
    hideTooltip()
    hoverItemsRef.current = []
    hoverRef.current = null
    hoverModeRef.current = null
  }

  const applySelectionStates = (items: ChartSelection[], { showTip = false }: { showTip?: boolean } = {}) => {
    const inst = instRef.current
    if (!inst || items.length === 0) return
    dispatchStateAction('select', items)
    dispatchStateAction('highlight', items)
    if (showTip) {
      const first = items[0]
      try {
        inst.dispatchAction({ type: 'showTip', seriesIndex: first.seriesIndex, dataIndex: first.dataIndex })
      } catch {}
    }
  }

  const applyHighlightStates = (items: ChartSelection[], { showTip = false }: { showTip?: boolean } = {}) => {
    const inst = instRef.current
    if (!inst || items.length === 0) return
    dispatchStateAction('highlight', items)
    if (showTip) {
      const first = items[0]
      try {
        inst.dispatchAction({ type: 'showTip', seriesIndex: first.seriesIndex, dataIndex: first.dataIndex })
      } catch {}
    }
  }

  const getBarSeriesIndices = () => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    return baseSeries
      .map((s, idx) => (String(s?.type) === 'bar' ? idx : null))
      .filter((idx): idx is number => idx !== null)
  }

  const getSeriesType = (seriesIndex: number) => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    return String(baseSeries[seriesIndex]?.type ?? '')
  }

  const isLineSeries = (seriesIndex: number) => getSeriesType(seriesIndex) === 'line'

  const isScatterSeries = (seriesIndex: number) => getSeriesType(seriesIndex) === 'scatter'

  const isBarSeries = (seriesIndex: number) => {
    return getSeriesType(seriesIndex) === 'bar'
  }

  const supportsPulseSelection = (seriesIndex: number) => isLineSeries(seriesIndex) || isScatterSeries(seriesIndex)

  const setSelectionLocally = (nextItems: ChartSelection[], { showTip = false, restoreBaseOnEmpty = true }: { showTip?: boolean; restoreBaseOnEmpty?: boolean } = {}) => {
    const prevItems = selectedItemsRef.current
    stopPulse()
    if (prevItems.length) clearSelectionStates(prevItems)
    resetHoverState()

    selectedItemsRef.current = nextItems
    selectedRef.current = nextItems.length ? { ...nextItems[0] } : null

    if (nextItems.length === 0) {
      applyLineHoverSymbols(null)
      if (restoreBaseOnEmpty) restoreBaseOption()
      hideTooltip()
      return
    }

    applySelectionStates(nextItems, { showTip })
    syncLineInteractionState()
  }

  const getSeriesAxisIndex = (seriesIndex: number, axis: 'x' | 'y') => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const s = baseSeries[seriesIndex]
    const key = axis === 'x' ? 'xAxisIndex' : 'yAxisIndex'
    const raw = Number(s?.[key])
    return Number.isFinite(raw) ? raw : 0
  }

  const getSeriesColor = (seriesIndex: number) => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const palette = Array.isArray((optionRef.current as any)?.color) ? ((optionRef.current as any).color as any[]) : []
    const s = baseSeries[seriesIndex]
    const rawColor = s?.itemStyle?.borderColor ?? s?.lineStyle?.color ?? s?.itemStyle?.color ?? palette[seriesIndex] ?? palette[0] ?? '#6AA6FF'
    return typeof rawColor === 'string' && rawColor.trim() ? rawColor : String(palette[seriesIndex] ?? palette[0] ?? '#6AA6FF')
  }

  const resolveSeriesSymbolSize = (seriesIndex: number, dataIndex: number) => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const series = baseSeries[seriesIndex]
    const data = Array.isArray(series?.data) ? series.data[dataIndex] : undefined
    const value = data && typeof data === 'object' && 'value' in data ? (data as any).value : data

    const resolve = (candidate: unknown): number | null => {
      const fixed = toFiniteNumber(candidate)
      if (fixed != null) return fixed
      if (typeof candidate === 'function') {
        try {
          return toFiniteNumber(candidate(value, { value, data, dataIndex, seriesIndex }))
        } catch {
          return null
        }
      }
      return null
    }

    return resolve(series?.select?.symbolSize) ?? resolve(series?.emphasis?.symbolSize) ?? resolve(series?.symbolSize) ?? 8
  }

  const getPulseOverlayValue = (seriesIndex: number, dataIndex: number) => {
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const xAxis = (optionRef.current as any)?.xAxis
    const xAxisList = Array.isArray(xAxis) ? xAxis : xAxis ? [xAxis] : []
    const xAxisIndex = getSeriesAxisIndex(seriesIndex, 'x')
    const axisData = Array.isArray(xAxisList[xAxisIndex]?.data) ? xAxisList[xAxisIndex].data : []
    const s = baseSeries[seriesIndex]
    const raw = Array.isArray(s?.data) ? s.data[dataIndex] : undefined
    const xValue = axisData[dataIndex] ?? dataIndex

    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object') {
      const value = (raw as any).value
      if (Array.isArray(value)) return value
      if (typeof value === 'number' || typeof value === 'string') return [xValue, value]
    }
    if (typeof raw === 'number' || typeof raw === 'string') return [xValue, raw]
    return null
  }

  const syncLineInteractionState = () => {
    const selectedItemsNow = selectedItemsRef.current
    const selectedLineItem = selectedItemsNow.length === 1 && supportsPulseSelection(selectedItemsNow[0].seriesIndex) ? selectedItemsNow[0] : null
    const hoveredLineItem = hoverModeRef.current === 'item' && hoverRef.current && supportsPulseSelection(hoverRef.current.seriesIndex) ? hoverRef.current : null

    if (selectedLineItem) {
      applyLineHoverSymbols(isLineSeries(selectedLineItem.seriesIndex) ? selectedLineItem.seriesIndex : null)
      if (suspended) stopPulse()
      else startPulse(selectedLineItem.seriesIndex, selectedLineItem.dataIndex)
      return
    }

    stopPulse()
    applyLineHoverSymbols(hoveredLineItem && isLineSeries(hoveredLineItem.seriesIndex) ? hoveredLineItem.seriesIndex : null)
  }

  const reapplyInteractiveState = () => {
    const selectedItemsNow = selectedItemsRef.current
    if (selectedItemsNow.length) applySelectionStates(selectedItemsNow)
    if (hoverItemsRef.current.length) applyHighlightStates(hoverItemsRef.current, { showTip: true })
    syncLineInteractionState()
  }

  useEffect(() => {
    optionRef.current = option
    const inst = instRef.current
    if (!inst) return
    const el = elRef.current
    const w = el ? el.clientWidth : sizeRef.current.w
    inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current, w, legendSingleLine), { notMerge: true, lazyUpdate: true })
    reapplyInteractiveState()
  }, [option, legendSingleLine])

  useEffect(() => {
    if (selected === undefined && selectedItems === undefined) return
    const inst = instRef.current
    if (!inst) return
    const nextItems = Array.isArray(selectedItems) ? selectedItems : selected ? [selected] : []
    setSelectionLocally(nextItems)
  }, [selected, selectedItems, legendSingleLine, pulseEnabled])

  useEffect(() => {
    const inst = instRef.current
    if (!inst) return
    const sel = selectedRef.current
    if (!sel) return
    if (suspended) {
      stopPulse()
      try {
        clearSelectionStates(selectedItemsRef.current.length ? selectedItemsRef.current : [sel])
      } catch {}
      return
    }
    applySelectionStates(selectedItemsRef.current.length ? selectedItemsRef.current : [sel])
    syncLineInteractionState()
  }, [suspended, pulseEnabled])

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const inst = echarts.init(el)
    instRef.current = inst

    const syncBase = () => {
      const w = Math.max(1, el.clientWidth)
      void w
      baseSizeRef.current = 13
      const h = Math.max(1, el.clientHeight)
      sizeRef.current = { w, h }
      scaleRef.current = Math.min(1, Math.max(0.5, Math.min(w / 420, h / 260)))
    }

    let raf = 0
    let tries = 0
    let lastW = 0
    let lastH = 0
    const applyUntilStable = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 10 || h < 10) {
        tries += 1
        if (tries < 30) raf = requestAnimationFrame(applyUntilStable)
        return
      }
      const changed = Math.abs(w - lastW) > 2 || Math.abs(h - lastH) > 2
      lastW = w
      lastH = h
      syncBase()
      inst.resize()
      inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current, w, legendSingleLine), { notMerge: true, lazyUpdate: true })
      reapplyInteractiveState()
      tries += 1
      if (tries < 12 && (changed || tries < 4)) raf = requestAnimationFrame(applyUntilStable)
    }
    raf = requestAnimationFrame(applyUntilStable)

    const handleOver = (p: any) => {
      const seriesIndex = Number(p?.seriesIndex)
      const dataIndex = Number(p?.dataIndex)
      if (Number.isFinite(seriesIndex) && Number.isFinite(dataIndex)) {
        const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
        const s0 = baseSeries[seriesIndex]
        if (s0 && typeof s0 === 'object' && String(s0.type) === 'line') {
          applyLineHoverSymbols(seriesIndex)
        }
        const prevHover = hoverRef.current

        const prevIsSameItem =
          prevHover &&
          prevHover.seriesIndex === seriesIndex &&
          prevHover.dataIndex === dataIndex &&
          hoverModeRef.current === 'item'
        if (prevIsSameItem) {
          onHover?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex, seriesIndex: p?.seriesIndex, color: p?.color })
          return
        }

        if (hoverItemsRef.current.length) resetHoverState()

        const hoverItems = [{ seriesIndex, dataIndex }]
        applyHighlightStates(hoverItems, { showTip: true })
        hoverRef.current = { seriesIndex, dataIndex }
        hoverItemsRef.current = hoverItems
        hoverModeRef.current = 'item'
        syncLineInteractionState()
      }

      onHover?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex, seriesIndex: p?.seriesIndex, color: p?.color })
    }
    const handleOut = () => {
      onLeave?.()
      const selectedNow = selectedRef.current
      const selectedItemsNow = selectedItemsRef.current
      resetHoverState()
      if (selectedNow) {
        applySelectionStates(selectedItemsNow.length ? selectedItemsNow : [selectedNow])
        syncLineInteractionState()
      } else {
        syncLineInteractionState()
      }
    }
    const handleClick = (p: any) => {
      const domEv = p?.event?.event as any
      if (selectionEnabled !== false && domEv && typeof domEv.stopPropagation === 'function') domEv.stopPropagation()

      const seriesIndex = Number(p?.seriesIndex)
      const dataIndex = Number(p?.dataIndex)
      
      // Task 6: Detect if it's a specific bar or point click
      const isItemClick = Number.isFinite(seriesIndex) && Number.isFinite(dataIndex)
      
      const pixel = (() => {
        if (!isItemClick) return null
        try {
          const v = p?.value
          if (Array.isArray(v)) {
            const r = inst.convertToPixel({ seriesIndex }, v as any)
            return Array.isArray(r) && r.length >= 2 ? [Number(r[0]), Number(r[1])] : null
          }
          if (typeof v === 'number' || typeof v === 'string') {
            const r = inst.convertToPixel({ seriesIndex }, [dataIndex, v] as any)
            return Array.isArray(r) && r.length >= 2 ? [Number(r[0]), Number(r[1])] : null
          }
          if ((typeof p?.name === 'string' || typeof p?.name === 'number') && (typeof v === 'number' || typeof v === 'string')) {
            const r = inst.convertToPixel({ seriesIndex }, [p.name, v] as any)
            return Array.isArray(r) && r.length >= 2 ? [Number(r[0]), Number(r[1])] : null
          }
          return null
        } catch {
          return null
        }
      })()
      const clickPayload: ChartHover = {
        seriesName: p?.seriesName,
        name: p?.name,
        value: p?.value,
        dataIndex: p?.dataIndex,
        seriesIndex: p?.seriesIndex,
        dataType: p?.dataType,
        offsetX: pixel && Number.isFinite(pixel[0]) ? pixel[0] : typeof p?.event?.offsetX === 'number' ? p.event.offsetX : undefined,
        offsetY: pixel && Number.isFinite(pixel[1]) ? pixel[1] : typeof p?.event?.offsetY === 'number' ? p.event.offsetY : undefined,
        color: p?.color,
      }

      if (isItemClick) {
        suppressZrClickUntilRef.current = nowMs() + 220
        if (!selectionEnabled) {
          onClick?.(clickPayload)
          return
        }

        const prevItems = selectedItemsRef.current
        const nextItems = isBarSeries(seriesIndex) ? [{ seriesIndex, dataIndex }] : [{ seriesIndex, dataIndex }]
        const isSame =
          prevItems.length === nextItems.length &&
          nextItems.every((item) => prevItems.some((prev) => prev.seriesIndex === item.seriesIndex && prev.dataIndex === item.dataIndex))
        const finalItems = isSame ? [] : nextItems

        setSelectionLocally(finalItems, { showTip: true })

        onSelectedChange?.(finalItems.length ? finalItems[0] : null, clickPayload)
      }

      onClick?.(clickPayload)
    }

    const handleZrClick = (p: any) => {
      if (nowMs() < suppressZrClickUntilRef.current) return
      if (p.target) return

      if (!selectionEnabled) {
        onBlankAreaClick?.()
        return
      }

      if (selectedItemsRef.current.length) {
        suppressZrClickUntilRef.current = nowMs() + 120
        setSelectionLocally([])
        onSelectedChange?.(null, {})
        onBlankAreaClick?.()
        return
      }

      const pointInPixel = [p.offsetX, p.offsetY]
      if (!inst.containPixel('grid', pointInPixel)) {
        resetHoverState()
        onBlankAreaClick?.()
        return
      }

      const pointInGrid = inst.convertFromPixel({ gridIndex: 0 }, pointInPixel)
      if (!Array.isArray(pointInGrid)) return

      const dataIndex = Math.round(pointInGrid[0])
      if (!Number.isFinite(dataIndex)) return

      const barSeriesIndices = getBarSeriesIndices()

      if (barSeriesIndices.length > 1) {
        const nextItems = barSeriesIndices.map((si) => ({ seriesIndex: si, dataIndex }))
        const prevItems = selectedItemsRef.current
        const isSameGroup = prevItems.length === nextItems.length && prevItems.every(p => p.dataIndex === dataIndex)

        if (isSameGroup) {
          onSelectedChange?.(null, {})
        } else {
          const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
          const sample = baseSeries[barSeriesIndices[0]]
          const rawValue = Array.isArray(sample?.data) ? sample.data[dataIndex] : undefined
          onSelectedChange?.(
            { seriesIndex: barSeriesIndices[0], dataIndex, isGroup: true } as any,
            { dataIndex, seriesIndex: barSeriesIndices[0], name: sample?.name, value: rawValue, isGroup: true } as any,
          )
        }
      }
    }

    const handleAxisPointer = (p: any) => {
      const axes = Array.isArray(p?.axesInfo) ? p.axesInfo : []
      const first = axes[0]
      const seriesData = Array.isArray(first?.seriesData) ? first.seriesData : []
      const seriesIndex = Number(seriesData[0]?.seriesIndex)
      if (Number.isFinite(seriesIndex)) {
        const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
        const s0 = baseSeries[seriesIndex]
        if (s0 && typeof s0 === 'object' && String(s0.type) === 'line') {
          applyLineHoverSymbols(seriesIndex)
          return
        }
      }
    }

    const handleZrMove = (p: any) => {
      if (p?.target || hoverItemsRef.current.length === 0) return
      const selectedNow = selectedRef.current
      const selectedItemsNow = selectedItemsRef.current
      resetHoverState()
      if (selectedNow) {
        applySelectionStates(selectedItemsNow.length ? selectedItemsNow : [selectedNow])
      }
      syncLineInteractionState()
    }

    inst.on('mouseover', handleOver)
    inst.on('globalout', handleOut)
    inst.on('mouseout', handleOut)
    inst.on('click', handleClick)
    inst.getZr().on('click', handleZrClick)
    inst.getZr().on('mousemove', handleZrMove)
    inst.on('updateAxisPointer', handleAxisPointer)

    const ro = new ResizeObserver(() => {
      syncBase()
      inst.resize()
      inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
      reapplyInteractiveState()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      try {
        ro.disconnect()
      } catch {}
      try {
        inst.off('mouseover', handleOver)
        inst.off('globalout', handleOut)
        inst.off('mouseout', handleOut)
        inst.off('click', handleClick)
        inst.getZr()?.off('click', handleZrClick)
        inst.getZr()?.off('mousemove', handleZrMove)
        inst.off('updateAxisPointer', handleAxisPointer)
      } catch {}
      if (pulseRef.current.timer) {
        window.clearInterval(pulseRef.current.timer)
        pulseRef.current.timer = null
      }
      inst.dispose()
      instRef.current = null
    }
  }, [])

  return <div ref={elRef} className={className ? `chartCanvas ${className}` : 'chartCanvas'} style={style} />
}

function injectTypography(raw: EChartsOption, baseSize: number, scale: number, chartW?: number, legendSingleLine?: boolean) {
  const measureText = (text: string, fontSize: number) => {
    let w = 0
    for (const ch of text) {
      const code = ch.codePointAt(0) ?? 0
      w += fontSize * (code > 255 ? 1.12 : 0.68)
    }
    return w
  }

  const collectLegendNames = () => {
    const lg: any = (raw as any).legend
    const pick = (x: any) => {
      if (!x) return null
      if (Array.isArray(x?.data)) return x.data.map((v: any) => String(v))
      const s = (raw as any).series
      const series = Array.isArray(s) ? s : s ? [s] : []
      const names = series.map((it: any) => String(it?.name ?? '')).filter((n: string) => n.trim())
      return Array.from(new Set(names))
    }
    if (Array.isArray(lg)) return pick(lg[0])
    return pick(lg)
  }

  const fitLegendSingleRow = (legend: any) => {
    if (!legend || legend.show === false) return legend
    if (!legendSingleLine && !legend.__autoHideOverflow) return legend
    if (!chartW || chartW < 120) return legend
    const orient = String(legend.orient ?? 'horizontal')
    if (orient !== 'horizontal') return legend
    const names = (Array.isArray(legend.data) ? legend.data.map((v: any) => String(v)) : collectLegendNames()) ?? []
    if (!names.length) return legend
    const fontSize = Number(legend?.textStyle?.fontSize ?? baseSize) || baseSize
    const itemWidth = Number(legend.itemWidth ?? 14) || 14
    const padding = 84
    const avail = Math.max(0, chartW - padding)
    const itemLabelGap = 10

    const calculateTotalWidth = (gap: number) => {
      const itemsWidth = names.reduce((acc: number, n: string) => acc + itemWidth + itemLabelGap + measureText(n, fontSize) + 12, 0)
      return itemsWidth + Math.max(0, names.length - 1) * gap
    }

    // Try default gap
    const defaultGap = 24
    if (calculateTotalWidth(defaultGap) <= avail) {
      return { ...legend, itemGap: defaultGap, show: true }
    }

    // Try reducing gap down to 8
    const minGap = 8
    if (calculateTotalWidth(minGap) <= avail) {
      const autoGap = Math.max(minGap, Math.floor((avail - (calculateTotalWidth(0))) / (names.length - 1 || 1)))
      return { ...legend, itemGap: autoGap, show: true }
    }

    // Still doesn't fit, hide legend
    return { ...legend, show: false }
  }

  const mergeAxis = (axis: any) => {
    if (!axis) return axis
    const next = { ...axis }
    next.axisLabel = { ...(axis.axisLabel ?? {}) }
    if (next.axisLabel.fontSize == null) next.axisLabel.fontSize = baseSize
    next.nameTextStyle = { ...(axis.nameTextStyle ?? {}) }
    if (next.nameTextStyle.fontSize == null) next.nameTextStyle.fontSize = baseSize
    return next
  }

  const inferAxisUnit = () => {
    const yAxis = (raw as any).yAxis
    const first = Array.isArray(yAxis) ? yAxis[0] : yAxis
    const name = String(first?.name ?? '').trim()
    if (!name) return ''
    const m = /(?:\(|（)\s*([^)）]+?)\s*(?:\)|）)\s*$/.exec(name)
    return (m ? m[1] : '').trim()
  }

  const next: any = { ...raw }
  next.textStyle = { ...(raw as any).textStyle }
  if (next.textStyle.fontSize == null) next.textStyle.fontSize = baseSize

  if ((raw as any).legend) {
    const lg = (raw as any).legend
    const desiredLegendSize = legendSingleLine ? 12 : baseSize
    next.legend = Array.isArray(lg)
      ? lg.map((x) => {
          const textStyle = { ...(x.textStyle ?? {}) }
          textStyle.fontSize = desiredLegendSize
          return fitLegendSingleRow({ ...x, textStyle })
        })
      : (() => {
          const textStyle = { ...((lg as any).textStyle ?? {}) }
          textStyle.fontSize = desiredLegendSize
          return fitLegendSingleRow({ ...(lg as any), textStyle })
        })()
  }

  if ((raw as any).tooltip) {
    const t0: any = (raw as any).tooltip
    const tt: any = { ...t0, textStyle: { ...(t0?.textStyle ?? {}) } }
    if (tt.textStyle.fontSize == null) tt.textStyle.fontSize = baseSize
    if (tt.backgroundColor == null) tt.backgroundColor = 'rgba(16, 18, 22, 0.92)'
    if (tt.borderWidth == null) tt.borderWidth = 0
    if (tt.borderColor == null) tt.borderColor = 'transparent'
    if (!tt.textStyle?.color) tt.textStyle = { ...(tt.textStyle ?? {}), color: 'rgba(233, 236, 242, 0.92)' }
    tt.appendToBody = false
    tt.confine = true
    tt.extraCssText = `${String(tt.extraCssText ?? '')}; z-index: 99999; max-width: 92vw;`
    const trigger = String(tt.trigger ?? 'item')
    if (tt.formatter == null && trigger === 'axis') {
      const unit = inferAxisUnit()
      tt.formatter = (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const header = params[0]?.axisValueLabel || params[0]?.name || ''
        const lines = params
          .map((p: any) => {
            const marker = p?.marker || ''
            const name = p?.seriesName || p?.name || ''
            const v = p?.value
            const value = Array.isArray(v) ? v.map((x) => `${x}${unit}`).join(', ') : `${v}${unit}`
            return `${marker}${name}：${value}`
          })
          .join('<br/>')
        return `${header}<br/>${lines}`
      }
    }
    next.tooltip = tt
  }

  const xAxis = (raw as any).xAxis
  const yAxis = (raw as any).yAxis
  next.xAxis = Array.isArray(xAxis) ? xAxis.map(mergeAxis) : mergeAxis(xAxis)
  next.yAxis = Array.isArray(yAxis) ? yAxis.map(mergeAxis) : mergeAxis(yAxis)

  if (scale < 0.999) {
    const seen = new WeakSet<object>()
    const walk = (v: any, inLegend: boolean, inSpecialSeries: boolean) => {
      if (!v) return
      if (typeof v !== 'object') return
      if (typeof v === 'function') return
      if (seen.has(v)) return
      seen.add(v)
      if (Array.isArray(v)) {
        for (const x of v) walk(x, inLegend, inSpecialSeries)
        return
      }
      for (const k of Object.keys(v)) {
        const val = v[k]
        const currentIsSpecial = inSpecialSeries || v.type === 'liquidFill' || v.type === 'gauge'
        if (k === 'fontSize' && typeof val === 'number' && Number.isFinite(val)) {
          if (!inLegend && !currentIsSpecial) v[k] = Math.max(9, Math.round(val * scale))
          continue
        }
        walk(val, inLegend || k === 'legend', currentIsSpecial)
      }
    }
    walk(next, false, false)
  }

  return next as EChartsOption
}
