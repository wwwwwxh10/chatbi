import type { EChartsOption } from 'echarts'
import { commonTitle } from './common'

export function buildBarOption(
  kind: 'vertical' | 'horizontal' | 'grouped' | 'stacked',
): EChartsOption {
  if (kind === 'horizontal') {
    return {
      ...commonTitle('横向柱状图', 'Y：部门 · X：人数（人）'),
      grid: { left: 70, right: 18, top: 56, bottom: 28 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', name: '人数（人）' },
      yAxis: {
        type: 'category',
        name: '部门',
        data: ['研发', '销售', '运营', '市场', '客服'],
      },
      legend: { top: 28 },
      series: [{ name: '在岗', type: 'bar', barWidth: 14, data: [120, 200, 150, 80, 70] }],
    }
  }

  if (kind === 'grouped') {
    return {
      ...commonTitle('分组柱状图', 'X：班级 · Y：成绩（分）'),
      grid: { left: 44, right: 18, top: 56, bottom: 36 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 28 },
      xAxis: { type: 'category', name: '班级', data: ['一班', '二班', '三班', '四班'] },
      yAxis: { type: 'value', name: '成绩（分）' },
      series: [
        { name: '语文', type: 'bar', barWidth: 12, data: [78, 88, 81, 92] },
        { name: '数学', type: 'bar', barWidth: 12, data: [86, 79, 90, 85] },
        { name: '英语', type: 'bar', barWidth: 12, data: [82, 91, 84, 88] },
      ],
    }
  }

  if (kind === 'stacked') {
    return {
      ...commonTitle('堆积柱状图', 'X：月份 · Y：数量（个）'),
      grid: { left: 44, right: 18, top: 56, bottom: 36 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 28 },
      xAxis: { type: 'category', name: '月份', data: ['1月', '2月', '3月', '4月', '5月'] },
      yAxis: { type: 'value', name: '数量（个）' },
      series: [
        { name: '新建', type: 'bar', stack: 't', barWidth: 16, data: [120, 132, 101, 134, 90] },
        { name: '处理中', type: 'bar', stack: 't', barWidth: 16, data: [220, 182, 191, 234, 290] },
        { name: '已完成', type: 'bar', stack: 't', barWidth: 16, data: [150, 232, 201, 154, 190] },
      ],
    }
  }

  return {
    ...commonTitle('柱状图', 'X：品类 · Y：销售额（万）'),
    grid: { left: 44, right: 18, top: 56, bottom: 36 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', name: '品类', data: ['A', 'B', 'C', 'D', 'E'] },
    yAxis: { type: 'value', name: '销售额（万）' },
    legend: { top: 28 },
    series: [{ name: '销售额', type: 'bar', barWidth: 16, data: [23, 45, 36, 18, 52] }],
  }
}
