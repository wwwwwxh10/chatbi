import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildFunnelOption(): EChartsOption {
  return {
    ...commonTitle('漏斗图 · 转化漏斗', '单位：人 · hover 查看流失'),
    tooltip: { trigger: 'item', formatter: '{b}: {c}人' },
    legend: {
      top: 28,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      itemGap: 24,
      textStyle: { fontSize: 13 },
    },
    series: [
      {
        name: '转化',
        type: 'funnel',
        left: '10%',
        top: 78,
        bottom: 78,
        width: '80%',
        min: 0,
        max: 10000,
        minSize: '20%',
        maxSize: '100%',
        sort: 'descending',
        gap: 0,
        label: { show: true, position: 'inside', fontSize: 12, fontWeight: 600 },
        labelLine: { show: false },
        itemStyle: { borderWidth: 0, borderColor: 'rgba(0,0,0,0)', borderRadius: 8 },
        emphasis: { itemStyle: { borderWidth: 0, borderColor: 'rgba(0,0,0,0)' } },
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
