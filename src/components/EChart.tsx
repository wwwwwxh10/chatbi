import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import type { ECElementEvent, EChartsOption } from 'echarts'
import 'echarts-liquidfill'

export type ChartHover = {
  seriesName?: string
  name?: string
  value?: unknown
}

export function EChart({
  option,
  className,
  onHover,
  onLeave,
  onClick,
}: {
  option: EChartsOption
  className?: string
  onHover?: (v: ChartHover) => void
  onLeave?: () => void
  onClick?: (v: ChartHover) => void
}) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.EChartsType | null>(null)
  const baseSizeRef = useRef<number>(13)

  const opt = useMemo(() => option, [option])

  const injectTypography = (raw: EChartsOption, baseSize: number) => {
    const mergeAxis = (axis: any) => {
      if (!axis) return axis
      const next = { ...axis }
      next.axisLabel = { ...(axis.axisLabel ?? {}), fontSize: baseSize }
      next.nameTextStyle = { ...(axis.nameTextStyle ?? {}), fontSize: baseSize }
      return next
    }

    const next: any = { ...raw }
    next.textStyle = { ...(raw as any).textStyle, fontSize: baseSize }
    if ((raw as any).title) {
      const t = (raw as any).title
      next.title = Array.isArray(t)
        ? t.map((x) => ({ ...x, textStyle: { ...(x.textStyle ?? {}), fontSize: baseSize } }))
        : { ...t, textStyle: { ...(t.textStyle ?? {}), fontSize: baseSize } }
    }
    if ((raw as any).legend) {
      const lg = (raw as any).legend
      next.legend = Array.isArray(lg)
        ? lg.map((x) => ({ ...x, textStyle: { ...(x.textStyle ?? {}), fontSize: baseSize } }))
        : { ...lg, textStyle: { ...(lg.textStyle ?? {}), fontSize: baseSize } }
    }
    if ((raw as any).tooltip) {
      const t0: any = (raw as any).tooltip
      const nextTooltip: any = { ...t0, textStyle: { ...(t0?.textStyle ?? {}), fontSize: baseSize } }
      if (nextTooltip.backgroundColor == null) nextTooltip.backgroundColor = 'rgba(16, 18, 22, 0.92)'
      if (nextTooltip.borderWidth == null) nextTooltip.borderWidth = 0
      if (nextTooltip.borderColor == null) nextTooltip.borderColor = 'transparent'
      if (!nextTooltip.textStyle?.color) nextTooltip.textStyle = { ...(nextTooltip.textStyle ?? {}), color: 'rgba(233, 236, 242, 0.92)' }
      nextTooltip.appendToBody = true
      nextTooltip.confine = false
      nextTooltip.extraCssText = `${String(nextTooltip.extraCssText ?? '')}; z-index: 99999;`
      if (!nextTooltip.position) {
        nextTooltip.position = (point: any, _params: any, _dom: any, _rect: any, size: any) => {
          const p = Array.isArray(point) ? point : [0, 0]
          const viewSize = size?.viewSize ?? [window.innerWidth, window.innerHeight]
          const contentSize = size?.contentSize ?? [0, 0]
          const pad = 12
          let x = p[0] + pad
          let y = p[1] + pad
          if (x + contentSize[0] > viewSize[0]) x = p[0] - contentSize[0] - pad
          if (y + contentSize[1] > viewSize[1]) y = p[1] - contentSize[1] - pad
          x = Math.max(0, Math.min(x, viewSize[0] - contentSize[0]))
          y = Math.max(0, Math.min(y, viewSize[1] - contentSize[1]))
          return [x, y]
        }
      }
      next.tooltip = nextTooltip
    }

    const xAxis = (raw as any).xAxis
    const yAxis = (raw as any).yAxis
    next.xAxis = Array.isArray(xAxis) ? xAxis.map(mergeAxis) : mergeAxis(xAxis)
    next.yAxis = Array.isArray(yAxis) ? yAxis.map(mergeAxis) : mergeAxis(yAxis)

    if (Array.isArray((raw as any).series)) {
      next.series = (raw as any).series.map((s: any) => ({
        ...s,
        label: s?.label ? { ...s.label, fontSize: baseSize } : s?.label,
      }))
    }

    const seen = new WeakSet<object>()
    const forceFontSize = (v: any) => {
      if (!v) return
      if (typeof v !== 'object') return
      if (typeof v === 'function') return
      if (seen.has(v)) return
      seen.add(v)
      if (Array.isArray(v)) {
        for (const x of v) forceFontSize(x)
        return
      }
      for (const k of Object.keys(v)) {
        const val = v[k]
        if (k === 'fontSize' && typeof val === 'number') {
          v[k] = baseSize
          continue
        }
        forceFontSize(val)
      }
    }
    forceFontSize(next)

    return next as EChartsOption
  }

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const syncBase = () => {
      const fs = window.getComputedStyle(el).fontSize
      const baseSize = Number.parseInt(fs || '13', 10) || 13
      if (baseSizeRef.current !== baseSize) baseSizeRef.current = baseSize
    }
    syncBase()

    const inst = echarts.init(el, undefined, { renderer: 'canvas' })
    instanceRef.current = inst

    const ro = new ResizeObserver(() => {
      syncBase()
      inst.resize()
      inst.setOption(injectTypography(opt, baseSizeRef.current), { notMerge: true, lazyUpdate: true })
    })
    ro.observe(el)

    const onMouseOver = (params: ECElementEvent) => {
      if (
        typeof params?.seriesIndex === 'number' &&
        typeof params?.dataIndex === 'number'
      ) {
        inst.dispatchAction({
          type: 'highlight',
          seriesIndex: params.seriesIndex,
          dataIndex: params.dataIndex,
        })
      }
      onHover?.({
        seriesName: params?.seriesName,
        name: params?.name,
        value: params?.value,
      })
    }

    const onMouseOut = () => {
      inst.dispatchAction({ type: 'downplay' })
      onLeave?.()
    }

    const onClickInner = (params: ECElementEvent) => {
      if (
        typeof params?.seriesIndex === 'number' &&
        typeof params?.dataIndex === 'number'
      ) {
        inst.dispatchAction({
          type: 'select',
          seriesIndex: params.seriesIndex,
          dataIndex: params.dataIndex,
        })
      }
      onClick?.({
        seriesName: params?.seriesName,
        name: params?.name,
        value: params?.value,
      })
    }

    inst.on('mouseover', onMouseOver)
    inst.on('mouseout', onMouseOut)
    inst.on('click', onClickInner)

    return () => {
      ro.disconnect()
      inst.off('mouseover', onMouseOver)
      inst.off('mouseout', onMouseOut)
      inst.off('click', onClickInner)
      inst.dispose()
      instanceRef.current = null
    }
  }, [onClick, onHover, onLeave])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    inst.setOption(injectTypography(opt, baseSizeRef.current), { notMerge: true, lazyUpdate: true })
  }, [opt])

  return <div ref={elRef} className={className ?? 'chartCanvas'} style={{ fontSize: 'var(--font-size-base)' }} />
}
