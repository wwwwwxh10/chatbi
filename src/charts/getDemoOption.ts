import type { EChartsOption } from 'echarts'
import type { DemoId } from './types'
import type { Theme } from '../theme/types'
import { withChartTheme } from './themeOption'
import { buildGaugeOption, buildLiquidOption } from './builders/metric'
import { buildLineOption, buildAreaOption } from './builders/line'
import { buildBarOption } from './builders/bar'
import { buildPieOption } from './builders/pie'
import { buildRadarOption } from './builders/radar'
import { buildBubbleOption, buildScatterOption } from './builders/scatter'
import { buildFunnelOption } from './builders/funnel'
import { buildSankeyOption } from './builders/sankey'

function addInteractiveStates(option: EChartsOption): EChartsOption {
  const series = (option as { series?: unknown }).series
  if (!Array.isArray(series)) return option

  const nextSeries = series.map((s) => {
    if (!s || typeof s !== 'object') return s
    const obj = s as Record<string, unknown>
    return {
      ...obj,
      selectedMode: obj.selectedMode ?? 'single',
      emphasis: obj.emphasis ?? { focus: 'series' },
      select: obj.select ?? { itemStyle: { borderWidth: 2 } },
    }
  })

  return { ...option, series: nextSeries } as EChartsOption
}

export function getDemoOption(demoId: DemoId, theme: Theme): EChartsOption {
  let option: EChartsOption

  switch (demoId) {
    case 'metric-gauge':
      option = buildGaugeOption()
      break
    case 'metric-liquid':
      option = buildLiquidOption()
      break
    case 'line-basic':
      option = buildLineOption({ smooth: false, multi: false })
      break
    case 'line-smooth':
      option = buildLineOption({ smooth: true, multi: false })
      break
    case 'line-multi':
      option = buildLineOption({ smooth: false, multi: true })
      break
    case 'line-multi-smooth':
      option = buildLineOption({ smooth: true, multi: true })
      break
    case 'line-area':
      option = buildAreaOption({ stacked: false })
      break
    case 'line-area-stack':
      option = buildAreaOption({ stacked: true })
      break
    case 'bar-vertical':
      option = buildBarOption('vertical')
      break
    case 'bar-horizontal':
      option = buildBarOption('horizontal')
      break
    case 'bar-grouped':
      option = buildBarOption('grouped')
      break
    case 'bar-stacked':
      option = buildBarOption('stacked')
      break
    case 'pie-basic':
      option = buildPieOption('pie')
      break
    case 'pie-donut':
      option = buildPieOption('donut')
      break
    case 'pie-rose':
      option = buildPieOption('rose')
      break
    case 'radar-basic':
      option = buildRadarOption()
      break
    case 'bubble-basic':
      option = buildBubbleOption()
      break
    case 'scatter-basic':
      option = buildScatterOption()
      break
    case 'funnel-basic':
      option = buildFunnelOption()
      break
    case 'sankey-basic':
      option = buildSankeyOption()
      break
    default:
      option = {
        title: { text: '未找到图表配置', left: 'center', top: 'middle' },
      }
  }

  return withChartTheme(addInteractiveStates(option), theme)
}
