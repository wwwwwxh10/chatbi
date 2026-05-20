import type { EChartsOption } from 'echarts'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  at: number
}

export type ResultTable = {
  columns: string[]
  rows: Array<Record<string, string | number | null>>
}

export type MessageResult = {
  status?: 'running' | 'done' | 'stopped' | 'clarifying'
  tookMs?: number
  answerText: string
  sql?: string
  table?: ResultTable
  chart?: EChartsOption
  chartVariants?: Record<string, EChartsOption>
  metric?: { label: string; value: string }
}

export type ConversationState = {
  id: string
  title: string
  dataSourceId?: string
  messages: ChatMessage[]
  resultsByAssistantId: Record<string, MessageResult>
  activeAssistantId?: string
}

export function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function storageKey(conversationId: string) {
  return `chatbi-conv-v1:${conversationId}`
}

export function toCsv(columns: string[], rows: Array<Record<string, string | number | null>>) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    const needs = /[\n\r\t",]/.test(s)
    const out = s.replace(/"/g, '""')
    return needs ? `"${out}"` : out
  }
  const lines = [columns.map(esc).join(',')]
  for (const r of rows) lines.push(columns.map((c) => esc(r[c])).join(','))
  return `\ufeff${lines.join('\n')}`
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function mockChartOption(): EChartsOption {
  return {
    grid: { left: 16, right: 12, top: 30, bottom: 36, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLabel: { opacity: 0.7, hideOverlap: true, margin: 12, rotate: 28 },
      axisLine: { lineStyle: { opacity: 0.35 } },
    },
    yAxis: {
      type: 'value',
      splitNumber: 4,
      axisLabel: { opacity: 0.7, margin: 8 },
      splitLine: { lineStyle: { opacity: 0.12 } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.12 },
        data: [120, 132, 101, 134, 90, 230, 210],
      },
    ],
  }
}

export function buildMockResult(question: string): MessageResult {
  const q = question.trim()
  const seed = Array.from(q).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

  const computeUnit = (maxAbs: number) => {
    if (!Number.isFinite(maxAbs)) return { unit: '', div: 1 }
    if (maxAbs >= 1e8) return { unit: '亿', div: 1e8 }
    if (maxAbs >= 1e4) return { unit: '万', div: 1e4 }
    if (maxAbs >= 1e3) return { unit: '千', div: 1e3 }
    return { unit: '', div: 1 }
  }

  const formatCompact = (n: number, div: number) => {
    if (!Number.isFinite(n)) return ''
    const v = n / div
    const digits = div === 1 ? 0 : v >= 100 ? 0 : v >= 10 ? 1 : 2
    return `${v.toFixed(digits)}`
  }

  const applyAxis = (axis: any) => ({
    ...axis,
    splitNumber: axis?.type === 'value' ? (axis?.splitNumber ?? 4) : axis?.splitNumber,
    axisLabel: {
      ...(axis?.axisLabel ?? {}),
      opacity: 0.8,
      hideOverlap: true,
      margin: axis?.axisLabel?.margin ?? (axis?.type === 'category' ? 12 : 8),
      rotate:
        axis?.type === 'category'
          ? (axis?.axisLabel?.rotate ?? ((axis?.data?.length ?? 0) > 6 ? 28 : 0))
          : axis?.axisLabel?.rotate,
    },
    axisLine: { ...(axis?.axisLine ?? {}), lineStyle: { ...(axis?.axisLine?.lineStyle ?? {}), opacity: 0.35 } },
    axisTick: { ...(axis?.axisTick ?? {}), show: false },
    splitLine: axis?.splitLine,
  })

  const baseTooltip = {
    trigger: 'axis',
    backgroundColor: 'rgba(16, 18, 22, 0.92)',
    borderColor: 'transparent',
    borderWidth: 0,
    textStyle: { color: 'rgba(233, 236, 242, 0.92)' },
    extraCssText: 'border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); z-index: 99999;',
  } as const

  const baseGrid = { left: 12, right: 10, top: 40, bottom: 30, containLabel: true } as const

  const colors = {
    primary: '#2B5CF6',
    secondary: 'rgba(233,236,242,0.24)',
    split: 'rgba(255,255,255,0.10)',
  } as const

  const palette = ['#2B5CF6', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#F97316']

  const wantsPie = /占比|构成|结构|份额|比例|分布/.test(q)
  const wantsFunnel = /漏斗/.test(q)
  const wantsRadar = /雷达|画像/.test(q)
  const wantsSankey = /桑基|流向|路径/.test(q)

  const isAmbiguous = /多少|金额|GMV|订单/.test(q) && !/今天|本周|本月|本年|近\d+天|\d{4}-\d{2}-\d{2}/.test(q)
  if (isAmbiguous) {
    return {
      status: 'clarifying',
      answerText: '您好，为了提供更准确的分析结果，请问您想看哪个时间段的数据？（例如：今天、本周、本月或指定日期范围）',
    }
  }

  const isToday = /今天/.test(q)
  const isMaxBySource = /来源名称|最大值/.test(q)
  const isYtd = /年度累计|累计情况/.test(q)

  const isWireless = /无线端|移动端|手机端|app|h5/i.test(q) && /(金额|gmv|总额|总金额|下单)/i.test(q)
  if (isWireless) {
    if (isToday) {
      const metric = { label: '今天无线端下单金额(求和)', value: '231万' }
      const answerText = ''

      const sql =
        'SELECT\n'
        + '  hour(dt_time) AS hh,\n'
        + '  SUM(amount) AS gmv\n'
        + 'FROM dwd_orders\n'
        + "WHERE dt = CURRENT_DATE\n"
        + "  AND device_type = 'wireless'\n"
        + "  AND pay_status = 'paid'\n"
        + 'GROUP BY 1\n'
        + 'ORDER BY 1;'

      const rows = Array.from({ length: 8 }).map((_, i) => {
        const hh = `${(9 + i).toString().padStart(2, '0')}:00`
        const gmv = [12, 18, 25, 31, 42, 36, 29, 38][i]
        return { 小时: hh, GMV: `${gmv}万` }
      })

      const table: ResultTable = { columns: ['小时', 'GMV'], rows }

      const chartLine: EChartsOption = {
        grid: { left: 16, right: 12, top: 40, bottom: 36, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: rows.map((r) => String(r.小时)), axisLabel: { opacity: 0.8 }, axisLine: { lineStyle: { opacity: 0.35 } } },
        yAxis: { type: 'value', name: '(万)', nameLocation: 'end', nameGap: 8, nameTextStyle: { color: 'rgba(233,236,242,0.40)', fontSize: 12, align: 'center' }, axisLabel: { opacity: 0.75 }, splitLine: { lineStyle: { opacity: 0.12 } } },
        series: [
          {
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 7,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.12 },
            data: [12, 18, 25, 31, 42, 36, 29, 38],
          },
        ],
      }

      return { status: 'done', answerText, sql, table, chart: chartLine, chartVariants: { 折线图: chartLine }, metric }
    }

    if (isMaxBySource) {
      const metric = { label: '无线端下单金额最大值', value: '128万' }
      const answerText = ''

      const sql =
        'SELECT\n'
        + '  source_name,\n'
        + '  MAX(amount) AS max_amount\n'
        + 'FROM dwd_orders\n'
        + "WHERE device_type = 'wireless'\n"
        + "  AND pay_status = 'paid'\n"
        + "  AND source_name = '测试来源2.5'\n"
        + 'GROUP BY 1;'

      const table: ResultTable = {
        columns: ['来源', '最大值'],
        rows: [
          { 来源: '测试来源2.5', 最大值: '128万' },
          { 来源: '测试来源2.4', 最大值: '96万' },
          { 来源: '测试来源2.3', 最大值: '88万' },
        ],
      }

      const chartBar: EChartsOption = {
        grid: { left: 16, right: 12, top: 40, bottom: 36, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['2.5', '2.4', '2.3'], axisLabel: { opacity: 0.8 }, axisLine: { lineStyle: { opacity: 0.35 } } },
        yAxis: { type: 'value', axisLabel: { opacity: 0.75 }, splitLine: { lineStyle: { opacity: 0.12 } } },
        series: [{ type: 'bar', barWidth: 22, data: [128, 96, 88], itemStyle: { borderRadius: [10, 10, 0, 0] } }],
      }

      return { status: 'done', answerText, sql, table, chart: chartBar, chartVariants: { 柱状图: chartBar }, metric }
    }

    if (isYtd) {
      const metric = { label: '无线端下单金额(年度累计)', value: '2.31亿' }
      const answerText = ''

      const sql =
        'WITH monthly AS (\n'
        + '  SELECT month(dt) AS m, SUM(amount) AS gmv\n'
        + '  FROM dwd_orders\n'
        + "  WHERE year(dt) = year(CURRENT_DATE)\n"
        + "    AND device_type = 'wireless'\n"
        + "    AND pay_status = 'paid'\n"
        + '  GROUP BY 1\n'
        + ')\n'
        + 'SELECT m, gmv, SUM(gmv) OVER (ORDER BY m) AS ytd\n'
        + 'FROM monthly\n'
        + 'ORDER BY m;'

      const months = ['1月', '2月', '3月', '4月', '5月']
      const gmv = [3800, 4100, 4650, 5200, 5350]
      const ytd = gmv.reduce<number[]>((acc, cur) => {
        const last = acc.length ? acc[acc.length - 1] : 0
        acc.push(last + cur)
        return acc
      }, [])

      const table: ResultTable = {
        columns: ['月份', '当月GMV', '年度累计'],
        rows: months.map((m, i) => ({ 月份: m, 当月GMV: `${gmv[i]}万`, 年度累计: `${ytd[i]}万` })),
      }

      const chartCombo: EChartsOption = {
        grid: { left: 16, right: 12, top: 40, bottom: 36, containLabel: true },
        tooltip: { trigger: 'axis' },
        legend: { data: ['当月', '累计'] },
        xAxis: { type: 'category', data: months, axisLabel: { opacity: 0.8 }, axisLine: { lineStyle: { opacity: 0.35 } } },
        yAxis: { type: 'value', axisLabel: { opacity: 0.75 }, splitLine: { lineStyle: { opacity: 0.12 } } },
        series: [
          { name: '当月', type: 'bar', barWidth: 18, data: gmv, itemStyle: { borderRadius: [8, 8, 0, 0] } },
          { name: '累计', type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2 }, data: ytd },
        ],
      }

      return { status: 'done', answerText, sql, table, chart: chartCombo, chartVariants: { '柱+折': chartCombo }, metric }
    }

    const answerText = ''

    const sql =
      'WITH base AS (\n'
      + '  SELECT dt, channel, city, category, amount\n'
      + '  FROM dwd_orders\n'
      + "  WHERE dt BETWEEN DATE '2026-04-01' AND DATE '2026-04-30'\n"
      + "    AND device_type = 'wireless'\n"
      + "    AND pay_status = 'paid'\n"
      + ')\n'
      + 'SELECT\n'
      + '  SUM(amount) AS wireless_gmv,\n'
      + '  COUNT(*) AS orders\n'
      + 'FROM base;'

    const metric = { label: '无线端下单金额(求和)', value: '9174万' }

    const table: ResultTable = {
      columns: ['维度', '名称', 'GMV', '订单数', '占比'],
      rows: [
        { 维度: '渠道', 名称: '自然', GMV: 486120, 订单数: 8230, 占比: '37.8%' },
        { 维度: '渠道', 名称: '广告', GMV: 392840, 订单数: 6410, 占比: '30.5%' },
        { 维度: '渠道', 名称: '活动', GMV: 288930, 订单数: 5120, 占比: '22.5%' },
        { 维度: '城市', 名称: '上海', GMV: 92310, 订单数: 1260, 占比: '7.2%' },
        { 维度: '城市', 名称: '广州', GMV: 86120, 订单数: 1180, 占比: '6.7%' },
        { 维度: '品类', 名称: '3C数码', GMV: 176540, 订单数: 980, 占比: '13.7%' },
      ],
    }

    const chartBar: EChartsOption = {
      grid: { left: 16, right: 12, top: 40, bottom: 36, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['自然', '广告', '活动', '其他'],
        axisLabel: { opacity: 0.8 },
        axisLine: { lineStyle: { opacity: 0.35 } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { opacity: 0.75 },
        splitLine: { lineStyle: { opacity: 0.12 } },
      },
      series: [
        {
          type: 'bar',
          barWidth: 22,
          data: [486120, 392840, 288930, 118650],
          itemStyle: { borderRadius: [10, 10, 0, 0] },
        },
      ],
    }

    const chartLine: EChartsOption = {
      grid: { left: 16, right: 12, top: 40, bottom: 36, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['自然', '广告', '活动', '其他'],
        axisLabel: { opacity: 0.8 },
        axisLine: { lineStyle: { opacity: 0.35 } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { opacity: 0.75 },
        splitLine: { lineStyle: { opacity: 0.12 } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.12 },
          data: [486120, 392840, 288930, 118650],
        },
      ],
    }

    return { status: 'done', answerText, sql, table, chart: chartBar, chartVariants: { 柱状图: chartBar, 折线图: chartLine }, metric }
  }

  if (wantsPie) {
    return {
      status: 'done',
      answerText: '',
      table: {
        columns: ['渠道', '销售额', '占比'],
        rows: [
          { 渠道: '自然流量', 销售额: 78210, 占比: '40.5%' },
          { 渠道: '广告投放', 销售额: 59200, 占比: '30.6%' },
          { 渠道: '活动', 销售额: 55830, 占比: '28.9%' },
        ],
      },
      chart: {
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['35%', '70%'],
            center: ['50%', '52%'],
            label: { show: false },
            labelLine: { show: false },
            data: [
              { name: '自然流量', value: 78210 },
              { name: '广告投放', value: 59200 },
              { name: '活动', value: 55830 },
            ],
            itemStyle: { borderRadius: 8, borderWidth: 0 },
          },
        ],
      } as any,
    }
  }

  if (wantsFunnel) {
    return {
      status: 'done',
      answerText: '',
      table: {
        columns: ['阶段', '人数'],
        rows: [
          { 阶段: '曝光', 人数: 120000 },
          { 阶段: '点击', 人数: 42000 },
          { 阶段: '加购', 人数: 15300 },
          { 阶段: '下单', 人数: 6200 },
          { 阶段: '支付', 人数: 5100 },
        ],
      },
      chart: {
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'funnel',
            left: '10%',
            width: '80%',
            top: '15%',
            bottom: '15%',
            minSize: 40,
            label: { show: true, position: 'inside', color: '#fff' },
            data: [
              { name: '曝光', value: 120000 },
              { name: '点击', value: 42000 },
              { name: '加购', value: 15300 },
              { name: '下单', value: 6200 },
              { name: '支付', value: 5100 },
            ],
          },
        ],
      } as any,
    }
  }

  if (wantsRadar) {
    return {
      status: 'done',
      answerText: '',
      chart: {
        tooltip: {
          trigger: 'item',
          backgroundColor: baseTooltip.backgroundColor,
          borderColor: baseTooltip.borderColor,
          borderWidth: baseTooltip.borderWidth,
          textStyle: baseTooltip.textStyle,
          extraCssText: baseTooltip.extraCssText,
        },
        radar: {
          radius: '68%',
          center: ['50%', '55%'],
          nameTextStyle: { color: 'rgba(255,255,255,0.96)', fontSize: 14, fontWeight: 800 },
          splitLine: { lineStyle: { color: '#e6e6e6', width: 1.5 } },
          splitArea: { areaStyle: { color: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] } },
          axisLine: { lineStyle: { color: '#e6e6e6', width: 1.5 } },
          indicator: [
            { name: '价格', max: 100 },
            { name: '销量', max: 100 },
            { name: '复购', max: 100 },
            { name: '曝光', max: 100 },
            { name: '好评', max: 100 },
          ],
        },
        series: [
          {
            type: 'radar',
            areaStyle: { opacity: 0.08 },
            lineStyle: { width: 2 },
            itemStyle: { color: '#2B5CF6' },
            data: [{ value: [72, 88, 64, 91, 79], name: '画像' }],
          },
        ],
      } as any,
    }
  }

  if (wantsSankey) {
    return {
      status: 'done',
      answerText: '',
      chart: {
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'sankey',
            data: [{ name: '首页' }, { name: '搜索' }, { name: '详情页' }, { name: '加购' }, { name: '支付' }],
            links: [
              { source: '首页', target: '搜索', value: 60 },
              { source: '搜索', target: '详情页', value: 45 },
              { source: '详情页', target: '加购', value: 20 },
              { source: '加购', target: '支付', value: 14 },
              { source: '首页', target: '详情页', value: 25 },
              { source: '详情页', target: '支付', value: 6 },
            ],
            lineStyle: { color: 'source', opacity: 0.25 },
            itemStyle: { borderWidth: 0 },
          },
        ],
      } as any,
    }
  }

  const answerText = `结论：针对“${q || '（空）'}”，本周波动主要来自渠道结构变化与活动叠加。建议你先看趋势，再按渠道/城市/品类下钻确认。`
  const sql =
    'SELECT dt, SUM(gmv) AS gmv\n'
    + 'FROM dwd_orders\n'
    + "WHERE dt >= CURRENT_DATE - INTERVAL '7 day'\n"
    + 'GROUP BY dt\n'
    + 'ORDER BY dt;'

  const table: ResultTable = {
    columns: ['维度', '本周', '上周', '环比'],
    rows: [
      { 维度: '全站', 本周: 193240, 上周: 195380, 环比: '-1.1%' },
      { 维度: '自然流量', 本周: 78210, 上周: 76120, 环比: '+2.7%' },
      { 维度: '广告投放', 本周: 59200, 上周: 64800, 环比: '-8.6%' },
      { 维度: '活动', 本周: 55830, 上周: 54460, 环比: '+2.5%' },
    ],
  }

  const dims = table.rows.map((r) => String(r['维度'] ?? ''))
  const vals = table.rows.map((r) => {
    const v = r['本周']
    return typeof v === 'number' ? v : Number(String(v ?? '').replace(/[,%]/g, ''))
  })

  const maxAbs = Math.max(0, ...vals.map((v) => Math.abs(Number(v) || 0)))
  const { unit, div } = computeUnit(maxAbs)
  const xStep = dims.length <= 8 ? 0 : Math.max(1, Math.ceil(dims.length / 6) - 1)
  const xRotate = dims.length > 6 ? 28 : 0
  const xLabel = {
    interval: xStep === 0 ? 0 : xStep,
    hideOverlap: true,
    rotate: xRotate,
    margin: xRotate ? 12 : 10,
    fontSize: dims.length > 10 ? 11 : 12,
    overflow: 'truncate',
    width: 72,
    ellipsis: '…',
    showMinLabel: true,
    showMaxLabel: true,
    formatter: (v: unknown) => {
      const s = String(v ?? '')
      return s.length > 8 ? `${s.slice(0, 8)}…` : s
    },
    opacity: 0.8,
  }

  const yLabel = {
    opacity: 0.75,
    margin: 6,
    formatter: (v: unknown) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return String(v ?? '')
      return formatCompact(n, div)
    },
  }

  const grid = { ...baseGrid, left: 12, right: 10, bottom: xRotate ? 52 : (baseGrid as any).bottom } as const

  const chartBar: EChartsOption = {
    animationDuration: 450,
    animationEasing: 'cubicOut',
    grid: grid as any,
    tooltip: baseTooltip as any,
    xAxis: applyAxis({ type: 'category', data: dims, axisLabel: xLabel } as any),
    yAxis: applyAxis(
      {
        type: 'value',
        name: unit ? `(${unit})` : undefined,
        nameLocation: 'end',
        nameGap: 8,
        nameTextStyle: { color: 'rgba(233,236,242,0.40)', fontSize: 12, align: 'center' },
        axisLabel: yLabel,
        splitLine: { lineStyle: { opacity: 0.12 } },
      } as any,
    ),
    series: [
      {
        type: 'bar',
        data: vals,
        barWidth: 22,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colors.primary },
              { offset: 1, color: 'rgba(43,92,246,0.35)' },
            ],
          },
        },
      },
    ],
  }
  const chartLine: EChartsOption = {
    grid: grid as any,
    tooltip: baseTooltip as any,
    xAxis: applyAxis({ type: 'category', data: dims, axisLabel: xLabel } as any),
    yAxis: applyAxis(
      {
        type: 'value',
        name: unit ? `(${unit})` : undefined,
        nameLocation: 'end',
        nameGap: 8,
        nameTextStyle: { color: 'rgba(233,236,242,0.40)', fontSize: 12, align: 'center' },
        axisLabel: yLabel,
        splitLine: { lineStyle: { opacity: 0.12 } },
      } as any,
    ),
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        showSymbol: false,
        lineStyle: { width: 2, color: colors.primary },
        itemStyle: { color: colors.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(43,92,246,0.22)' },
              { offset: 1, color: 'rgba(43,92,246,0.00)' },
            ],
          },
        },
        data: vals,
      },
    ],
  }
  const chartPie: EChartsOption = {
    animationDuration: 450,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: baseTooltip.backgroundColor,
      borderColor: baseTooltip.borderColor,
      borderWidth: baseTooltip.borderWidth,
      textStyle: baseTooltip.textStyle,
      extraCssText: baseTooltip.extraCssText,
    } as any,
    color: palette as any,
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '52%'],
        startAngle: 90,
        padAngle: 2,
        minAngle: 6,
        label: { show: false },
        labelLine: { show: false },
        data: dims.map((name, i) => ({ name, value: vals[i] })),
        itemStyle: { borderRadius: 10, borderWidth: 0 },
        emphasis: { scale: true, scaleSize: 6 },
      },
    ],
  }
  const chartFunnel: EChartsOption = {
    animationDuration: 450,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: baseTooltip.backgroundColor,
      borderColor: baseTooltip.borderColor,
      borderWidth: baseTooltip.borderWidth,
      textStyle: baseTooltip.textStyle,
      extraCssText: baseTooltip.extraCssText,
    } as any,
    series: [
      {
        type: 'funnel',
        left: '12%',
        width: '76%',
        top: 18,
        bottom: 14,
        gap: 6,
        minSize: '20%',
        maxSize: '92%',
        label: { show: true, position: 'inside', color: 'rgba(233,236,242,0.92)', fontSize: 12 },
        labelLine: { show: false },
        itemStyle: { borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderRadius: 10 },
        color: palette as any,
        data: dims
          .slice(0, 5)
          .map((name, i) => ({ name, value: Math.max(1, Math.round((vals[i] ?? 0) / 10)) }))
          .sort((a, b) => b.value - a.value),
      },
    ],
  }
  const chartRadar: EChartsOption = {
    animationDuration: 450,
    animationEasing: 'cubicOut',
    tooltip: {},
    radar: {
      splitLine: { lineStyle: { color: colors.split, opacity: 0.4 } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.00)'] } },
      axisLine: { lineStyle: { color: colors.split, opacity: 0.6 } },
      indicator: [
        { name: '价格', max: 100 },
        { name: '销量', max: 100 },
        { name: '复购', max: 100 },
        { name: '曝光', max: 100 },
        { name: '好评', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        areaStyle: { color: 'rgba(43,92,246,0.22)' },
        lineStyle: { color: colors.primary, width: 2 },
        itemStyle: { color: colors.primary },
        data: [{ value: [72, 88, 64, 91, 79], name: '画像' }],
      },
    ],
  }
  const chartSankey: EChartsOption = {
    animationDuration: 450,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: baseTooltip.backgroundColor,
      borderColor: baseTooltip.borderColor,
      borderWidth: baseTooltip.borderWidth,
      textStyle: baseTooltip.textStyle,
      extraCssText: baseTooltip.extraCssText,
    } as any,
    series: [
      {
        type: 'sankey',
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
        nodeGap: 12,
        nodeWidth: 12,
        draggable: false,
        data: dims.slice(0, 5).map((name) => ({ name })),
        links: dims.slice(0, 4).map((name, i) => ({ source: name, target: dims[i + 1], value: Math.max(1, Math.round((vals[i] ?? 0) / 1000)) })),
        lineStyle: { color: 'gradient', opacity: 0.22, curveness: 0.5 },
        itemStyle: { borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, color: 'rgba(233,236,242,0.18)' },
        levels: [
          { depth: 0, itemStyle: { color: colors.primary } },
          { depth: 1, itemStyle: { color: 'rgba(124,58,237,0.90)' } },
          { depth: 2, itemStyle: { color: 'rgba(6,182,212,0.90)' } },
          { depth: 3, itemStyle: { color: 'rgba(233,236,242,0.22)' } },
        ],
        emphasis: { focus: 'adjacency' },
      },
    ],
  }

  const chartScatter: EChartsOption = {
    grid: baseGrid as any,
    tooltip: baseTooltip as any,
    xAxis: applyAxis({ type: 'value', axisLabel: yLabel, splitLine: { lineStyle: { opacity: 0.12 } } } as any),
    yAxis: applyAxis({ type: 'value', axisLabel: yLabel, splitLine: { lineStyle: { opacity: 0.12 } } } as any),
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        itemStyle: { color: colors.primary, opacity: 0.82 },
        data: vals.slice(0, 12).map((v, i) => {
          const x = Number(v) || 0
          const y = Math.max(0, x * (0.6 + ((seed + i * 13) % 40) / 100))
          return [x, y]
        }),
      },
    ],
  }

  const chartBubble: EChartsOption = {
    grid: baseGrid as any,
    tooltip: baseTooltip as any,
    xAxis: applyAxis({ type: 'value', axisLabel: yLabel, splitLine: { lineStyle: { opacity: 0.12 } } } as any),
    yAxis: applyAxis({ type: 'value', axisLabel: yLabel, splitLine: { lineStyle: { opacity: 0.12 } } } as any),
    series: [
      {
        type: 'scatter',
        itemStyle: { color: 'rgba(43,92,246,0.55)', borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1 },
        data: vals.slice(0, 12).map((v, i) => {
          const x = Number(v) || 0
          const y = Math.max(0, x * (0.55 + ((seed + i * 17) % 50) / 100))
          const s = 12 + ((seed + i * 19) % 18)
          return [x, y, s]
        }),
        symbolSize: (val: any) => Number(val?.[2] ?? 18),
      },
    ],
  }

  const pick = ['柱状图', '折线图', '饼图', '漏斗图', '雷达图', '气泡图', '散点图', '桑基图'][seed % 8] as keyof MessageResult['chartVariants']
  const variants: Record<string, EChartsOption> = {
    柱状图: chartBar,
    折线图: chartLine,
    饼图: chartPie,
    漏斗图: chartFunnel,
    雷达图: chartRadar,
    气泡图: chartBubble,
    散点图: chartScatter,
    桑基图: chartSankey,
  }

  const metricVal = (() => {
    const first = table.rows[0]?.['本周']
    if (typeof first === 'number') return first
    const n = Number(String(first ?? '').replace(/[,%]/g, ''))
    return Number.isFinite(n) ? n : vals[0] ?? 0
  })()

  return {
    status: 'done',
    answerText,
    sql,
    table,
    metric: { label: '本周指标', value: formatNumber(metricVal) },
    chart: variants[pick] ?? chartLine,
    chartVariants: variants,
  }
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  const abs = Math.abs(n)
  if (abs >= 1e8) return `${(n / 1e8).toFixed(2)}亿`
  if (abs >= 1e4) return `${(n / 1e4).toFixed(2)}万`
  if (abs >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function seedConversation(conversationId: string): ConversationState {
  const m1u: ChatMessage = { id: nowId(), role: 'user', content: '无线端下单的总金额是多少？', at: Date.now() - 1000 * 60 * 12 }
  const r1 = buildMockResult(m1u.content)
  const m1a: ChatMessage = { id: nowId(), role: 'assistant', content: r1.answerText, at: Date.now() - 1000 * 60 * 11 }

  const m2u: ChatMessage = { id: nowId(), role: 'user', content: '按渠道/城市/品类验证，看看异常点', at: Date.now() - 1000 * 60 * 9 }
  const r2 = buildMockResult(m2u.content)
  const m2a: ChatMessage = { id: nowId(), role: 'assistant', content: r2.answerText, at: Date.now() - 1000 * 60 * 8 }

  const m3u: ChatMessage = { id: nowId(), role: 'user', content: '把异常渠道的 Top 城市列出来', at: Date.now() - 1000 * 60 * 6 }
  const r3 = buildMockResult(m3u.content)
  const m3a: ChatMessage = { id: nowId(), role: 'assistant', content: r3.answerText, at: Date.now() - 1000 * 60 * 5 }

  return {
    id: conversationId,
    title: '开始对话',
    messages: [
      { id: nowId(), role: 'assistant', content: '你好，我是智能问数。你可以继续追问，我会给出图表、表格和 SQL。', at: Date.now() - 1000 * 60 * 14 },
      m1u,
      m1a,
      m2u,
      m2a,
      m3u,
      m3a,
    ],
    resultsByAssistantId: { [m1a.id]: r1, [m2a.id]: r2, [m3a.id]: r3 },
    activeAssistantId: m3a.id,
  }
}
