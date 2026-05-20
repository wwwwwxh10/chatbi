import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildRadarOption(): EChartsOption {
  return {
    ...commonTitle('雷达图 · 能力画像', '单位：分 · 指标：5 项'),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 18, 22, 0.92)',
      borderColor: 'transparent',
      borderWidth: 0,
      textStyle: { color: 'rgba(233, 236, 242, 0.92)' },
      extraCssText: 'border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); z-index: 99999;',
    },
    legend: { top: 28 },
    radar: {
      radius: '70%',
      center: ['50%', '56%'],
      nameTextStyle: { color: 'rgba(255,255,255,0.96)', fontSize: 14, fontWeight: 800 },
      axisLine: { lineStyle: { color: '#e6e6e6', width: 1.5 } },
      splitLine: { lineStyle: { color: '#e6e6e6', width: 1.5 } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] } },
      indicator: [
        { name: '稳定性', max: 100 },
        { name: '性能', max: 100 },
        { name: '体验', max: 100 },
        { name: '安全', max: 100 },
        { name: '可维护', max: 100 },
      ],
    } as any,
    series: [
      {
        name: '画像',
        type: 'radar',
        symbol: 'none',
        symbolSize: 0,
        areaStyle: { opacity: 0.18 },
        lineStyle: { width: 1.5 },
        data: [
          { value: [84, 78, 86, 80, 76], name: '当前版本' },
          { value: [70, 72, 74, 66, 68], name: '上个版本' },
        ],
      },
    ],
  }
}
