import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildRadarOption(): EChartsOption {
  return {
    ...commonTitle('雷达图 · 能力画像', '单位：分 · 指标：5 项'),
    tooltip: { trigger: 'item' },
    legend: { top: 28 },
    radar: {
      radius: '70%',
      center: ['50%', '56%'],
      indicator: [
        { name: '稳定性', max: 100 },
        { name: '性能', max: 100 },
        { name: '体验', max: 100 },
        { name: '安全', max: 100 },
        { name: '可维护', max: 100 },
      ],
    },
    series: [
      {
        name: '画像',
        type: 'radar',
        symbolSize: 6,
        areaStyle: { opacity: 0.18 },
        data: [
          { value: [84, 78, 86, 80, 76], name: '当前版本' },
          { value: [70, 72, 74, 66, 68], name: '上个版本' },
        ],
      },
    ],
  }
}

