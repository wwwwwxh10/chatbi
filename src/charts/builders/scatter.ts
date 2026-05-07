import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

type TooltipParam = {
  name?: string
  value?: unknown
}

export function buildBubbleOption(): EChartsOption {
  const points = [
    { name: 'A', value: [22, 36, 12] },
    { name: 'B', value: [35, 24, 18] },
    { name: 'C', value: [18, 42, 10] },
    { name: 'D', value: [28, 30, 16] },
    { name: 'E', value: [40, 50, 26] },
  ]
  return {
    ...commonTitle('气泡图 · 成本/收益/规模', 'X：成本 · Y：收益 · 大小：规模（万）'),
    grid: { left: 16, right: 12, top: 56, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const param = p as TooltipParam
        const v = Array.isArray(param.value) ? (param.value as unknown[]) : []
        return `${param.name ?? ''}<br/>成本：${v[0] ?? '-'}<br/>收益：${v[1] ?? '-'}<br/>规模：${v[2] ?? '-'}万`
      },
    },
    xAxis: { type: 'value', name: '成本' },
    yAxis: { type: 'value', name: '收益' },
    legend: { top: 28 },
    series: [
      {
        name: '项目',
        type: 'scatter',
        symbolSize: (val: unknown) => {
          const v = Array.isArray(val) ? val : []
          const size = Number((v as unknown[])[2])
          return Math.max(10, Math.min(42, (Number.isFinite(size) ? size : 0) * 1.4))
        },
        data: points,
      },
    ],
  }
}

export function buildScatterOption(): EChartsOption {
  const pts = [
    [1.2, 62],
    [2.1, 72],
    [3.3, 78],
    [4.0, 86],
    [5.6, 88],
    [6.2, 92],
    [7.1, 95],
    [2.8, 70],
    [3.9, 82],
    [5.1, 84],
  ]
  return {
    ...commonTitle('散点图 · 学习时长与成绩', 'X：学习时长（h） · Y：成绩（分）'),
    grid: { left: 16, right: 12, top: 56, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const param = p as TooltipParam
        const v = Array.isArray(param.value) ? (param.value as unknown[]) : []
        return `学习时长：${v[0] ?? '-'}h<br/>成绩：${v[1] ?? '-'}分`
      },
    },
    xAxis: { type: 'value', name: '学习时长（h）' },
    yAxis: { type: 'value', name: '成绩（分）' },
    legend: { top: 28 },
    series: [{ name: '样本', type: 'scatter', symbolSize: 10, data: pts }],
  }
}
