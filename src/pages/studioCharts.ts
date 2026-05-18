import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const UI_TEXT = 'rgba(245, 248, 255, 0.92)'
const UI_MUTED = 'rgba(189, 203, 227, 0.65)'

function curLocale() {
  if (typeof document === 'undefined') return 'zh-CN'
  const lang = String(document.documentElement?.lang || '')
  return lang === 'en-US' ? 'en-US' : 'zh-CN'
}

function isEn() {
  return curLocale() === 'en-US'
}

function hexToRgb(hex: string) {
  const cleaned = (hex || '').replace('#', '').trim()
  if (cleaned.length !== 6) return null
  const r = Number.parseInt(cleaned.slice(0, 2), 16)
  const g = Number.parseInt(cleaned.slice(2, 4), 16)
  const b = Number.parseInt(cleaned.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return { r, g, b }
}

function withAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function baseOption(themeColors: string[], { showLegend, unit, tooltipTrigger }: { showLegend?: boolean; unit?: string; tooltipTrigger?: 'axis' | 'item' } = {}) {
  void unit
  const primary = themeColors[0] ?? '#6AA6FF'
  return {
    backgroundColor: 'transparent',
    color: themeColors,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    textStyle: { color: UI_TEXT, fontFamily: 'PingFang SC' },
    tooltip: {
      trigger: tooltipTrigger || 'axis',
      backgroundColor: 'rgba(8, 12, 22, 0.92)',
      borderColor: withAlpha(primary, 0.5),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 8px;',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: withAlpha(primary, 0.14) },
      },
    },
    legend: {
      show: Boolean(showLegend),
      bottom: 8,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      textStyle: { color: UI_MUTED, fontSize: 13 },
      itemGap: 24,
      inactiveColor: 'rgba(255,255,255,0.2)',
      itemStyle: { borderWidth: 0 },
    },
    grid: { left: 30, right: 30, top: 36, bottom: showLegend ? 40 : 18, containLabel: true },
    xAxis: {
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisTick: { show: false },
      axisLabel: { color: UI_MUTED, fontSize: 12, margin: 4 },
      splitLine: { show: false },
    },
    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: UI_MUTED, fontSize: 12, margin: 4 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
      name: '',
      nameTextStyle: { color: UI_MUTED, padding: [0, 0, 10, 0] },
    },
  } as any
}

function axisTooltipFormatter(unit: string) {
  return (params: any) => {
    if (!Array.isArray(params) || params.length === 0) return ''
    const header = params[0]?.axisValueLabel || params[0]?.name || ''
    const lines = params
      .map((p: any) => {
        const marker = p?.marker || ''
        const name = p?.seriesName || p?.name || ''
        const v = p?.value
        const value = Array.isArray(v) ? v.map((x) => `${x}${unit}`).join(', ') : `${v}${unit}`
        return `${marker}${name}${isEn() ? ': ' : '：'}${value}`
      })
      .join('<br/>')
    return `${header}<br/>${lines}`
  }
}

function itemTooltipFormatter(unit: string) {
  return (p: any) => {
    const name = p?.name || p?.seriesName || ''
    const v = p?.value
    const value = Array.isArray(v) ? v.map((x) => `${x}${unit}`).join(', ') : `${v}${unit}`
    return `${name}<br/>${value}`
  }
}

function days() {
  return isEn() ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
}

function products() {
  return isEn() ? ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'] : ['产品A', '产品B', '产品C', '产品D', '产品E']
}

function sources() {
  return isEn() ? ['Organic', 'Ads', 'Campaign', 'Channel', 'Other'] : ['自然', '投放', '活动', '渠道', '其他']
}

function regions() {
  return isEn() ? ['East', 'South', 'North', 'Southwest', 'Northeast'] : ['华东', '华南', '华北', '西南', '东北']
}

export function buildBarOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  const cats = products()
  const vals = [18.4, 15.2, 12.6, 10.8, 9.7]
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: cats },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        name: title || (isEn() ? 'Sales' : '销量'),
        type: 'bar',
        data: vals,
        barWidth: 20,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors[0] },
            { offset: 1, color: withAlpha(themeColors[0], 0.1) },
          ]),
        },
      },
    ],
  }
}

export function buildHBarOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  const values = [26.1, 22.8, 19.6, 16.4, 14.2]
  const data = regions()
    .map((name, i) => ({ name, value: values[i] ?? 0 }))
    .sort((a, b) => b.value - a.value)
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: {
      ...(common as any).xAxis,
      type: 'value',
      name: '',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    yAxis: {
      ...(common as any).yAxis,
      type: 'category',
      name: '',
      inverse: true,
      data: data.map((it) => it.name),
    },
    series: [
      {
        name: title || (isEn() ? 'Ranking' : '排行'),
        type: 'bar',
        data: data.map((it) => it.value),
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 10, 10, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: themeColors[0] },
            { offset: 1, color: withAlpha(themeColors[0], 0.2) },
          ]),
        },
      },
    ],
  }
}

export function buildStackedBarOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const cats = sources()
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: cats },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    barCategoryGap: '28%',
    series: [
      { name: isEn() ? 'Voice' : '语音', type: 'bar', stack: 'total', data: [6.2, 5.4, 3.2, 2.8, 4.1], barMaxWidth: 56, barMinWidth: 22, itemStyle: { borderRadius: 0 } },
      { name: isEn() ? 'Data' : '流量', type: 'bar', stack: 'total', data: [7.4, 6.8, 4.1, 3.6, 5.2], barMaxWidth: 56, barMinWidth: 22 },
      {
        name: isEn() ? 'Broadband' : '宽带',
        type: 'bar',
        stack: 'total',
        data: [2.8, 2.6, 1.9, 1.4, 2.1],
        barMaxWidth: 56,
        barMinWidth: 22,
        itemStyle: { borderRadius: 0 },
      },
    ],
  }
}

export function buildGroupedBarOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const cats = sources()
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: cats },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    barCategoryGap: '30%',
    barGap: '20%',
    series: [
      {
        name: isEn() ? 'Target' : '目标',
        type: 'bar',
        data: [18.0, 16.2, 10.8, 9.6, 12.4],
        barMaxWidth: 40,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors[0] },
            { offset: 1, color: withAlpha(themeColors[0], 0.2) },
          ]),
        },
      },
      {
        name: isEn() ? 'Actual' : '实际',
        type: 'bar',
        data: [16.4, 14.7, 9.2, 10.8, 13.6],
        barMaxWidth: 40,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors[1] ?? themeColors[0] },
            { offset: 1, color: withAlpha(themeColors[1] ?? themeColors[0], 0.2) },
          ]),
        },
      },
    ],
  }
}

export function buildGradientBarOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const cats = ['A', 'B', 'C', 'D', 'E']
  const vals = [42, 58, 35, 66, 49]
  const primary = themeColors[0] ?? '#6AA6FF'
  const common = baseOption(themeColors, { unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: cats },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        type: 'bar',
        data: vals,
        barWidth: 18,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: primary },
              { offset: 1, color: withAlpha(primary, 0.35) },
            ],
          },
        },
      },
    ],
  }
}

export function buildLineOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const x = days()
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: x },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        name: isEn() ? 'Primary' : '主系列',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        data: [18.2, 20.1, 19.4, 21.6, 24.0, 26.8, 25.2],
        lineStyle: { width: 4, shadowBlur: 14, shadowColor: withAlpha(themeColors[0], 0.35) },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series' },
      },
      {
        name: isEn() ? 'Benchmark' : '对比系列',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        data: [12.4, 13.8, 14.2, 15.6, 16.2, 18.4, 17.5],
        lineStyle: { width: 4, shadowBlur: 14, shadowColor: withAlpha(themeColors[1] ?? themeColors[0], 0.35) },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series' },
      },
    ],
  }
}

export function buildAreaOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const x = days()
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: x },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        name: isEn() ? 'Primary' : '主系列',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: [32.1, 34.0, 33.6, 35.2, 36.8, 39.6, 38.4],
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.35,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withAlpha(themeColors[0], 0.55) },
            { offset: 1, color: withAlpha(themeColors[0], 0.05) },
          ]),
        },
      },
      {
        name: isEn() ? 'Benchmark' : '对比系列',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: [22.1, 23.8, 24.2, 25.6, 26.2, 28.4, 27.5],
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.25,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withAlpha(themeColors[1] ?? themeColors[0], 0.45) },
            { offset: 1, color: withAlpha(themeColors[1] ?? themeColors[0], 0.05) },
          ]),
        },
      },
    ],
  }
}

export function buildCurveOption(title: string, themeColors: string[], unit = ''): EChartsOption {
  void title
  const x = days()
  const common = baseOption(themeColors, { showLegend: true, unit, tooltipTrigger: 'axis' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: axisTooltipFormatter(unit) },
    xAxis: { ...(common as any).xAxis, type: 'category', data: x },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        name: isEn() ? 'Primary' : '主系列',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [62.4, 70.1, 68.8, 75.6, 80.2, 92.3, 88.9],
        lineStyle: { width: 4, shadowBlur: 16, shadowColor: withAlpha(themeColors[0], 0.35) },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series' },
      },
      {
        name: isEn() ? 'Benchmark' : '对比系列',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [42.1, 48.4, 45.6, 52.8, 58.4, 64.2, 60.1],
        lineStyle: { width: 4, shadowBlur: 16, shadowColor: withAlpha(themeColors[1] ?? themeColors[0], 0.35) },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series' },
      },
    ],
  }
}

export function buildScatterOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const common = baseOption(themeColors, { showLegend: true, unit: '', tooltipTrigger: 'item' })
  return {
    ...common,
    tooltip: { ...(common as any).tooltip, formatter: itemTooltipFormatter('') },
    xAxis: { ...(common as any).xAxis, type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    yAxis: { ...(common as any).yAxis, type: 'value' },
    series: [
      {
        name: title || (isEn() ? 'Distribution' : '分布'),
        type: 'scatter',
        itemStyle: { opacity: 0.8 },
        emphasis: { focus: 'series' },
        data: [
          [10, 20],
          [15, 35],
          [25, 45],
          [30, 28],
          [40, 60],
          [50, 42],
        ],
      },
    ],
  }
}

export function buildBubbleOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const common = baseOption(themeColors, { showLegend: true, unit: '', tooltipTrigger: 'item' })
  return {
    ...common,
    tooltip: {
      ...(common as any).tooltip,
      formatter: (p: any) => {
        const v = p?.value || []
        return isEn()
          ? `Category: ${p?.seriesName || ''}<br/>Cost: ${v[0]}<br/>Revenue: ${v[1]}<br/>Size: ${v[2]}`
          : `分类：${p?.seriesName || ''}<br/>成本：${v[0]}<br/>收益：${v[1]}<br/>规模：${v[2]}`
      },
    },
    xAxis: { ...(common as any).xAxis, type: 'value', name: isEn() ? 'Cost' : '成本', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    yAxis: { ...(common as any).yAxis, type: 'value', name: isEn() ? 'Revenue' : '收益' },
    series: [
      {
        name: title || (isEn() ? 'Core' : '核心业务'),
        type: 'scatter',
        symbolSize: (d: any) => d?.[2],
        itemStyle: {
          opacity: 0.8,
          color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
            { offset: 0, color: withAlpha(themeColors[0], 0.9) },
            { offset: 1, color: withAlpha(themeColors[0], 0.4) },
          ]),
          borderColor: themeColors[0],
          borderWidth: 1,
        },
        emphasis: { focus: 'series' },
        data: [
          [10, 20, 30],
          [15, 35, 50],
          [25, 45, 40],
          [30, 28, 25],
          [40, 60, 65],
        ],
      },
    ],
  }
}

export function buildPieOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const s = sources()
  const data = [
    { name: s[0], value: 42 },
    { name: s[1], value: 28 },
    { name: s[2], value: 18 },
    { name: s[4] ?? (isEn() ? 'Other' : '其他'), value: 12 },
  ]
  const total = data.reduce((a, b) => a + b.value, 0)
  const common = baseOption(themeColors, { showLegend: true, unit: '', tooltipTrigger: 'item' })
  return {
    ...common,
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.92)',
      borderColor: withAlpha(themeColors[0], 0.5),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(12px);',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      formatter: (p: any) =>
        isEn()
          ? `${p.name}<br/>Value: ${p.value}<br/>Share: ${p.percent}%`
          : `${p.name}<br/>值：${p.value}<br/>占比：${p.percent}%`,
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      textStyle: { color: UI_MUTED, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      itemGap: 24,
      inactiveColor: 'rgba(255,255,255,0.2)',
      itemStyle: { borderWidth: 0 },
      formatter: (name: string) => {
        void total
        return name
      },
    },
    series: [
      {
        name: title || (isEn() ? 'Share' : '占比'),
        type: 'pie',
        radius: ['0%', '68%'],
        center: ['50%', '45%'],
        startAngle: 90,
        minAngle: 6,
        avoidLabelOverlap: true,
        labelLayout: { hideOverlap: true },
        data,
        itemStyle: { borderRadius: 8, borderWidth: 0 },
        label: { show: true, color: UI_TEXT, fontSize: 13, formatter: '{b}\n{d}%' },
        labelLine: { show: true, length: 15, length2: 15, lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        emphasis: { scale: true, scaleSize: 10, itemStyle: { shadowBlur: 20, shadowColor: withAlpha(themeColors[0], 0.5) } },
      },
    ],
  }
}

export function buildDonutOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const data = [
    { name: '4G', value: 62 },
    { name: '5G', value: 28 },
    { name: isEn() ? 'Broadband' : '宽带', value: 10 },
  ]
  const common = baseOption(themeColors, { showLegend: true, unit: '', tooltipTrigger: 'item' })
  return {
    ...common,
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.92)',
      borderColor: withAlpha(themeColors[0], 0.5),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(12px);',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      formatter: (p: any) => (isEn() ? `${p.name}<br/>Rate: ${p.value}%` : `${p.name}<br/>渗透率：${p.value}%`),
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      textStyle: { color: UI_MUTED, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      itemGap: 24,
      inactiveColor: 'rgba(255,255,255,0.2)',
      itemStyle: { borderWidth: 0 },
      formatter: (name: string) => name,
    },
    series: [
      {
        name: title || (isEn() ? 'Structure' : '结构'),
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        labelLayout: { hideOverlap: true },
        data,
        itemStyle: { borderRadius: 8, borderWidth: 0 },
        label: { show: true, color: UI_TEXT, fontSize: 13, formatter: '{b}\n{d}%' },
        labelLine: { show: true, length: 15, length2: 15, lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        emphasis: { scale: true, scaleSize: 10, itemStyle: { shadowBlur: 20, shadowColor: withAlpha(themeColors[0], 0.5) } },
      },
    ],
  }
}

export function buildRoseOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const data = [
    { name: isEn() ? 'Channel A' : '渠道A', value: 32 },
    { name: isEn() ? 'Channel B' : '渠道B', value: 22 },
    { name: isEn() ? 'Channel C' : '渠道C', value: 18 },
    { name: isEn() ? 'Channel D' : '渠道D', value: 14 },
    { name: isEn() ? 'Channel E' : '渠道E', value: 10 },
  ]
  const common = baseOption(themeColors, { showLegend: true, unit: '', tooltipTrigger: 'item' })
  return {
    ...common,
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.92)',
      borderColor: withAlpha(themeColors[0], 0.5),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(12px);',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      formatter: (p: any) => (isEn() ? `${p.name}<br/>Share: ${p.percent}%` : `${p.name}<br/>占比：${p.percent}%`),
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      textStyle: { color: UI_MUTED, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      itemGap: 24,
      inactiveColor: 'rgba(255,255,255,0.2)',
      itemStyle: { borderWidth: 0 },
    },
    series: [
      {
        name: title || (isEn() ? 'Rose' : '玫瑰'),
        type: 'pie',
        roseType: 'area',
        radius: ['20%', '70%'],
        center: ['50%', '45%'],
        data,
        labelLayout: { hideOverlap: true },
        itemStyle: { borderRadius: 8, borderWidth: 0 },
        label: { show: true, color: UI_TEXT, fontSize: 13, formatter: '{b}\n{d}%' },
        labelLine: { show: true, length: 10, length2: 10, lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        emphasis: { scale: true, itemStyle: { shadowBlur: 20, shadowColor: withAlpha(themeColors[0], 0.5) } },
      },
    ],
  }
}

export function buildRadarOption(title: string, themeColors: string[]): EChartsOption {
  void title
  return {
    backgroundColor: 'transparent',
    color: themeColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.9)',
      borderColor: withAlpha(themeColors[0], 0.4),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(10px);',
      textStyle: { color: UI_TEXT, fontSize: 13 },
    },
    legend: {
      show: true,
      bottom: 8,
      left: 'center',
      textStyle: { color: UI_MUTED, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 4,
      itemGap: 24,
      inactiveColor: 'rgba(255,255,255,0.2)',
      itemStyle: { borderWidth: 0 },
    },
    radar: {
      indicator: isEn()
        ? [
            { name: 'Dim A', max: 100 },
            { name: 'Dim B', max: 100 },
            { name: 'Dim C', max: 100 },
            { name: 'Dim D', max: 100 },
            { name: 'Dim E', max: 100 },
          ]
        : [
            { name: '维度A', max: 100 },
            { name: '维度B', max: 100 },
            { name: '维度C', max: 100 },
            { name: '维度D', max: 100 },
            { name: '维度E', max: 100 },
          ],
      center: ['50%', '45%'],
      radius: '60%',
      axisName: { color: UI_MUTED, fontSize: 13 },
      splitNumber: 4,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [78, 85, 60, 72, 88],
            name: isEn() ? 'Current' : '当前',
            lineStyle: { width: 3, color: themeColors[0] },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: withAlpha(themeColors[0], 0.4) },
                { offset: 1, color: withAlpha(themeColors[0], 0.1) },
              ]),
            },
            itemStyle: { color: themeColors[0] },
          },
          {
            value: [65, 70, 85, 55, 75],
            name: isEn() ? 'Benchmark' : '对标',
            lineStyle: { width: 3, color: themeColors[1] ?? themeColors[0] },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: withAlpha(themeColors[1] ?? themeColors[0], 0.4) },
                { offset: 1, color: withAlpha(themeColors[1] ?? themeColors[0], 0.1) },
              ]),
            },
            itemStyle: { color: themeColors[1] ?? themeColors[0] },
          },
        ],
      },
    ],
  }
}

export function buildGaugeOption(title: string, themeColors: string[]): EChartsOption {
  void title
  return {
    backgroundColor: 'transparent',
    color: themeColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.9)',
      borderColor: withAlpha(themeColors[0], 0.4),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 8px;',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      formatter: (p: any) => `${p.name}<br/>${p.value}%`,
    },
    series: [
      {
        name: isEn() ? 'Health' : '健康度',
        type: 'gauge',
        center: ['50%', '55%'],
        startAngle: 210,
        endAngle: -30,
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.3, themeColors[4] ?? themeColors[0]],
              [0.7, themeColors[0]],
              [1, themeColors[1] ?? themeColors[0]],
            ],
          },
        },
        progress: { show: true, width: 16, roundCap: true },
        pointer: {
          icon: 'path://M2,0 L-2,0 L0,60 Z',
          length: '65%',
          width: 8,
          itemStyle: { color: themeColors[0] },
        },
        axisTick: { show: false },
        splitLine: { length: 12, lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: UI_MUTED, distance: 25 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '15%'],
          formatter: (v: any) => `{v|${Math.round(Number(v) || 0)}}{u|%}\n{t|${isEn() ? 'System Health' : '系统健康度'}}`,
          rich: {
            v: { fontSize: 44, fontWeight: 800, color: UI_TEXT, textShadowBlur: 10, textShadowColor: withAlpha(themeColors[0], 0.5) },
            u: { fontSize: 20, fontWeight: 700, color: withAlpha(UI_TEXT, 0.8), padding: [0, 0, 6, 2] },
            t: { fontSize: 14, color: UI_MUTED, padding: [8, 0, 0, 0] },
          },
        },
        data: [{ value: 76, name: '' }],
        title: { show: false },
      },
    ],
  }
}

export function buildWaterOption(title: string, themeColors: string[]): EChartsOption {
  void title
  return {
    backgroundColor: 'transparent',
    color: themeColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 22, 0.9)',
      borderColor: withAlpha(themeColors[0], 0.4),
      borderWidth: 1,
      padding: [12, 16],
      extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.6); border-radius: 8px;',
      textStyle: { color: UI_TEXT, fontSize: 13 },
      formatter: (p: any) => `${p.name}<br/>${Math.round((p.value || 0) * 100)}%`,
    },
    series: [
      {
        type: 'liquidFill',
        name: isEn() ? 'Utilization' : '利用率',
        data: [0.72, 0.6],
        radius: '70%',
        center: ['50%', '48%'],
        color: [themeColors[0], themeColors[1] ?? themeColors[0]],
        label: {
          formatter: () => `{v|72%}\n{t|${isEn() ? 'Resource Utilization' : '资源利用率'}}`,
          rich: {
            v: { fontSize: 44, fontWeight: 800, color: UI_TEXT, textShadowBlur: 10, textShadowColor: withAlpha(themeColors[0], 0.5) },
            t: { fontSize: 14, color: UI_MUTED, padding: [8, 0, 0, 0] },
          },
        },
        outline: {
          borderDistance: 6,
          itemStyle: {
            borderColor: withAlpha(themeColors[0], 0.4),
            borderWidth: 2,
          },
        },
        backgroundStyle: { color: 'transparent' },
      } as any,
    ],
  } as any
}

export function buildHeatmapOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const x = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const y = ['0', '1', '2', '3', '4', '5']
  const data = [] as any[]
  for (let yi = 0; yi < y.length; yi++) {
    for (let xi = 0; xi < x.length; xi++) {
      data.push([xi, yi, Math.round(20 + ((xi + yi) % 7) * 10)])
    }
  }
  const primary = themeColors[0] ?? '#6AA6FF'
  const common = baseOption(themeColors)
  return {
    ...common,
    grid: { left: 30, right: 30, top: 36, bottom: 16 },
    xAxis: { ...(common as any).xAxis, type: 'category', data: x },
    yAxis: { ...(common as any).yAxis, type: 'category', data: y, name: '' },
    visualMap: { min: 0, max: 90, show: false, inRange: { color: [withAlpha(primary, 0.12), primary] } },
    series: [{ type: 'heatmap', data, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.25)' } } }],
  }
}

export function buildFunnelOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const data = [
    { name: isEn() ? 'Impressions' : '曝光', value: 1000 },
    { name: isEn() ? 'Clicks' : '点击', value: 520 },
    { name: isEn() ? 'Leads' : '留资', value: 220 },
    { name: isEn() ? 'Conversion' : '转化', value: 90 },
  ]
  const common = baseOption(themeColors, { tooltipTrigger: 'item' })
  return {
    ...common,
    series: [
      {
        type: 'funnel',
        left: '10%',
        top: '12%',
        bottom: '12%',
        width: '80%',
        min: 0,
        max: 1000,
        sort: 'descending',
        gap: 0,
        itemStyle: { borderColor: 'rgba(0,0,0,0)', borderWidth: 0 },
        label: { color: 'rgba(245, 248, 255, 0.86)', position: 'inside', fontSize: 12, fontWeight: 600 },
        labelLine: { show: false },
        emphasis: { itemStyle: { borderColor: 'rgba(0,0,0,0)', borderWidth: 0 } },
        data,
      },
    ],
  }
}

export function buildTreemapOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const data = [
    { name: 'A', value: 48 },
    { name: 'B', value: 36 },
    { name: 'C', value: 22 },
    { name: 'D', value: 18 },
  ]
  const common = baseOption(themeColors)
  return {
    ...common,
    series: [
      {
        type: 'treemap',
        top: 60,
        left: 14,
        right: 14,
        bottom: 14,
        breadcrumb: { show: false },
        label: { show: true, color: 'rgba(245, 248, 255, 0.86)' },
        itemStyle: { borderColor: 'rgba(0,0,0,0)', gapWidth: 2 },
        data,
      },
    ],
  }
}

export function buildSankeyOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const nodes = isEn() ? [{ name: 'Visit' }, { name: 'Sign Up' }, { name: 'Order' }, { name: 'Pay' }] : [{ name: '访问' }, { name: '注册' }, { name: '下单' }, { name: '支付' }]
  const links = isEn()
    ? [
        { source: 'Visit', target: 'Sign Up', value: 420 },
        { source: 'Sign Up', target: 'Order', value: 220 },
        { source: 'Order', target: 'Pay', value: 120 },
      ]
    : [
        { source: '访问', target: '注册', value: 420 },
        { source: '注册', target: '下单', value: 220 },
        { source: '下单', target: '支付', value: 120 },
      ]
  const primary = themeColors[0] ?? '#6AA6FF'
  const common = baseOption(themeColors, { tooltipTrigger: 'item' })
  return {
    ...common,
    series: [
      {
        type: 'sankey',
        top: 66,
        left: 12,
        right: 12,
        bottom: 12,
        data: nodes,
        links,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', opacity: 0.55 },
        itemStyle: { color: primary, borderWidth: 0 },
        label: { color: 'rgba(245, 248, 255, 0.86)' },
      },
    ],
  }
}

export function buildGraphOption(title: string, themeColors: string[]): EChartsOption {
  void title
  const primary = themeColors[0] ?? '#6AA6FF'
  const nodes = [
    { id: 'A', name: isEn() ? 'User' : '用户' },
    { id: 'B', name: isEn() ? 'Order' : '订单' },
    { id: 'C', name: isEn() ? 'Product' : '商品' },
    { id: 'D', name: isEn() ? 'Channel' : '渠道' },
  ]
  const links = [
    { source: 'A', target: 'B', value: 3 },
    { source: 'B', target: 'C', value: 5 },
    { source: 'A', target: 'D', value: 2 },
  ]
  const common = baseOption(themeColors, { tooltipTrigger: 'item' })
  return {
    ...common,
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        label: { show: true, color: 'rgba(245, 248, 255, 0.86)' },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 10,
        force: { repulsion: 220, edgeLength: 80 },
        data: nodes.map((n) => ({ ...n, symbolSize: 46, itemStyle: { color: primary } })),
        links,
        lineStyle: { color: 'rgba(189, 203, 227, 0.45)', width: 2 },
      },
    ],
  }
}

export function kpiValue(format: string) {
  const v = 182345.78
  if (format === 'percent') return `${(v / 1000000).toFixed(2)}%`
  if (format === 'number') return String(Math.round(v))
  return `¥${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}
