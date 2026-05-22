import type { EChartsOption } from 'echarts'
import type { WidgetKind } from './studioModel'

type InteractionMode = 'edit' | 'preview'

const LINE_KINDS = new Set<WidgetKind>(['line', 'line-area', 'line-curve'])
const POINT_KINDS = new Set<WidgetKind>(['line', 'line-area', 'line-curve', 'bubble', 'scatter'])
const BLOCK_KINDS = new Set<WidgetKind>([
  'bar',
  'bar-h',
  'bar-grouped',
  'bar-stacked',
  'bar-gradient',
  'pie',
  'donut',
  'rose',
  'funnel',
  'sankey',
])
const AXIS_KINDS = new Set<WidgetKind>(['line', 'line-area', 'line-curve', 'bar', 'bar-h', 'bar-grouped', 'bar-stacked', 'bar-gradient'])

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asColorString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function resolveSeriesSelectionColor(series: any, index: number, palette: unknown[], accent: string) {
  const paletteColor = asColorString(palette[index]) ?? asColorString(palette[0])
  const lineColor = asColorString(series?.lineStyle?.color)
  const itemColor = asColorString(series?.itemStyle?.color)
  const borderColor = asColorString(series?.itemStyle?.borderColor)
  const data = Array.isArray(series?.data) ? series.data : []
  const firstDataItem = data.find((entry: any) => entry && typeof entry === 'object')
  const dataItemColor = asColorString(firstDataItem?.itemStyle?.color)
  const dataBorderColor = asColorString(firstDataItem?.itemStyle?.borderColor)
  const isLineSeries = String(series?.type) === 'line'

  if (isLineSeries) {
    return lineColor ?? itemColor ?? dataItemColor ?? paletteColor ?? dataBorderColor ?? borderColor ?? accent
  }

  return dataItemColor ?? itemColor ?? dataBorderColor ?? borderColor ?? lineColor ?? paletteColor ?? accent
}

export function isGroupBarKind(kind: WidgetKind | null | undefined): kind is 'bar-grouped' | 'bar-stacked' {
  return kind === 'bar-grouped' || kind === 'bar-stacked'
}

export function enhanceDashboardChartOption(
  kind: WidgetKind,
  opt: EChartsOption,
  {
    accent,
    mode,
  }: {
    accent: string
    mode: InteractionMode
  },
): EChartsOption {
  const next: any = { ...(opt as any) }
  const list = next.series
  if (!Array.isArray(list)) return next as EChartsOption

  const isAxis = AXIS_KINDS.has(kind)
  const isPreview = mode === 'preview'
  const palette = Array.isArray(next.color) ? next.color : []

  next.tooltip = {
    ...(next.tooltip ?? {}),
    ...(isPreview
      ? {
          show: true,
          trigger: isAxis ? 'axis' : 'item',
          triggerOn: 'mousemove',
          enterable: true,
          confine: true,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          borderWidth: 0,
          padding: [10, 12],
          extraCssText: 'border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.38);backdrop-filter:blur(10px);',
          textStyle: { color: 'rgba(233,236,242,0.94)', fontWeight: 600 },
        }
      : null),
    axisPointer: isAxis
      ? {
          type: 'shadow',
          shadowStyle: { color: 'rgba(0, 0, 0, 0.22)' },
        }
      : undefined,
  }

  next.series = list.map((seriesLike: any, index: number) => {
    const series: any = { ...seriesLike }
    if (series.id == null) series.id = `__dashboard_series_${index}`

    const isLineSeries = String(series.type) === 'line'
    const isLineKind = LINE_KINDS.has(kind) && isLineSeries
    const isPointKind = POINT_KINDS.has(kind) && !isLineKind
    const rawSymbolSize = series.symbolSize
    const hasDynamicSymbolSize = typeof rawSymbolSize === 'function'
    const baseSymbolSize = toFiniteNumber(rawSymbolSize) ?? (isLineKind ? 8 : isPointKind && !hasDynamicSymbolSize ? 8 : null)
    const seriesSelectionColor = resolveSeriesSelectionColor(series, index, palette, accent)
    const shadowColor = typeof seriesSelectionColor === 'string' && seriesSelectionColor.startsWith('#') ? `${seriesSelectionColor}F0` : String(seriesSelectionColor)

    if (isLineKind) {
      series.showSymbol = false
      series.symbol = 'circle'
      series.symbolSize = baseSymbolSize ?? 8
      series.itemStyle = {
        ...(series.itemStyle ?? {}),
        borderWidth: Math.max(2, toFiniteNumber(series.itemStyle?.borderWidth) ?? 0),
        borderColor: series.itemStyle?.borderColor ?? '#fff',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      }
    }

    if (isPointKind) {
      if (!series.symbol || series.symbol === 'none') series.symbol = 'circle'
      if (!hasDynamicSymbolSize && baseSymbolSize != null) series.symbolSize = baseSymbolSize
      series.itemStyle = {
        ...(series.itemStyle ?? {}),
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      }
    }

    if (!isPreview) return series

    const emphasis: any = { ...(series.emphasis ?? {}) }
    const emphasisItemStyle: any = { ...((emphasis.itemStyle ?? {}) as any) }
    emphasisItemStyle.shadowBlur = Math.max(isLineKind ? 84 : 72, toFiniteNumber(emphasisItemStyle.shadowBlur) ?? 0)
    emphasisItemStyle.shadowColor = emphasisItemStyle.shadowColor ?? shadowColor
    emphasisItemStyle.shadowOffsetX = emphasisItemStyle.shadowOffsetX ?? 0
    emphasisItemStyle.shadowOffsetY = emphasisItemStyle.shadowOffsetY ?? 0
    emphasisItemStyle.opacity = emphasisItemStyle.opacity ?? 1
    if (isLineKind) {
      emphasisItemStyle.borderWidth = series.itemStyle?.borderWidth ?? emphasisItemStyle.borderWidth
      emphasisItemStyle.borderColor = series.itemStyle?.borderColor ?? emphasisItemStyle.borderColor
    }
    emphasis.itemStyle = emphasisItemStyle
    emphasis.scale = true
    emphasis.scaleSize = isLineKind ? 22 : POINT_KINDS.has(kind) ? 20 : BLOCK_KINDS.has(kind) ? 18 : 18
    emphasis.focus = series.type === 'sankey' ? 'none' : 'self'
    emphasis.blurScope = emphasis.focus === 'self' ? 'global' : undefined
    if (!hasDynamicSymbolSize && baseSymbolSize != null) emphasis.symbolSize = Math.max(baseSymbolSize + (isLineKind ? 12 : 18), baseSymbolSize)
    series.emphasis = emphasis

    const blur: any = { ...(series.blur ?? {}) }
    blur.itemStyle = {
      ...((blur.itemStyle ?? {}) as any),
      opacity: isLineKind ? 0.14 : 0.1,
    }
    if (isLineSeries) {
      blur.lineStyle = {
        ...((blur.lineStyle ?? {}) as any),
        opacity: 0.12,
      }
      if (series.areaStyle) {
        blur.areaStyle = {
          ...((blur.areaStyle ?? {}) as any),
          opacity: 0.04,
        }
      }
    }
    series.blur = blur

    const select: any = { ...(series.select ?? {}) }
    const selectItemStyle: any = { ...emphasisItemStyle, ...((select.itemStyle ?? {}) as any) }
    selectItemStyle.shadowBlur = Math.max(isLineKind ? 72 : 56, toFiniteNumber(selectItemStyle.shadowBlur) ?? 0)
    selectItemStyle.shadowColor = selectItemStyle.shadowColor ?? shadowColor
    selectItemStyle.shadowOffsetX = selectItemStyle.shadowOffsetX ?? 0
    selectItemStyle.shadowOffsetY = selectItemStyle.shadowOffsetY ?? 0
    if (isLineKind) {
      selectItemStyle.borderWidth = series.itemStyle?.borderWidth ?? selectItemStyle.borderWidth
      selectItemStyle.borderColor = series.itemStyle?.borderColor ?? selectItemStyle.borderColor
    }
    select.itemStyle = selectItemStyle
    select.scale = true
    select.scaleSize = isLineKind ? 18 : POINT_KINDS.has(kind) ? 18 : BLOCK_KINDS.has(kind) ? 14 : 14
    select.focus = series.type === 'sankey' ? 'none' : 'self'
    select.blurScope = select.focus === 'self' ? 'global' : undefined
    if (!hasDynamicSymbolSize && baseSymbolSize != null) select.symbolSize = Math.max(baseSymbolSize + (isLineKind ? 14 : 20), baseSymbolSize)
    series.select = select
    series.selectedMode = series.selectedMode ?? 'single'

    if (BLOCK_KINDS.has(kind) && series.type === 'funnel') {
      series.emphasis = {
        ...series.emphasis,
        itemStyle: {
          ...(series.emphasis?.itemStyle ?? {}),
          shadowBlur: Math.max(96, toFiniteNumber(series.emphasis?.itemStyle?.shadowBlur) ?? 0),
          shadowColor: series.emphasis?.itemStyle?.shadowColor ?? shadowColor,
          opacity: 1,
        },
        scale: true,
        scaleSize: Math.max(series.emphasis?.scaleSize ?? 0, 18),
        focus: 'self',
        blurScope: 'global',
      }
      series.select = {
        ...series.select,
        itemStyle: {
          ...(series.select?.itemStyle ?? {}),
          shadowBlur: Math.max(72, toFiniteNumber(series.select?.itemStyle?.shadowBlur) ?? 0),
          shadowColor: series.select?.itemStyle?.shadowColor ?? shadowColor,
          opacity: 1,
        },
        scale: true,
        scaleSize: Math.max(series.select?.scaleSize ?? 0, 14),
      }
    }

    return series
  })

  return next as EChartsOption
}
