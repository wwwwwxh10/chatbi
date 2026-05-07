import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildSankeyOption(): EChartsOption {
  return {
    ...commonTitle('桑基图 · 数据流向', '单位：GB · 点击节点可选中'),
    tooltip: { trigger: 'item', formatter: '{b}' },
    series: [
      {
        type: 'sankey',
        left: 12,
        right: 12,
        top: 56,
        bottom: 20,
        emphasis: { focus: 'adjacency' },
        data: [
          { name: '采集' },
          { name: '清洗' },
          { name: '明细层' },
          { name: '汇总层' },
          { name: '报表' },
          { name: '模型服务' },
        ],
        links: [
          { source: '采集', target: '清洗', value: 18 },
          { source: '清洗', target: '明细层', value: 14 },
          { source: '明细层', target: '汇总层', value: 9 },
          { source: '明细层', target: '模型服务', value: 5 },
          { source: '汇总层', target: '报表', value: 7 },
          { source: '汇总层', target: '模型服务', value: 2 },
        ],
        lineStyle: { opacity: 0.38, curveness: 0.5 },
        nodeGap: 10,
      },
    ],
  }
}

