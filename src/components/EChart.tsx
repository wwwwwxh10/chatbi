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
}

export function EChart({
  option,
  onHover,
  onLeave,
  onClick,
  selected,
  selectedItems,
  onSelectedChange,
  suspended,
  pulseEnabled,
  legendSingleLine,
  style,
  className,
}: {
  option: EChartsOption
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
  selected?: { seriesIndex: number; dataIndex: number } | null
  selectedItems?: Array<{ seriesIndex: number; dataIndex: number }> | null
  onSelectedChange?: (next: { seriesIndex: number; dataIndex: number } | null, v: ChartHover) => void
  suspended?: boolean
  pulseEnabled?: boolean
  legendSingleLine?: boolean
  style?: CSSProperties
  className?: string
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const instRef = useRef<echarts.ECharts | null>(null)
  const optionRef = useRef<EChartsOption>(option)
  const baseSizeRef = useRef<number>(13)
  const scaleRef = useRef<number>(1)
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const selectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const selectedItemsRef = useRef<Array<{ seriesIndex: number; dataIndex: number }>>([])
  const hoverRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const hoverLineSeriesIdRef = useRef<string | number | null>(null)
  const pulseRef = useRef<{
    timer: number | null
    on: boolean
    target: { seriesIndex: number; dataIndex: number; seriesId: string | number | null; baseScaleSize: number; baseBlur: number } | null
  }>({
    timer: null,
    on: false,
    target: null,
  })

  const stopPulse = () => {
    const prev = pulseRef.current.target
    const inst = instRef.current
    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false
    pulseRef.current.target = null
    if (inst && prev && prev.seriesId != null) {
      try {
        inst.setOption(
          {
            series: [
              {
                id: prev.seriesId,
                select: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
                emphasis: { scale: true, scaleSize: prev.baseScaleSize, itemStyle: { shadowBlur: prev.baseBlur } },
              },
            ],
          },
          { notMerge: false, lazyUpdate: true },
        )
      } catch {}
    }
  }

  const startPulse = (seriesIndex: number, dataIndex: number) => {
    if (pulseEnabled === false) return
    stopPulse()
    const inst = instRef.current
    if (!inst) return

    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const base = baseSeries[seriesIndex] ?? null
    const seriesId = base && typeof base === 'object' ? (base.id ?? null) : null
    const baseSelect = base?.select
    const baseEmphasis = base?.emphasis
    const baseScaleSize = Number(baseSelect?.scaleSize ?? baseEmphasis?.scaleSize ?? 10) || 10
    const baseBlur = Number(baseSelect?.itemStyle?.shadowBlur ?? baseEmphasis?.itemStyle?.shadowBlur ?? 30) || 30

    pulseRef.current.target = { seriesIndex, dataIndex, seriesId, baseScaleSize, baseBlur }

    try {
      inst.dispatchAction({ type: 'select', seriesIndex, dataIndex })
      inst.dispatchAction({ type: 'highlight', seriesIndex, dataIndex })
    } catch {}

    pulseRef.current.timer = window.setInterval(() => {
      const current = instRef.current
      const target = pulseRef.current.target
      if (!current || !target) return
      if (typeof (current as any).isDisposed === 'function' && (current as any).isDisposed()) return
      const on = !pulseRef.current.on
      pulseRef.current.on = on
      try {
        if (target.seriesId != null) {
          const scaleSize = Math.max(2, Math.round(target.baseScaleSize + (on ? 3 : 0)))
          const blur = Math.max(1, Math.round(target.baseBlur * (on ? 1.32 : 0.92)))
          current.setOption(
            {
              series: [
                {
                  id: target.seriesId,
                  select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                  emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                },
              ],
            },
            { notMerge: false, lazyUpdate: true },
          )
        }
        current.dispatchAction({ type: 'select', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex })
        current.dispatchAction({ type: 'highlight', seriesIndex: target.seriesIndex, dataIndex: target.dataIndex })
      } catch {}
    }, 420)
  }

  const applyLineHoverSymbols = (seriesIndex: number | null) => {
    const inst = instRef.current
    if (!inst) return
    const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
    const patches: any[] = []
    let hoverId: string | number | null = null
    for (let i = 0; i < baseSeries.length; i += 1) {
      const s = baseSeries[i]
      if (!s || typeof s !== 'object') continue
      if (String(s.type) !== 'line') continue
      const id = s.id ?? null
      if (id == null) continue
      const on = seriesIndex != null && i === seriesIndex
      if (on) hoverId = id
      patches.push({ id, showSymbol: Boolean(on), symbol: 'circle' })
    }
    if (!patches.length) return
    try {
      inst.setOption({ series: patches }, { notMerge: false, lazyUpdate: true })
      hoverLineSeriesIdRef.current = hoverId
    } catch {}
  }

  useEffect(() => {
    optionRef.current = option
    const inst = instRef.current
    if (!inst) return
    const el = elRef.current
    const w = el ? el.clientWidth : sizeRef.current.w
    inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current, w, legendSingleLine), { notMerge: true, lazyUpdate: true })
  }, [option, legendSingleLine])

  useEffect(() => {
    if (selected === undefined && selectedItems === undefined) return
    const inst = instRef.current
    if (!inst) return
    const prevItems = selectedItemsRef.current
    const nextItems = Array.isArray(selectedItems) ? selectedItems : selected ? [selected] : []
    const same =
      prevItems.length === nextItems.length &&
      prevItems.every((p, idx) => p.seriesIndex === nextItems[idx]?.seriesIndex && p.dataIndex === nextItems[idx]?.dataIndex)
    if (same) return

    for (const p of prevItems) {
      try {
        inst.dispatchAction({ type: 'downplay', seriesIndex: p.seriesIndex, dataIndex: p.dataIndex })
        inst.dispatchAction({ type: 'unselect', seriesIndex: p.seriesIndex, dataIndex: p.dataIndex })
      } catch {}
    }
    for (const p of nextItems) {
      try {
        inst.dispatchAction({ type: 'select', seriesIndex: p.seriesIndex, dataIndex: p.dataIndex })
        inst.dispatchAction({ type: 'highlight', seriesIndex: p.seriesIndex, dataIndex: p.dataIndex })
      } catch {}
    }

    selectedItemsRef.current = nextItems
    selectedRef.current = nextItems.length ? { ...nextItems[0] } : null

    if (nextItems.length === 1) {
      startPulse(nextItems[0].seriesIndex, nextItems[0].dataIndex)
      applyLineHoverSymbols(nextItems[0].seriesIndex)
    } else {
      stopPulse()
      applyLineHoverSymbols(null)
    }

    if (nextItems.length === 0) {
      try {
        const w = elRef.current?.clientWidth ?? sizeRef.current.w
        inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current, w, legendSingleLine), { notMerge: true, lazyUpdate: true })
      } catch {}
    }
  }, [selected, selectedItems, legendSingleLine, pulseEnabled])

  useEffect(() => {
    const inst = instRef.current
    if (!inst) return
    const sel = selectedRef.current
    if (!sel) return
    if (suspended) {
      stopPulse()
      try {
        inst.dispatchAction({ type: 'downplay', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex })
        inst.dispatchAction({ type: 'unselect', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex })
      } catch {}
      return
    }
    try {
      inst.dispatchAction({ type: 'select', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex })
      inst.dispatchAction({ type: 'highlight', seriesIndex: sel.seriesIndex, dataIndex: sel.dataIndex })
    } catch {}
    startPulse(sel.seriesIndex, sel.dataIndex)
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
        const selectedNow = selectedRef.current
        if (selectedNow && (selectedNow.seriesIndex !== seriesIndex || selectedNow.dataIndex !== dataIndex)) {
          stopPulse()
          try {
            inst.dispatchAction({ type: 'downplay', seriesIndex: selectedNow.seriesIndex, dataIndex: selectedNow.dataIndex })
          } catch {}
        }

        const prevHover = hoverRef.current
        if (
          prevHover &&
          (prevHover.seriesIndex !== seriesIndex || prevHover.dataIndex !== dataIndex) &&
          (!selectedNow || prevHover.seriesIndex !== selectedNow.seriesIndex || prevHover.dataIndex !== selectedNow.dataIndex)
        ) {
          try {
            inst.dispatchAction({ type: 'downplay', seriesIndex: prevHover.seriesIndex, dataIndex: prevHover.dataIndex })
          } catch {}
        }

        try {
          inst.dispatchAction({ type: 'highlight', seriesIndex, dataIndex })
          inst.dispatchAction({ type: 'showTip', seriesIndex, dataIndex })
        } catch {}
        hoverRef.current = { seriesIndex, dataIndex }
      }

      onHover?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex, color: p?.color })
    }
    const handleOut = () => {
      onLeave?.()
      const prevHover = hoverRef.current
      hoverRef.current = null
      const selectedNow = selectedRef.current
      if (prevHover && (!selectedNow || prevHover.seriesIndex !== selectedNow.seriesIndex || prevHover.dataIndex !== selectedNow.dataIndex)) {
        try {
          inst.dispatchAction({ type: 'downplay', seriesIndex: prevHover.seriesIndex, dataIndex: prevHover.dataIndex })
        } catch {}
      }
      if (selectedNow) {
        try {
          inst.dispatchAction({ type: 'select', seriesIndex: selectedNow.seriesIndex, dataIndex: selectedNow.dataIndex })
          inst.dispatchAction({ type: 'highlight', seriesIndex: selectedNow.seriesIndex, dataIndex: selectedNow.dataIndex })
        } catch {}
        const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
        const s0 = baseSeries[selectedNow.seriesIndex]
        if (s0 && typeof s0 === 'object' && String(s0.type) === 'line') {
          applyLineHoverSymbols(selectedNow.seriesIndex)
        } else {
          applyLineHoverSymbols(null)
        }
        startPulse(selectedNow.seriesIndex, selectedNow.dataIndex)
      } else {
        applyLineHoverSymbols(null)
      }
    }
    const handleClick = (p: any) => {
      const domEv = p?.event?.event as any
      if (domEv && typeof domEv.stopPropagation === 'function') domEv.stopPropagation()

      const seriesIndex = Number(p?.seriesIndex)
      const dataIndex = Number(p?.dataIndex)
      const pixel = (() => {
        if (!Number.isFinite(seriesIndex) || !Number.isFinite(dataIndex)) return null
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

      if (Number.isFinite(seriesIndex) && Number.isFinite(dataIndex)) {
        const prevItems = selectedItemsRef.current
        const isSame = prevItems.some((x) => x.seriesIndex === seriesIndex && x.dataIndex === dataIndex)
        const nextItems = isSame ? [] : [{ seriesIndex, dataIndex }]

        for (const p0 of prevItems) {
          try {
            inst.dispatchAction({ type: 'downplay', seriesIndex: p0.seriesIndex, dataIndex: p0.dataIndex })
            inst.dispatchAction({ type: 'unselect', seriesIndex: p0.seriesIndex, dataIndex: p0.dataIndex })
          } catch {}
        }
        for (const p1 of nextItems) {
          try {
            inst.dispatchAction({ type: 'select', seriesIndex: p1.seriesIndex, dataIndex: p1.dataIndex })
            inst.dispatchAction({ type: 'highlight', seriesIndex: p1.seriesIndex, dataIndex: p1.dataIndex })
            inst.dispatchAction({ type: 'showTip', seriesIndex: p1.seriesIndex, dataIndex: p1.dataIndex })
          } catch {}
        }

        selectedItemsRef.current = nextItems
        selectedRef.current = nextItems.length ? { ...nextItems[0] } : null
        hoverRef.current = null
        if (nextItems.length) startPulse(nextItems[0].seriesIndex, nextItems[0].dataIndex)
        else stopPulse()
        onSelectedChange?.(nextItems.length ? nextItems[0] : null, clickPayload)
      }

      onClick?.(clickPayload)
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
        }
      }
    }

    inst.on('mouseover', handleOver)
    inst.on('globalout', handleOut)
    inst.on('mouseout', handleOut)
    inst.on('click', handleClick)
    inst.on('updateAxisPointer', handleAxisPointer)

    const ro = new ResizeObserver(() => {
      syncBase()
      inst.resize()
      inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
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
    const itemGap = Number(legend.itemGap ?? 24) || 24
    const padding = 84
    const avail = Math.max(0, chartW - padding)
    const itemLabelGap = 10
    const itemsWidth = names.reduce((acc: number, n: string) => acc + itemWidth + itemLabelGap + measureText(n, fontSize) + 12, 0)
    const total = itemsWidth + Math.max(0, names.length - 1) * itemGap
    if (total <= avail) return legend
    const minGap = 8
    const totalMin = itemsWidth + Math.max(0, names.length - 1) * minGap
    if (totalMin <= avail && names.length > 1) {
      const autoGap = Math.max(minGap, Math.floor((avail - itemsWidth) / (names.length - 1)))
      return { ...legend, itemGap: autoGap }
    }
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
    const walk = (v: any, inLegend: boolean) => {
      if (!v) return
      if (typeof v !== 'object') return
      if (typeof v === 'function') return
      if (seen.has(v)) return
      seen.add(v)
      if (Array.isArray(v)) {
        for (const x of v) walk(x, inLegend)
        return
      }
      for (const k of Object.keys(v)) {
        const val = v[k]
        if (k === 'fontSize' && typeof val === 'number' && Number.isFinite(val)) {
          if (!inLegend) v[k] = Math.max(9, Math.round(val * scale))
          continue
        }
        walk(val, inLegend || k === 'legend')
      }
    }
    walk(next, false)
  }

  return next as EChartsOption
}
