import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildGaugeOption(): EChartsOption {
  return {
    ...commonTitle('仪表盘 · 系统健康度', '单位：% · 点击扇区可选中'),
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '86%',
        pointer: { width: 5, length: '60%' },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [0.7, '#ffb020'],
              [0.9, '#33d19a'],
              [1, '#6aa9ff'],
            ],
          },
        },
        axisTick: { distance: -14, length: 6 },
        splitLine: { distance: -14, length: 14, lineStyle: { width: 2 } },
        axisLabel: { distance: -22, fontSize: 11 },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          fontSize: 18,
          offsetCenter: [0, '38%'],
        },
        data: [{ value: 86, name: '健康度' }],
      },
    ],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
    },
  }
}

export function buildLiquidOption(): EChartsOption {
  return {
    ...commonTitle('水波图 · 完成率', '单位：% · hover 查看数值'),
    series: [
      {
        type: 'liquidFill' as const,
        radius: '78%',
        center: ['50%', '56%'],
        data: [0.78, 0.62, 0.48],
        amplitude: 10,
        waveLength: '70%',
        outline: {
          show: true,
          borderDistance: 2,
          itemStyle: { borderWidth: 2 },
        },
        label: {
          formatter: '78%',
          fontSize: 20,
          fontWeight: 650,
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      formatter: '完成率: {c}',
    },
  } as unknown as EChartsOption
}
