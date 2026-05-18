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
  onSelectedChange,
  style,
  className,
}: {
  option: EChartsOption
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
  selected?: { seriesIndex: number; dataIndex: number } | null
  onSelectedChange?: (next: { seriesIndex: number; dataIndex: number } | null, v: ChartHover) => void
  style?: CSSProperties
  className?: string
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const instRef = useRef<echarts.ECharts | null>(null)
  const optionRef = useRef<EChartsOption>(option)
  const baseSizeRef = useRef<number>(13)
  const scaleRef = useRef<number>(1)
  const selectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)
  const pulseRef = useRef<{ timer: number | null; on: boolean }>({ timer: null, on: false })

  useEffect(() => {
    optionRef.current = option
    const inst = instRef.current
    if (!inst) return
    inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
  }, [option])

  useEffect(() => {
    if (selected === undefined) return
    const inst = instRef.current
    if (!inst) return
    const prev = selectedRef.current
    const next = selected
    const same =
      Boolean(prev) &&
      Boolean(next) &&
      Number(prev?.seriesIndex) === Number(next?.seriesIndex) &&
      Number(prev?.dataIndex) === Number(next?.dataIndex)
    if (same) return
    if (prev) {
      try {
        inst.dispatchAction({ type: 'downplay', seriesIndex: prev.seriesIndex, dataIndex: prev.dataIndex })
        inst.dispatchAction({ type: 'unselect', seriesIndex: prev.seriesIndex, dataIndex: prev.dataIndex })
        inst.dispatchAction({ type: 'hideTip' })
      } catch {
        // ignore
      }
    }
    if (next) {
      try {
        inst.dispatchAction({ type: 'select', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
        inst.dispatchAction({ type: 'highlight', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
        inst.dispatchAction({ type: 'showTip', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
      } catch {
        // ignore
      }
    }
    selectedRef.current = next

    if (pulseRef.current.timer) {
      window.clearInterval(pulseRef.current.timer)
      pulseRef.current.timer = null
    }
    pulseRef.current.on = false

    if (next) {
      const seriesIndex = next.seriesIndex
      const dataIndex = next.dataIndex
      const baseSeries = Array.isArray((optionRef.current as any)?.series) ? ((optionRef.current as any).series as any[]) : []
      const base = baseSeries[seriesIndex] ?? null
      const seriesId = base && typeof base === 'object' ? base.id : null
      const baseSelect = base?.select
      const baseEmphasis = base?.emphasis
      const baseBlur = Number(baseSelect?.itemStyle?.shadowBlur ?? baseEmphasis?.itemStyle?.shadowBlur ?? 120) || 120
      const baseScaleSize = Number(baseSelect?.scaleSize ?? baseEmphasis?.scaleSize ?? 36) || 36

      pulseRef.current.timer = window.setInterval(() => {
        const current = instRef.current
        if (!current) return
        if (typeof (current as any).isDisposed === 'function' && (current as any).isDisposed()) return
        const on = !pulseRef.current.on
        pulseRef.current.on = on
        const blur = Math.max(18, Math.round(baseBlur * (on ? 1.25 : 0.85)))
        const scaleSize = Math.max(6, Math.round(baseScaleSize + (on ? 6 : -4)))
        try {
          if (seriesId) {
            current.setOption(
              {
                series: [
                  {
                    id: seriesId,
                    select: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                    emphasis: { scale: true, scaleSize, itemStyle: { shadowBlur: blur } },
                  },
                ],
              },
              { notMerge: false, lazyUpdate: true },
            )
          }
          current.dispatchAction({ type: 'select', seriesIndex, dataIndex })
          current.dispatchAction({ type: 'highlight', seriesIndex, dataIndex })
        } catch {
          // ignore
        }
      }, 420)
    }
  }, [selected])

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
      inst.setOption(injectTypography(optionRef.current, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
      tries += 1
      if (tries < 12 && (changed || tries < 4)) raf = requestAnimationFrame(applyUntilStable)
    }
    raf = requestAnimationFrame(applyUntilStable)

    const handleOver = (p: any) => {
      onHover?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex, color: p?.color })
    }
    const handleOut = () => {
      onLeave?.()
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
        const prev = selectedRef.current
        const isSame = Boolean(prev) && prev?.seriesIndex === seriesIndex && prev?.dataIndex === dataIndex
        const next = isSame ? null : { seriesIndex, dataIndex }

        if (prev) {
          try {
            inst.dispatchAction({ type: 'downplay', seriesIndex: prev.seriesIndex, dataIndex: prev.dataIndex })
            inst.dispatchAction({ type: 'unselect', seriesIndex: prev.seriesIndex, dataIndex: prev.dataIndex })
            inst.dispatchAction({ type: 'hideTip' })
          } catch {
            // ignore
          }
        }
        if (next) {
          try {
            inst.dispatchAction({ type: 'select', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
            inst.dispatchAction({ type: 'highlight', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
            inst.dispatchAction({ type: 'showTip', seriesIndex: next.seriesIndex, dataIndex: next.dataIndex })
          } catch {
            // ignore
          }
        }
        selectedRef.current = next
        onSelectedChange?.(next, clickPayload)
      }

      onClick?.(clickPayload)
    }

    inst.on('mouseover', handleOver)
    inst.on('globalout', handleOut)
    inst.on('mouseout', handleOut)
    inst.on('click', handleClick)

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
      } catch {
        // ignore
      }
      try {
        inst.off('mouseover', handleOver)
        inst.off('globalout', handleOut)
        inst.off('mouseout', handleOut)
        inst.off('click', handleClick)
      } catch {
        // ignore
      }
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

function injectTypography(raw: EChartsOption, baseSize: number, scale: number) {
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
    next.legend = Array.isArray(lg)
      ? lg.map((x) => {
          const textStyle = { ...(x.textStyle ?? {}) }
          if (textStyle.fontSize == null) textStyle.fontSize = baseSize
          return { ...x, textStyle }
        })
      : (() => {
          const textStyle = { ...((lg as any).textStyle ?? {}) }
          if (textStyle.fontSize == null) textStyle.fontSize = baseSize
          return { ...(lg as any), textStyle }
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
    const walk = (v: any) => {
      if (!v) return
      if (typeof v !== 'object') return
      if (typeof v === 'function') return
      if (seen.has(v)) return
      seen.add(v)
      if (Array.isArray(v)) {
        for (const x of v) walk(x)
        return
      }
      for (const k of Object.keys(v)) {
        const val = v[k]
        if (k === 'fontSize' && typeof val === 'number' && Number.isFinite(val)) {
          v[k] = Math.max(9, Math.round(val * scale))
          continue
        }
        walk(val)
      }
    }
    walk(next)
  }

  return next as EChartsOption
}
