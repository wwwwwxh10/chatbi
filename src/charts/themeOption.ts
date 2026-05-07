import type { EChartsOption } from 'echarts'
import type { Theme } from '../theme/types'

export function withChartTheme(option: EChartsOption, theme: Theme): EChartsOption {
  return {
    color: theme.palette,
    textStyle: {
      color: theme.chart.axisLabel,
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    },
    title: {
      textStyle: { color: theme.ui.text0, fontWeight: 650 },
    },
    legend: {
      textStyle: { color: theme.ui.text1 },
    },
    tooltip: {
      backgroundColor: theme.chart.tooltipBg,
      borderColor: theme.ui.border0,
      textStyle: { color: theme.chart.tooltipText },
    },
    xAxis: {
      axisLabel: { color: theme.chart.axisLabel },
      axisLine: { lineStyle: { color: theme.chart.axisLine } },
      splitLine: { lineStyle: { color: theme.chart.splitLine } },
      nameTextStyle: { color: theme.ui.text1 },
    },
    yAxis: {
      axisLabel: { color: theme.chart.axisLabel },
      axisLine: { lineStyle: { color: theme.chart.axisLine } },
      splitLine: { lineStyle: { color: theme.chart.splitLine } },
      nameTextStyle: { color: theme.ui.text1 },
    },
    ...option,
  }
}

