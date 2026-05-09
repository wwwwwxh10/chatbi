import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildPieOption(kind: 'pie' | 'donut' | 'rose'): EChartsOption {
  const data = [
    { value: 1048, name: '华东' },
    { value: 735, name: '华南' },
    { value: 580, name: '华北' },
    { value: 484, name: '西南' },
    { value: 300, name: '东北' },
  ]

  if (kind === 'rose') {
    return {
      ...commonTitle('玫瑰图', '维度：区域 · 单位：次'),
      tooltip: { trigger: 'item' },
      legend: { top: 28 },
      series: [
        {
          name: '区域',
          type: 'pie',
          radius: ['18%', '78%'],
          center: ['50%', '56%'],
          roseType: 'radius',
          itemStyle: { borderRadius: 6, borderWidth: 0 },
          label: { color: 'inherit' },
          data,
        },
      ],
    }
  }

  return {
    ...commonTitle(kind === 'donut' ? '环形图' : '饼图', '维度：区域 · 单位：%'),
    tooltip: { trigger: 'item' },
    legend: { top: 28 },
    series: [
      {
        name: '区域占比',
        type: 'pie',
        radius: kind === 'donut' ? ['42%', '78%'] : '78%',
        center: ['50%', '56%'],
        itemStyle: { borderRadius: 6, borderWidth: 0 },
        label: { formatter: '{b}\n{d}%' },
        emphasis: { scale: true, scaleSize: 10 },
        data,
      },
    ],
  }
}
