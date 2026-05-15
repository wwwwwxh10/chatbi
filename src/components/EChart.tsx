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
}

export function EChart({
  option,
  onHover,
  onLeave,
  onClick,
  style,
  className,
}: {
  option: EChartsOption
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
  style?: CSSProperties
  className?: string
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const instRef = useRef<echarts.ECharts | null>(null)
  const baseSizeRef = useRef<number>(13)
  const scaleRef = useRef<number>(1)
  const selectedRef = useRef<{ seriesIndex: number; dataIndex: number } | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const inst = echarts.init(el)
    instRef.current = inst

    const syncBase = () => {
      const w = Math.max(1, el.clientWidth)
      baseSizeRef.current = Math.max(11, Math.min(14, Math.round(w / 40)))
      const h = Math.max(1, el.clientHeight)
      scaleRef.current = Math.min(1, Math.max(0.5, Math.min(w / 420, h / 260)))
    }

    syncBase()
    inst.setOption(injectTypography(option, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })

    const handleOver = (p: any) => {
      onHover?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex })
    }
    const handleOut = () => {
      onLeave?.()
    }
    const handleClick = (p: any) => {
      const seriesIndex = Number(p?.seriesIndex)
      const dataIndex = Number(p?.dataIndex)
      if (Number.isFinite(seriesIndex) && Number.isFinite(dataIndex)) {
        const prev = selectedRef.current
        if (prev) {
          inst.dispatchAction({ type: 'downplay', seriesIndex: prev.seriesIndex, dataIndex: prev.dataIndex })
        }
        inst.dispatchAction({ type: 'highlight', seriesIndex, dataIndex })
        inst.dispatchAction({ type: 'showTip', seriesIndex, dataIndex })
        selectedRef.current = { seriesIndex, dataIndex }
      }
      onClick?.({ seriesName: p?.seriesName, name: p?.name, value: p?.value, dataIndex: p?.dataIndex, seriesIndex: p?.seriesIndex })
    }

    inst.on('mouseover', handleOver)
    inst.on('globalout', handleOut)
    inst.on('mouseout', handleOut)
    inst.on('click', handleClick)

    const ro = new ResizeObserver(() => {
      syncBase()
      inst.resize()
      inst.setOption(injectTypography(option, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
    })
    ro.observe(el)

    return () => {
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
      inst.dispose()
      instRef.current = null
    }
  }, [])

  useEffect(() => {
    const inst = instRef.current
    if (!inst) return
    inst.setOption(injectTypography(option, baseSizeRef.current, scaleRef.current), { notMerge: true, lazyUpdate: true })
  }, [option])

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
