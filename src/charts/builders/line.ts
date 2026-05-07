import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildLineOption({
  smooth,
  multi,
}: {
  smooth: boolean
  multi: boolean
}): EChartsOption {
  const x = ['1月', '2月', '3月', '4月', '5月', '6月']
  const a = [120, 200, 150, 260, 320, 280]
  const b = [90, 160, 130, 210, 300, 340]
  const c = [60, 140, 180, 160, 240, 260]

  const series = multi
    ? [
        { name: '北区', type: 'line' as const, smooth, symbolSize: 8, data: a },
        { name: '南区', type: 'line' as const, smooth, symbolSize: 8, data: b },
        { name: '西区', type: 'line' as const, smooth, symbolSize: 8, data: c },
      ]
    : [{ name: '订单量', type: 'line' as const, smooth, symbolSize: 8, data: a }]

  return {
    ...commonTitle(smooth ? '曲线趋势' : '折线趋势', 'X：月份 · Y：数量（单）'),
    grid: { left: 16, right: 12, top: 56, bottom: 40, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: multi ? { top: 28 } : undefined,
    xAxis: { type: 'category', name: '月份', boundaryGap: false, data: x },
    yAxis: { type: 'value', name: '数量（单）' },
    series,
  }
}

export function buildAreaOption({ stacked }: { stacked: boolean }): EChartsOption {
  const x = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const a = [120, 132, 101, 134, 90, 230, 210]
  const b = [220, 182, 191, 234, 290, 330, 310]
  const c = [150, 232, 201, 154, 190, 330, 410]
  return {
    ...commonTitle(stacked ? '堆积面积图' : '面积图', 'X：星期 · Y：用量（GB）'),
    grid: { left: 16, right: 12, top: 56, bottom: 40, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: stacked ? { top: 28 } : undefined,
    xAxis: { type: 'category', name: '星期', boundaryGap: false, data: x },
    yAxis: { type: 'value', name: '用量（GB）' },
    series: stacked
      ? [
          { name: '视频', type: 'line' as const, stack: 't', areaStyle: {}, symbolSize: 7, data: a },
          { name: '图片', type: 'line' as const, stack: 't', areaStyle: {}, symbolSize: 7, data: b },
          { name: '其他', type: 'line' as const, stack: 't', areaStyle: {}, symbolSize: 7, data: c },
        ]
      : [{ name: '用量', type: 'line' as const, areaStyle: {}, symbolSize: 7, data: c }],
  }
}
