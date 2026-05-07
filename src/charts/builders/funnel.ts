import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildFunnelOption(): EChartsOption {
  return {
    ...commonTitle('漏斗图 · 转化漏斗', '单位：人 · hover 查看流失'),
    tooltip: { trigger: 'item', formatter: '{b}: {c}人' },
    legend: { top: 28 },
    series: [
      {
        name: '转化',
        type: 'funnel',
        left: '10%',
        top: 64,
        bottom: 24,
        width: '80%',
        min: 0,
        max: 10000,
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 8,
        label: { show: true, position: 'inside' },
        itemStyle: { borderWidth: 1, borderRadius: 8 },
        data: [
          { value: 10000, name: '曝光' },
          { value: 7800, name: '点击' },
          { value: 4100, name: '加购' },
          { value: 2600, name: '下单' },
          { value: 1800, name: '支付' },
        ],
      },
    ],
  }
}

