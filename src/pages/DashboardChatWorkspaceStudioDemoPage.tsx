import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd'
import {
  AppstoreOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import type { EChartsOption } from 'echarts'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Activity, AreaChart, BarChart3, ChartScatter, CircleDot, CopyPlus, Donut, Droplets, Filter, Flower2, Layers, LineChart, Network, PieChart, Radar, Sigma, Workflow } from 'lucide-react'
import { EChart } from '../components/EChart'
import { VirtualAvatar } from '../components/VirtualAvatar'
import { DatasetPreviewModal } from '../components/DatasetPreviewModal'
import { DataTableSearchIcon } from '../components/icons/DataTableIcon'
import { FlipCounter } from '../components/MetricCards'
import { broadcastGlobalSelection, GLOBAL_SELECTION_EVENT } from '../utils/globalSelection'
import { buildMockResult } from './chat/chatUtils'
import type { MessageResult } from './chat/chatUtils'
import { CHART_PALETTES, KIND_NAME, THEME_ACCENT } from './studioModel'
import type { StudioAppearance, StudioLayout, WidgetKind } from './studioModel'
import { enhanceDashboardChartOption } from './dashboardChartInteractions'
import { useDashboardsStore } from '../store/dashboardsStore'
import {
  buildAreaOption,
  buildBarOption,
  buildBubbleOption,
  buildCurveOption,
  buildDonutOption,
  buildFunnelOption,
  buildGaugeOption,
  buildGraphOption,
  buildGradientBarOption,
  buildGroupedBarOption,
  buildHBarOption,
  buildHeatmapOption,
  buildLineOption,
  buildPieOption,
  buildRadarOption,
  buildRoseOption,
  buildSankeyOption,
  buildScatterOption,
  buildStackedBarOption,
  buildTreemapOption,
  buildWaterOption,
  kpiValue,
} from './studioCharts'

type ChartTypeKey =
  | 'bar'
  | 'pie'
  | 'line'
  | 'metric'
  | 'funnel'
  | 'radar'
  | 'bubble'
  | 'scatter'
  | 'sankey'

const CHART_TYPE_LABELS: Record<ChartTypeKey, string> = {
  bar: '柱图',
  pie: '饼图',
  line: '折线图',
  metric: '指标卡',
  funnel: '漏斗图',
  radar: '雷达图',
  bubble: '气泡图',
  scatter: '散点图',
  sankey: '桑基图',
}

const CHART_TYPE_ICONS: Record<ChartTypeKey, ReactNode> = {
  bar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13.5H14" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.5 13V9.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 13V6.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.5 13V8" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12.5 13V4.5" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  pie: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 2.5V8h5.5" stroke="#1677FF" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  line: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13.5H14" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.5 13V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3 10.5l3-3 2.2 2.2L12.8 5" stroke="#1677FF" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  metric: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3.5h10v9H3v-9Z" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 6h5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.5 9.5h7" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  funnel: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3.5h10" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 3.5l4 5v4l-2 1v-5l-2-4" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 3.5l-4 5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5.2 3.5h2.6" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  radar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2.5l4 2.4v5.2L8 13.5l-4-3.4V4.9L8 2.5Z" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 4.4l2.6 1.6v3.2L8 11.4 5.4 9.2V6L8 4.4Z" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      <path d="M8 2.5l4 2.4" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  bubble: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 13.5H14" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.5 13.5V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6" cy="9.5" r="2.2" stroke="#A3A8B3" strokeWidth="1.2" />
      <circle cx="11.2" cy="6" r="1.8" stroke="#A3A8B3" strokeWidth="1.2" />
      <circle cx="12.2" cy="11.6" r="1.4" stroke="#A3A8B3" strokeWidth="1.2" />
      <path d="M10.2 4.8h2" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  scatter: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 13.5H14" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.5 13.5V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6" cy="9" r="1" fill="#1677FF" />
      <circle cx="9" cy="6.8" r="1" fill="#A3A8B3" />
      <circle cx="11.8" cy="8.5" r="1" fill="#A3A8B3" />
    </svg>
  ),
  sankey: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.6" y="3" width="2.6" height="3" rx="1" fill="#A3A8B3" />
      <rect x="2.6" y="10" width="2.6" height="3" rx="1" fill="#A3A8B3" />
      <rect x="10.8" y="6.5" width="2.6" height="3" rx="1" fill="#A3A8B3" />
      <path d="M5.8 4.5c2.4 0 2.4 3.5 5 3.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.8 11.5c2.4 0 2.4-3.5 5-3.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.9 4.5c1.8 0 2.3 1.2 3.1 2.2" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
}

function inferSupportedChartTypes(r: MessageResult | null): Set<ChartTypeKey> {
  const supported = new Set<ChartTypeKey>()
  if (!r || r.status !== 'done') return supported
  if (r.metric) supported.add('metric')
  if (r.chartVariants && Object.keys(r.chartVariants).length) {
    const keys = Object.keys(r.chartVariants).join('|')
    if (/柱|bar/i.test(keys)) supported.add('bar')
    if (/折|line/i.test(keys)) supported.add('line')
    if (/饼|pie/i.test(keys)) supported.add('pie')
    if (/漏斗|funnel/i.test(keys)) supported.add('funnel')
    if (/雷达|radar/i.test(keys)) supported.add('radar')
    if (/气泡|bubble/i.test(keys)) supported.add('bubble')
    if (/散点|scatter/i.test(keys)) supported.add('scatter')
    if (/桑基|sankey/i.test(keys)) supported.add('sankey')
  } else if (r.chart) {
    supported.add('bar')
  }
  if (r.table) supported.add('bar')
  return supported
}

function inferDefaultChartType(r: MessageResult | null): ChartTypeKey {
  if (!r || r.status !== 'done') return 'bar'
  if (r.metric && !r.table && !r.chart) return 'metric'
  const cols = r.table?.columns ?? []
  const hasTime = cols.some((c) => /日期|时间|小时|月份|周|day|date|time/i.test(c))
  if (hasTime && (r.chartVariants?.折线图 || r.chartVariants?.['折线图'] || r.chartVariants?.['line'] || r.chartVariants?.['折线'])) return 'line'
  if (r.chartVariants?.柱状图 || r.chartVariants?.['柱状图'] || r.chartVariants?.['bar'] || r.chartVariants?.['柱图']) return 'bar'
  if (r.metric) return 'metric'
  return 'bar'
}

function parseNumberLike(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = String(v ?? '').trim()
  if (!s) return null
  const m = s.match(/-?\d+(?:\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  if (!Number.isFinite(n)) return null
  if (/亿/.test(s)) return n * 1e8
  if (/万/.test(s)) return n * 1e4
  if (/千/.test(s)) return n * 1e3
  return n
}

function buildDerivedChartOption(type: ChartTypeKey, r: MessageResult): EChartsOption | null {
  const table = r.table
  if (!table || table.columns.length < 2 || table.rows.length === 0) return null

  const dimCol = table.columns[0]
  const valCol = table.columns.find((c, idx) => idx !== 0 && table.rows.some((row) => parseNumberLike(row[c]) !== null)) ?? table.columns[1]

  const dim = table.rows.map((row) => String(row[dimCol] ?? ''))
  const vals = table.rows.map((row) => parseNumberLike(row[valCol]) ?? 0)

  if (type === 'bar') {
    return {
      grid: { left: 12, right: 10, top: 40, bottom: 52, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: dim,
        axisLabel: { opacity: 0.8, hideOverlap: true, rotate: dim.length > 6 ? 28 : 0, margin: 12 },
        axisLine: { lineStyle: { opacity: 0.35 } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLabel: { opacity: 0.75, margin: 8 },
        axisLine: { lineStyle: { opacity: 0.35 } },
        axisTick: { show: false },
        splitLine: { lineStyle: { opacity: 0.12 } },
      },
      series: [{ type: 'bar', data: vals, barWidth: 22, itemStyle: { borderRadius: [10, 10, 0, 0] } }],
    }
  }

  if (type === 'line') {
    return {
      grid: { left: 12, right: 10, top: 40, bottom: 52, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: dim,
        axisLabel: { opacity: 0.8, hideOverlap: true, rotate: dim.length > 6 ? 28 : 0, margin: 12 },
        axisLine: { lineStyle: { opacity: 0.35 } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLabel: { opacity: 0.75, margin: 8 },
        axisLine: { lineStyle: { opacity: 0.35 } },
        axisTick: { show: false },
        splitLine: { lineStyle: { opacity: 0.12 } },
      },
      series: [{ type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2 }, areaStyle: { opacity: 0.08 }, data: vals }],
    }
  }

  if (type === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['35%', '72%'],
          center: ['50%', '52%'],
          label: { show: false },
          labelLine: { show: false },
          data: dim.map((name, i) => ({ name, value: vals[i] })),
          itemStyle: { borderRadius: 8, borderWidth: 0 },
        },
      ],
    }
  }

  return null
}

type WorkspaceUi = {
  colorBgContainer: string
  colorSplit: string
  colorPrimary: string
  colorAccent2: string
  colorText: string
  colorTextSecondary: string
  colorFillSecondary: string
  colorFillTertiary: string
  colorFillQuaternary: string
}

function NeutralDashboardCanvas({
  selectedKey,
  onSelect,
  ui: uiOverride,
}: {
  selectedKey: string
  onSelect: (key: string, context: string) => void
  ui?: WorkspaceUi
}) {
  const { token } = theme.useToken()
  const ui: WorkspaceUi = uiOverride ?? {
    colorBgContainer: token.colorBgContainer,
    colorSplit: token.colorSplit,
    colorPrimary: token.colorPrimary,
    colorAccent2: token.colorInfo,
    colorText: token.colorText,
    colorTextSecondary: token.colorTextSecondary,
    colorFillSecondary: token.colorFillSecondary,
    colorFillTertiary: token.colorFillTertiary,
    colorFillQuaternary: token.colorFillQuaternary,
  }

  const cardRadius = 14

  const Card = ({
    k,
    context,
    active,
    children,
  }: {
    k: string
    context: string
    active: boolean
    children: ReactNode
  }) => (
    <div
      className="dashboardChartCard"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(k, context)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(k, context)
      }}
      style={{
        height: '100%',
        borderRadius: cardRadius,
        background: ui.colorBgContainer,
        border: `1px solid ${active ? ui.colorPrimary : ui.colorSplit}`,
        display: 'flex',
        flexDirection: 'column',
        padding: 14,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {children}
    </div>
  )

  const headerLeft = (icon: ReactNode, title: string) => (
    <div className="dashboardWidgetTitle" style={{ color: ui.colorTextSecondary }}>
      <span className="dashboardWidgetTitleIcon">{icon}</span>
      <span className="dashboardWidgetTitleText">{title}</span>
    </div>
  )

  const lineOption = useMemo((): EChartsOption => {
    const cats = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return {
      backgroundColor: 'transparent',
      grid: { left: 42, right: 18, top: 34, bottom: 34 },
      legend: {
        bottom: 6,
        itemWidth: 10,
        itemHeight: 8,
        textStyle: { color: ui.colorTextSecondary, fontSize: 11 },
        data: ['主系列', '对比系列'],
      },
      xAxis: {
        type: 'category',
        data: cats,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: ui.colorSplit, opacity: 0.7 } },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 30,
        splitNumber: 6,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 10 },
        splitLine: { lineStyle: { color: ui.colorSplit, opacity: 0.35 } },
      },
      series: [
        {
          name: '主系列',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: ui.colorPrimary },
          itemStyle: { color: ui.colorPrimary },
          areaStyle: { opacity: 0.06, color: ui.colorPrimary },
          data: [18, 20, 19, 22, 25, 27, 26],
        },
        {
          name: '对比系列',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: ui.colorAccent2, opacity: 0.95 },
          itemStyle: { color: ui.colorAccent2 },
          areaStyle: { opacity: 0.05, color: ui.colorAccent2 },
          data: [14, 15, 15, 16, 17, 18, 17],
        },
      ],
    }
  }, [ui.colorAccent2, ui.colorPrimary, ui.colorSplit, ui.colorTextSecondary])

  const radarOption = useMemo((): EChartsOption => {
    return {
      backgroundColor: 'transparent',
      legend: { bottom: 6, itemWidth: 10, itemHeight: 8, textStyle: { color: ui.colorTextSecondary, fontSize: 11 }, data: ['当前', '对标'] },
      radar: {
        radius: '62%',
        center: ['50%', '46%'],
        splitNumber: 4,
        indicator: [
          { name: '维度A', max: 100 },
          { name: '维度B', max: 100 },
          { name: '维度C', max: 100 },
          { name: '维度D', max: 100 },
          { name: '维度E', max: 100 },
        ],
        axisName: { color: ui.colorTextSecondary, fontSize: 11 },
        splitLine: { lineStyle: { color: ui.colorSplit, opacity: 0.5 } },
        splitArea: { areaStyle: { color: ['rgba(0,0,0,0.0)'] } },
        axisLine: { lineStyle: { color: ui.colorSplit, opacity: 0.35 } },
      },
      series: [
        {
          type: 'radar',
          data: [
            { name: '当前', value: [72, 58, 64, 52, 68] },
            { name: '对标', value: [60, 46, 58, 44, 54] },
          ],
          itemStyle: { borderWidth: 0 },
          lineStyle: { width: 2 },
          emphasis: { lineStyle: { width: 2 } },
          areaStyle: { opacity: 0.10 },
        },
      ],
      color: [ui.colorPrimary, ui.colorAccent2],
    }
  }, [ui.colorAccent2, ui.colorPrimary, ui.colorSplit, ui.colorTextSecondary])

  const barOption = useMemo((): EChartsOption => {
    const cats = ['产品A', '产品B', '产品C', '产品D', '产品E']
    return {
      backgroundColor: 'transparent',
      grid: { left: 42, right: 18, top: 34, bottom: 32 },
      xAxis: {
        type: 'category',
        data: cats,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: ui.colorSplit, opacity: 0.7 } },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 22,
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 10 },
        splitLine: { lineStyle: { color: ui.colorSplit, opacity: 0.35 } },
      },
      series: [
        {
          type: 'bar',
          data: [19, 15, 12, 10, 9],
          barWidth: 18,
          itemStyle: { color: ui.colorPrimary, borderRadius: [6, 6, 0, 0] },
        },
      ],
    }
  }, [ui.colorPrimary, ui.colorSplit, ui.colorTextSecondary])

  const bubbleOption = useMemo((): EChartsOption => {
    const data = [
      [10, 20, 18],
      [16, 36, 26],
      [26, 46, 14],
      [32, 28, 12],
      [40, 60, 34],
      [55, 46, 30],
    ]
    return {
      backgroundColor: 'transparent',
      grid: { left: 42, right: 18, top: 34, bottom: 32 },
      xAxis: {
        type: 'value',
        min: 0,
        max: 60,
        splitNumber: 6,
        axisLine: { lineStyle: { color: ui.colorSplit, opacity: 0.7 } },
        axisTick: { show: false },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 10 },
        splitLine: { lineStyle: { color: ui.colorSplit, opacity: 0.25 } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 60,
        splitNumber: 6,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: ui.colorTextSecondary, fontSize: 11, margin: 10 },
        splitLine: { lineStyle: { color: ui.colorSplit, opacity: 0.25 } },
      },
      series: [
        {
          type: 'scatter',
          data,
          symbolSize: (v: any) => Math.max(10, Math.min(42, Number(v?.[2] ?? 12) * 1.2)),
          itemStyle: {
            color: ui.colorPrimary,
            opacity: 0.55,
            borderColor: ui.colorPrimary,
            borderWidth: 1,
          },
        },
      ],
    }
  }, [ui.colorPrimary, ui.colorSplit, ui.colorTextSecondary])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gridTemplateRows: '110px minmax(0, 1fr) minmax(0, 1fr)',
          gap: 12,
        }}
      >
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <Card k="kpi-arpu-a" context="ARPU均值｜2025年3月｜上海" active={selectedKey === 'kpi-arpu-a'}>
            {headerLeft(<Sigma size={16} />, 'ARPU均值')}
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: ui.colorText, letterSpacing: 0.2 }}>¥182,346</div>
            <div style={{ height: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 650, color: '#1DD27F' }}>同比 +12.4%</div>
          </Card>
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <Card k="kpi-arpu-b" context="ARPU均值｜2025年3月｜上海" active={selectedKey === 'kpi-arpu-b'}>
            {headerLeft(<Sigma size={16} />, 'ARPU均值')}
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: ui.colorText, letterSpacing: 0.2 }}>¥182,346</div>
            <div style={{ height: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 650, color: '#1DD27F' }}>同比 +12.4%</div>
          </Card>
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <Card k="kpi-users" context="在贷用户数｜2025年3月｜上海" active={selectedKey === 'kpi-users'}>
            {headerLeft(<CircleDot size={16} />, '在贷用户数')}
            <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(-4px)' }} aria-label="在贷用户数 6894 万">
                {String(6894)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  .split('')
                  .map((ch, idx) =>
                    ch === ',' ? (
                      <span key={idx} style={{ fontWeight: 900, fontSize: 18, color: ui.colorTextSecondary, opacity: 0.8, marginInline: 2 }}>
                        ,
                      </span>
                    ) : (
                      <span key={idx} className="flipDigit">
                        {ch}
                      </span>
                    ),
                  )}
                <span style={{ fontSize: 12, fontWeight: 700, color: ui.colorTextSecondary, opacity: 0.8 }}>万</span>
              </div>
            </div>
          </Card>
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <Card k="kpi-progress" context="盘盈处理进度｜2025年3月｜上海" active={selectedKey === 'kpi-progress'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              {headerLeft(<Workflow size={16} />, '盘盈处理进度')}
              <span style={{ fontSize: 12, fontWeight: 700, color: ui.colorTextSecondary }}>78%</span>
            </div>
            <div style={{ height: 10 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 650, color: ui.colorTextSecondary }}>15.6k</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: ui.colorPrimary }}>↑</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 650, color: ui.colorTextSecondary }}>已完成</span>
            </div>
            <div style={{ height: 10 }} />
            <div style={{ height: 6, borderRadius: 99, background: ui.colorFillTertiary, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '78%', background: ui.colorPrimary, borderRadius: 99 }} />
            </div>
          </Card>
        </div>

        <div style={{ gridColumn: 'span 8', height: '100%' }}>
          <Card k="chart-gmv" context="GMV趋势｜2025年3月｜上海" active={selectedKey === 'chart-gmv'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              {headerLeft(<LineChart size={16} />, 'GMV 趋势')}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <EChart option={lineOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>
        <div style={{ gridColumn: 'span 4', height: '100%' }}>
          <Card k="chart-radar" context="能力雷达｜2025年3月｜上海" active={selectedKey === 'chart-radar'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              {headerLeft(<Radar size={16} />, '能力雷达')}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <EChart option={radarOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>

        <div style={{ gridColumn: 'span 6', height: '100%' }}>
          <Card k="chart-bar" context="品类对比｜2025年3月｜上海" active={selectedKey === 'chart-bar'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              {headerLeft(<BarChart3 size={16} />, '品类对比')}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <EChart option={barOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>
        <div style={{ gridColumn: 'span 6', height: '100%' }}>
          <Card k="chart-bubble" context="观点分布｜2025年3月｜上海" active={selectedKey === 'chart-bubble'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              {headerLeft(<ChartScatter size={16} />, '观点分布')}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <EChart option={bubbleOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

type StudioDebugPayload = {
  title?: string
  description?: string
  tables?: string[]
  layout?: StudioLayout
  appearance?: StudioAppearance
  slots?: Array<{ kind: WidgetKind | null; configText: string }>
}

const STUDIO_DEMO_PAYLOAD: StudioDebugPayload = {
  title: '指标看板',
  description: '覆盖核心指标、趋势与结构分布，用于日常运营监控。',
  tables: ['orders', 'users', 'events', 'products', 'sessions'],
  appearance: { language: 'zh-CN', timeZone: 'UTC+08:00', theme: 'cyber', chartPalette: 'deepsea' },
  layout: { mode: 'template', template: 'main-sub' },
  slots: [
    { kind: 'kpi', configText: JSON.stringify({ title: 'ARPU均值', format: 'currency', valueKey: 'arpu' }) },
    { kind: 'kpi', configText: JSON.stringify({ title: 'ARPU均值', format: 'currency', valueKey: 'arpu' }) },
    { kind: 'flip', configText: JSON.stringify({ title: '在网总用户数', unit: '万', value: 6894 }) },
    { kind: 'progress', configText: JSON.stringify({ title: '告警处理进度', value: 78, max: 100 }) },
    { kind: 'line', configText: JSON.stringify({ title: 'GMV 趋势', unit: '万', xKey: 'date', yKey: 'gmv' }) },
    { kind: 'radar', configText: JSON.stringify({ title: '能力雷达', indicators: ['维度A', '维度B', '维度C', '维度D', '维度E'], valueKey: 'score' }) },
    { kind: 'bar', configText: JSON.stringify({ title: '品类对比', unit: '万', xKey: 'category', yKey: 'gmv' }) },
    { kind: 'bubble', configText: JSON.stringify({ title: '散点分布', xKey: 'x', yKey: 'y', sizeKey: 'size' }) },
  ],
}

type StudioDatumSelection = {
  slotIdx: number
  kind: WidgetKind
  seriesIndex: number
  dataIndex: number
  offsetX: number
  offsetY: number
  name?: string
  seriesName?: string
  value?: unknown
  dataType?: string
  color?: string
}

function StudioDebugDashboardCanvas({
  payload,
  selectedCardIdx,
  selectedDatum,
  onCardSelect,
  onDatumSelect,
  selectionScope,
}: {
  payload: StudioDebugPayload
  selectedCardIdx: number | null
  selectedDatum: StudioDatumSelection | null
  onCardSelect: (slotIdx: number, context: string) => void
  onDatumSelect: (next: StudioDatumSelection | null, context: string) => void
  selectionScope: string
}) {
  const { token } = theme.useToken()

  const appearance = payload.appearance ?? { language: 'zh-CN', timeZone: 'Asia/Shanghai', theme: 'obsidian', chartPalette: 'cyber' }
  const layout = payload.layout ?? { mode: 'template', template: 'main-sub' }
  const palette = CHART_PALETTES[appearance.chartPalette] ?? CHART_PALETTES.cyber
  const themeColors = palette.colors ?? []
  const accent = appearance.theme === 'obsidian' ? token.colorPrimary : THEME_ACCENT[appearance.theme]

  const canvasBg = appearance.theme === 'obsidian' ? token.colorBgLayout : '#03060c'

  const surfaceBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'rgba(10, 16, 28, 0.86)'
        : appearance.theme === 'cyber'
          ? 'rgba(10, 15, 25, 0.82)'
          : 'rgba(10, 14, 24, 0.76)'

  const emptyBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'rgba(10, 16, 28, 0.72)'
        : appearance.theme === 'cyber'
          ? 'rgba(10, 15, 25, 0.72)'
          : 'rgba(10, 14, 24, 0.76)'

  const templatePositions = (tpl: Exclude<NonNullable<StudioLayout>['mode'], 'free'> extends never ? never : any) => {
    const t = String(tpl ?? '')
    if (t === 'main-sub') {
      return [
        { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 8, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 1, colSpan: 6, rowStart: 3, rowSpan: 1 },
        { colStart: 7, colSpan: 6, rowStart: 3, rowSpan: 1 },
      ]
    }
    if (t === 'matrix-10') {
      return [
        { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 7, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
        { colStart: 4, colSpan: 6, rowStart: 2, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
        { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
        { colStart: 4, colSpan: 6, rowStart: 3, rowSpan: 1 },
        { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
      ]
    }
    if (t === 'three-col') {
      return [
        { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 1, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 2, rowSpan: 1 },
      ]
    }
    if (t === 'analysis-7') {
      return [
        { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
        { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 2, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 2 },
        { colStart: 1, colSpan: 4, rowStart: 3, rowSpan: 1 },
        { colStart: 5, colSpan: 4, rowStart: 3, rowSpan: 1 },
        { colStart: 9, colSpan: 4, rowStart: 3, rowSpan: 1 },
      ]
    }
    return [
      { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 },
      { colStart: 4, colSpan: 6, rowStart: 1, rowSpan: 2 },
      { colStart: 10, colSpan: 3, rowStart: 1, rowSpan: 1 },
      { colStart: 1, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 2, rowSpan: 1 },
      { colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 4, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 7, colSpan: 3, rowStart: 3, rowSpan: 1 },
      { colStart: 10, colSpan: 3, rowStart: 3, rowSpan: 1 },
    ]
  }

  const optionForSlot = (kind: WidgetKind, name: string, unit: string): EChartsOption | null => {
    if (kind === 'bar') return buildBarOption(name, themeColors, unit)
    if (kind === 'bar-h') return buildHBarOption(name, themeColors, unit)
    if (kind === 'bar-stacked') return buildStackedBarOption(name, themeColors, unit)
    if (kind === 'bar-grouped') return buildGroupedBarOption(name, themeColors, unit)
    if (kind === 'bar-gradient') return buildGradientBarOption(name, themeColors, unit)
    if (kind === 'line') return buildLineOption(name, themeColors, unit)
    if (kind === 'line-area') return buildAreaOption(name, themeColors, unit)
    if (kind === 'line-curve') return buildCurveOption(name, themeColors, unit)
    if (kind === 'scatter') return buildScatterOption(name, themeColors)
    if (kind === 'bubble') return buildBubbleOption(name, themeColors)
    if (kind === 'pie') return buildPieOption(name, themeColors)
    if (kind === 'donut') return buildDonutOption(name, themeColors)
    if (kind === 'rose') return buildRoseOption(name, themeColors)
    if (kind === 'radar') return buildRadarOption(name, themeColors)
    if (kind === 'heatmap') return buildHeatmapOption(name, themeColors)
    if (kind === 'funnel') return buildFunnelOption(name, themeColors)
    if (kind === 'treemap') return buildTreemapOption(name, themeColors)
    if (kind === 'sankey') return buildSankeyOption(name, themeColors)
    if (kind === 'graph') return buildGraphOption(name, themeColors)
    if (kind === 'gauge') return buildGaugeOption(name, themeColors)
    if (kind === 'wave') return buildWaterOption(name, themeColors)
    return null
  }

  const enhanceSelectableOption = (kind: WidgetKind, opt: EChartsOption) => {
    return enhanceDashboardChartOption(kind, opt, { accent, mode: 'preview' })
  }

  const renderSlotBody = (idx: number, raw: { kind: WidgetKind | null; configText: string } | undefined) => {
    const kind = raw?.kind ?? null
    const parsed = (() => {
      try {
        return raw?.configText ? JSON.parse(raw.configText) : null
      } catch {
        return null
      }
    })()
    const chartTitle = String(parsed?.title ?? (kind ? KIND_NAME[kind] : ''))
    const dashboardTitle = String(payload.title ?? '').trim() || '仪表盘'
    const cardContext = `${dashboardTitle}｜${chartTitle || '图表'}`

    if (!kind) {
      return (
        <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: token.colorTextSecondary }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
            <div className="studioSlotAdd" style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center' }}>
              <CopyPlus size={20} />
            </div>
            <Typography.Text className="studioSlotHint" style={{ fontSize: 12, color: 'inherit', fontWeight: 600 }}>
              从左侧拖拽图表到此处
            </Typography.Text>
          </div>
        </div>
      )
    }

    if (kind === 'kpi') {
      const format = String(parsed?.format ?? 'currency')
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Space size={6}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 8,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: accent,
                }}
              >
                <Sigma size={14} />
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {chartTitle}
              </Typography.Text>
            </Space>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>{kpiValue(format)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Typography.Text style={{ fontSize: 12, color: '#22c55e' }}>同比 +12.4%</Typography.Text>
          </div>
        </div>
      )
    }

    if (kind === 'flip') {
      const baseRaw = Number(parsed?.value ?? 6_894)
      const base = Number.isFinite(baseRaw) ? baseRaw : 0
      const value = Math.max(0, Math.round(base))
      const unit = String(parsed?.unit ?? '次')
      return (
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Space size={4}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 8,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: accent,
                }}
              >
                <CircleDot size={14} />
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {chartTitle}
              </Typography.Text>
            </Space>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'grid', alignContent: 'center' }}>
            <FlipCounter title={chartTitle} unit={unit} target={value} showTitle={false} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span />
          </div>
        </div>
      )
    }

    if (kind === 'progress') {
      const pct = Math.max(0, Math.min(100, Number(parsed?.percent ?? 78) || 0))
      const v = String(parsed?.value ?? '15.6k')
      const unit = String(parsed?.unit ?? '个')
      const c0 = themeColors[0] ?? accent
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="studioSlotHeader" style={{ padding: '16px 16px 10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Space size={6} style={{ minWidth: 0 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: accent,
                    flex: '0 0 22px',
                  }}
                >
                  <Workflow size={14} />
                </span>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {chartTitle}
                </Typography.Text>
              </Space>
            </div>
          </div>
          <div style={{ padding: '0 16px 16px 16px', flex: 1, minHeight: 0, display: 'grid', alignContent: 'center', gap: 10 }}>
            <div style={{ position: 'relative', height: 6, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: c0, borderRadius: 3, boxShadow: `0 0 10px ${c0}66` }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 600 }}>
              <div style={{ color: c0, fontFamily: 'tabular-nums' }}>
                {v} {unit}
              </div>
              <div style={{ color: c0, fontFamily: 'tabular-nums' }}>{pct}%</div>
            </div>
          </div>
        </div>
      )
    }

    const unit = typeof parsed?.unit === 'string' ? String(parsed.unit) : ''
    const opt = optionForSlot(kind, chartTitle, unit)
    const finalOpt = opt ? enhanceSelectableOption(kind, opt) : null
    const renderOpt = finalOpt
    return opt ? (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="studioSlotHeader" style={{ padding: '12px 12px 8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Space size={4} style={{ minWidth: 0 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: accent,
                  flex: '0 0 28px',
                }}
              >
                {(() => {
                  const Icon =
                    kind === 'line'
                      ? LineChart
                      : kind === 'line-area'
                        ? AreaChart
                        : kind === 'line-curve'
                          ? LineChart
                          : kind === 'bar' || kind === 'bar-h' || kind === 'bar-grouped' || kind === 'bar-stacked' || kind === 'bar-gradient' || kind === 'waterfall'
                            ? BarChart3
                            : kind === 'pie'
                              ? PieChart
                              : kind === 'donut'
                                ? Donut
                                : kind === 'rose'
                                  ? Flower2
                                  : kind === 'scatter'
                                    ? ChartScatter
                                    : kind === 'bubble'
                                      ? Droplets
                                      : kind === 'funnel'
                                        ? Filter
                                        : kind === 'radar'
                                          ? Radar
                                          : kind === 'heatmap' || kind === 'treemap'
                                            ? Layers
                                            : kind === 'sankey' || kind === 'graph'
                                              ? Network
                                              : Activity
                  return <Icon size={16} />
                })()}
              </span>
              <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: 0.2 }}>{chartTitle}</Typography.Text>
            </Space>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, paddingTop: kind === 'funnel' ? 0 : 10 }}>
          <EChart
            option={renderOpt as any}
            selectionScope={selectionScope}
            selected={
              selectedDatum &&
              selectedDatum.slotIdx === idx &&
              kind !== 'sankey'
                ? { seriesIndex: selectedDatum.seriesIndex, dataIndex: selectedDatum.dataIndex }
                : null
            }
            pulseEnabled={kind !== 'sankey'}
            legendSingleLine
            onSelectedChange={kind === 'sankey' ? undefined : (next, click) => {
              if (!kind) return
              const pointKinds = new Set<WidgetKind>(['line', 'line-area', 'line-curve', 'bubble', 'scatter'])
              const blockKinds = new Set<WidgetKind>([
                'bar',
                'bar-h',
                'bar-grouped',
                'bar-stacked',
                'bar-gradient',
                'pie',
                'donut',
                'rose',
                'funnel',
                'sankey',
              ])
              const labelKind = pointKinds.has(kind) ? '数据点' : blockKinds.has(kind) ? '数据块' : '数据点'
              const nameText = String(click.name ?? click.seriesName ?? '').trim()
              const v = click.value
              const valueText = Array.isArray(v) ? v.map((x) => String(x)).join(', ') : String(v ?? '').trim()
              const detail =
                nameText && valueText ? `${labelKind}：${nameText}=${valueText}` : nameText ? `${labelKind}：${nameText}` : valueText ? `${labelKind}：${valueText}` : labelKind
              const ctx = `${cardContext}｜${detail}`
              if (!next) {
                onDatumSelect(null, ctx)
                return
              }
              const ox = typeof click.offsetX === 'number' ? click.offsetX : 0
              const oy = typeof click.offsetY === 'number' ? click.offsetY : 0
              onDatumSelect(
                {
                  slotIdx: idx,
                  kind,
                  seriesIndex: next.seriesIndex,
                  dataIndex: next.dataIndex,
                  offsetX: ox,
                  offsetY: oy,
                  name: click.name,
                  seriesName: click.seriesName,
                  value: click.value,
                  dataType: click.dataType,
                  color: click.color,
                },
                ctx,
              )
            }}
          />
        </div>
      </div>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
    )
  }

  const slots = Array.isArray(payload.slots) ? payload.slots : []
  const positions =
    layout.mode === 'free'
      ? (layout.cards ?? []).map((c) => ({ ...c }))
      : templatePositions((layout as any).template)

  const freeRows = layout.mode === 'free' ? Math.max(2, Math.min(24, Math.floor((layout as any).rows || 8))) : 0
  const gridRows =
    layout.mode === 'template'
      ? (layout as any).template === 'main-sub' || (layout as any).template === 'matrix-10'
        ? '140px minmax(0, 1fr) minmax(0, 1fr)'
        : (layout as any).template === 'three-col'
          ? 'minmax(0, 1fr) minmax(0, 1fr)'
          : 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'
      : `repeat(${freeRows}, minmax(0, 1fr))`

  const gap = layout.mode === 'free' ? Math.max(8, Math.min(32, Number((layout as any).gap ?? 16))) : 10

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: canvasBg }}>
      <div style={{ flex: 1, minHeight: 0, padding: 0 }}>
        <div
          style={{
            height: '100%',
            minHeight: 0,
            borderRadius: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 16,
            border: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 'none' : `1px solid ${token.colorSplit}`,
            background: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? canvasBg : 'rgba(8, 12, 22, 0.70)',
            overflow: 'auto',
            padding: 0,
            backdropFilter: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? undefined : 'blur(14px)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
              height: '100%',
              gridTemplateRows: gridRows,
              gap,
              padding: gap,
              background: canvasBg,
              alignItems: 'stretch',
              minHeight: 0,
            }}
          >
            {positions.map((pos: any, idx: number) => {
              const raw = slots[idx]
              const kind = raw?.kind ?? null
              const borderColor = kind ? token.colorSplit : token.colorSplit
              const isActive = Boolean(kind) && selectedCardIdx === idx
              return (
                <div
                  key={idx}
                  className={`studioSlot${kind ? ' studioSlotFilled dashboardChartCard' : ' studioSlotEmpty'}`}
                  role={kind ? 'button' : undefined}
                  tabIndex={kind ? 0 : undefined}
                  onClick={() => {
                    if (!kind) return
                    const parsed = (() => {
                      try {
                        return raw?.configText ? JSON.parse(raw.configText) : null
                      } catch {
                        return null
                      }
                    })()
                    const chartTitle = String(parsed?.title ?? KIND_NAME[kind] ?? '图表')
                    const dashboardTitle = String(payload.title ?? '').trim() || '仪表盘'
                    onCardSelect(idx, `${dashboardTitle}｜${chartTitle}`)
                  }}
                  onKeyDown={(e) => {
                    if (!kind) return
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    const parsed = (() => {
                      try {
                        return raw?.configText ? JSON.parse(raw.configText) : null
                      } catch {
                        return null
                      }
                    })()
                    const chartTitle = String(parsed?.title ?? KIND_NAME[kind] ?? '图表')
                    const dashboardTitle = String(payload.title ?? '').trim() || '仪表盘'
                    onCardSelect(idx, `${dashboardTitle}｜${chartTitle}`)
                  }}
                  style={{
                    ['--studio-accent' as any]: accent,
                    gridColumn: `${pos.colStart} / span ${pos.colSpan}`,
                    gridRow: `${pos.rowStart} / span ${pos.rowSpan}`,
                    height: '100%',
                    borderRadius: 14,
                    border: kind ? `${isActive ? 2 : 1}px solid ${isActive ? accent : borderColor}` : `1px dashed ${borderColor}`,
                    background: kind ? surfaceBg : emptyBg,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: kind ? 'pointer' : 'default',
                    boxShadow: isActive ? `0 0 0 1px ${accent}66, 0 14px 44px rgba(0,0,0,0.26)` : undefined,
                  }}
                >
                  {renderSlotBody(idx, raw)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  at: number
  question?: string
  result?: MessageResult
}

type Session = {
  id: string
  name: string
  messages: ChatMessage[]
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseStudioAppearanceFromConfig(configText: string | undefined | null): StudioAppearance | null {
  if (!configText) return null
  try {
    const obj: any = JSON.parse(configText)
    const a = obj?.appearance
    if (!a || typeof a !== 'object') return null
    const language = a.language === 'en-US' ? 'en-US' : 'zh-CN'
    const timeZone = typeof a.timeZone === 'string' && a.timeZone.trim() ? a.timeZone : 'Asia/Shanghai'
    const theme = a.theme === 'obsidian' || a.theme === 'cyber' || a.theme === 'tech' ? a.theme : 'cyber'
    const rawPalette = typeof a.chartPalette === 'string' ? a.chartPalette : ''
    const normalizedPalette = rawPalette === 'tech' ? 'deepsea' : rawPalette
    const chartPalette = (normalizedPalette as any) in CHART_PALETTES ? (normalizedPalette as any) : 'cyber'
    return { language, timeZone, theme, chartPalette }
  } catch {
    const text = String(configText)
    const pick = (re: RegExp) => {
      const m = re.exec(text)
      return m ? String(m[1] ?? '').trim() : ''
    }
    const rawLang = pick(/"language"\s*:\s*"([^"]+)"/)
    const rawTz = pick(/"timeZone"\s*:\s*"([^"]+)"/)
    const rawTheme = pick(/"theme"\s*:\s*"([^"]+)"/)
    const rawPalette = pick(/"chartPalette"\s*:\s*"([^"]+)"/)
    if (!rawLang && !rawTz && !rawTheme && !rawPalette) return null

    const language = rawLang === 'en-US' ? 'en-US' : 'zh-CN'
    const timeZone = rawTz ? rawTz : 'Asia/Shanghai'
    const theme = rawTheme === 'obsidian' || rawTheme === 'cyber' || rawTheme === 'tech' ? (rawTheme as any) : 'cyber'
    const normalizedPalette = rawPalette === 'tech' ? 'deepsea' : rawPalette
    const chartPalette = (normalizedPalette as any) in CHART_PALETTES ? (normalizedPalette as any) : 'cyber'
    return { language, timeZone, theme, chartPalette }
  }
}

function hexToRgb(hex: string) {
  const s = String(hex || '').trim().replace('#', '')
  if (s.length !== 6) return null
  const r = Number.parseInt(s.slice(0, 2), 16)
  const g = Number.parseInt(s.slice(2, 4), 16)
  const b = Number.parseInt(s.slice(4, 6), 16)
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null
  return { r, g, b }
}

function rgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export default function DashboardChatWorkspaceStudioDemoPage() {
  const { token } = theme.useToken()
  const selectionScopeRef = useRef(`workspace_${Math.random().toString(36).slice(2)}`)

  const dashboards = useDashboardsStore((s) => s.items)

  const debugStudio = true

  const dashboardId = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return String(new URLSearchParams(window.location.search).get('dashboardId') ?? '').trim()
  }, [])

  const qsAppearance = useMemo((): StudioAppearance | null => {
    if (typeof window === 'undefined') return null
    const qs = new URLSearchParams(window.location.search)
    const rawTheme = String(qs.get('theme') ?? '').trim()
    const rawPalette = String(qs.get('chartPalette') ?? '').trim()
    if (!rawTheme && !rawPalette) return null
    const theme = rawTheme === 'obsidian' || rawTheme === 'cyber' || rawTheme === 'tech' ? (rawTheme as any) : 'cyber'
    const normalizedPalette = rawPalette === 'tech' ? 'deepsea' : rawPalette
    const chartPalette = (normalizedPalette as any) in CHART_PALETTES ? (normalizedPalette as any) : 'cyber'
    return { language: 'zh-CN', timeZone: 'Asia/Shanghai', theme, chartPalette }
  }, [])

  const dashboardAppearance = useMemo(() => {
    if (!dashboardId) return null
    const item = dashboards.find((x) => x.id === dashboardId)
    return parseStudioAppearanceFromConfig(item?.configText ?? null)
  }, [dashboardId, dashboards])

  const [studioPayload] = useState<StudioDebugPayload | null>(() => STUDIO_DEMO_PAYLOAD)

  const panelAppearance = debugStudio ? studioPayload?.appearance : qsAppearance ?? dashboardAppearance
  const panelTheme = panelAppearance?.theme === 'obsidian' || panelAppearance?.theme === 'cyber' || panelAppearance?.theme === 'tech' ? panelAppearance.theme : null
  const panelPalette = panelAppearance?.chartPalette
  const previewPalette = panelPalette ? CHART_PALETTES[panelPalette] : null
  const panelAccent = previewPalette?.colors?.[0] ?? (panelTheme === 'obsidian' ? token.colorPrimary : panelTheme ? THEME_ACCENT[panelTheme] : token.colorPrimary)
  const panelTint = previewPalette?.colors?.[0] ?? (panelTheme ? THEME_ACCENT[panelTheme] : null)

  const workspaceUi = useMemo((): WorkspaceUi | null => {
    if (!panelTheme) return null
    const tint = panelTint ?? THEME_ACCENT[panelTheme]
    const accent2 = previewPalette?.colors?.[1] ?? '#26D9FF'
    return {
      colorBgContainer: rgba(tint, panelTheme === 'tech' ? 0.10 : 0.09),
      colorSplit: 'rgba(255,255,255,0.10)',
      colorPrimary: panelAccent,
      colorAccent2: accent2,
      colorText: 'rgba(255, 255, 255, 0.92)',
      colorTextSecondary: 'rgba(255, 255, 255, 0.72)',
      colorFillSecondary: 'rgba(255, 255, 255, 0.10)',
      colorFillTertiary: 'rgba(255, 255, 255, 0.06)',
      colorFillQuaternary: 'rgba(255, 255, 255, 0.04)',
    }
  }, [panelAccent, panelTheme, panelTint, previewPalette])

  const chatTheme = useMemo(() => {
    if (!panelTheme) {
      return {
        chatBg: token.colorBgContainer,
        panelBorder: token.colorSplit,
        resultBg: token.colorBgContainer,
        chartBg: token.colorBgContainer,
        inputBg: token.colorFillSecondary,
        inputFocusBg: token.colorFillTertiary,
        llmBg: token.colorFillTertiary,
        llmText: token.colorText,
        antText: token.colorText,
        antTextSecondary: token.colorTextSecondary,
        antTextTertiary: token.colorTextTertiary,
        antTextQuaternary: token.colorTextQuaternary,
      }
    }

    const themeBase =
      panelTheme === 'obsidian'
        ? { chatBg: 'rgba(10, 14, 22, 0.97)', panelBorder: 'rgba(255,255,255,0.10)' }
        : panelTheme === 'tech'
          ? { chatBg: 'rgba(5, 14, 30, 0.97)', panelBorder: 'rgba(255,255,255,0.10)' }
          : { chatBg: 'rgba(6, 10, 20, 0.97)', panelBorder: 'rgba(255,255,255,0.10)' }

    const tint = panelTint ?? THEME_ACCENT[panelTheme]
    const llmBg = rgba(tint, panelTheme === 'tech' ? 0.10 : 0.09)
    const inputBg = rgba(tint, panelTheme === 'tech' ? 0.12 : 0.11)
    const inputFocusBg = rgba(tint, panelTheme === 'tech' ? 0.16 : 0.14)
    const chartBg =
      panelTheme === 'cyber' ? 'rgba(0, 0, 0, 0.28)' : panelTheme === 'tech' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(0, 0, 0, 0.22)'

    return {
      chatBg: themeBase.chatBg,
      panelBorder: themeBase.panelBorder,
      chartBg,
      inputBg,
      inputFocusBg,
      llmBg,
      llmText: 'rgba(255, 255, 255, 0.92)',
      antText: 'rgba(255, 255, 255, 0.92)',
      antTextSecondary: 'rgba(255, 255, 255, 0.72)',
      antTextTertiary: 'rgba(255, 255, 255, 0.52)',
      antTextQuaternary: 'rgba(255, 255, 255, 0.40)',
    }
  }, [panelTheme, panelTint, token])

  const debugStudioBg = panelTheme === 'obsidian' ? '#0B0E14' : '#03060c'

  const debugStudioGap = useMemo(() => {
    const layout: any = (studioPayload as any)?.layout
    if (!debugStudio || !layout) return 0
    const mode = String(layout.mode ?? '')
    if (mode === 'free') return Math.max(8, Math.min(32, Number(layout.gap ?? 16)))
    return 10
  }, [debugStudio, studioPayload])

  const sessionRowClass = 'sessionRow'
  const sessionActionsClass = 'sessionActions'

  const actionButtonBoxStyle = {
    background: panelTheme ? 'rgba(255,255,255,0.06)' : token.colorFillTertiary,
    borderRadius: 10,
    height: 28,
    width: 28,
    padding: 0,
    display: 'grid',
    placeItems: 'center',
  } as const

  const [model, setModel] = useState<'deepseek-v3' | 'deepseek-r1' | 'qwen3.6'>('deepseek-v3')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const timerRef = useRef<number | null>(null)

  const [activeResult, setActiveResult] = useState<MessageResult | null>(null)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [chartType, setChartType] = useState<ChartTypeKey>('bar')
  const [sqlOpen, setSqlOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportName, setExportName] = useState('')
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel')

  const [datasetsPreviewOpen, setDatasetsPreviewOpen] = useState(false)
  const [datasetsPreviewActive, setDatasetsPreviewActive] = useState('')

  const [selectedDashboardKey, setSelectedDashboardKey] = useState('')
  const [studioSelectedCardIdx, setStudioSelectedCardIdx] = useState<number | null>(null)
  const [studioSelectedDatum, setStudioSelectedDatum] = useState<StudioDatumSelection | null>(null)

  useEffect(() => {
    const handle = (e: any) => {
      const d = e?.detail
      if (!d) return
      if (d.scope && d.scope === selectionScopeRef.current) return
      setStudioSelectedCardIdx(null)
      setStudioSelectedDatum(null)
      setSelectedDashboardKey('')
    }
    window.addEventListener(GLOBAL_SELECTION_EVENT, handle as any)
    return () => window.removeEventListener(GLOBAL_SELECTION_EVENT, handle as any)
  }, [])

  const [sessionEditId, setSessionEditId] = useState<string>('')
  const [sessionEditName, setSessionEditName] = useState<string>('')

  const [deleteSession, setDeleteSession] = useState<{ id: string; name: string } | null>(null)

  const [runningVisible, setRunningVisible] = useState(false)
  const runningUntilRef = useRef(0)
  const pendingDoneRef = useRef<MessageResult | null>(null)
  const finishTimerRef = useRef<number | null>(null)
  const pendingMessagesRef = useRef<ChatMessage[] | null>(null)

  const [panelWidth, setPanelWidth] = useState(420)
  const [layoutWidth, setLayoutWidth] = useState(0)
  const leftSafeWidth = 720
  const rightMinWidth = 420
  const rightMaxWidth = 960
  const dividerWidth = 10
  const layoutPaddingX = debugStudio ? 0 : 10
  const layoutGap = debugStudio ? 0 : 2
  const dockedMaxWidth = useMemo(() => {
    if (!layoutWidth) return rightMaxWidth
    const available = layoutWidth - layoutPaddingX * 2 - dividerWidth - layoutGap * 2 - leftSafeWidth
    return Math.min(rightMaxWidth, Math.max(rightMinWidth, Math.floor(available)))
  }, [dividerWidth, layoutGap, layoutPaddingX, layoutWidth, leftSafeWidth, rightMaxWidth, rightMinWidth])
  const isOverlay = panelWidth > dockedMaxWidth
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatPanelRef = useRef<HTMLDivElement | null>(null)
  const [leftLockedWidth, setLeftLockedWidth] = useState<number | null>(null)

  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false)

  const resetConversationState = () => {
    setActiveResult(null)
    setView('chart')
    setChartType('bar')
    setInput('')
    setSending(false)
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const [sessions, setSessions] = useState<Session[]>(() => [])
  const [activeSessionId, setActiveSessionId] = useState<string>('')

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeSessionId) ?? undefined, [activeSessionId, sessions])


  const quickPromptPool = useMemo(
    () => [
      '无线端下单的总金额是多少？',
      '按渠道/城市/品类拆分验证',
      '来源名称为测试来源2.5的无线端下单金额最大值',
      '本周订单金额为什么下降？',
      '今天新增用户数是多少？',
      '本月GMV环比变化如何？',
      '新老客贡献占比是多少？',
      'Top10商品销售额排行',
      '按城市拆分看转化率',
      '退款金额占比与原因分布',
      '渠道投放ROI表现',
      '活跃用户留存趋势',
    ],
    [],
  )
  const [quickSeed, setQuickSeed] = useState(0)
  const [quickOpen, setQuickOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const quickPanelRef = useRef<HTMLDivElement | null>(null)
  const quickTriggerRef = useRef<HTMLButtonElement | null>(null)
  const modelTriggerRef = useRef<HTMLButtonElement | null>(null)
  const quickPrompts = useMemo(() => {
    const size = 5
    const out: string[] = []
    const start = (quickSeed * size) % Math.max(1, quickPromptPool.length)
    for (let i = 0; i < size; i += 1) {
      out.push(quickPromptPool[(start + i) % quickPromptPool.length])
    }
    return out
  }, [quickPromptPool, quickSeed])


  const modelOptions = useMemo(
    () => [
      {
        key: 'deepseek-v3' as const,
        label: 'DeepSeek-V3',
        logoUrl: '/vendor/deepseek.png',
      },
      {
        key: 'deepseek-r1' as const,
        label: 'DeepSeek-R1',
        logoUrl: '/vendor/deepseek.png',
      },
      {
        key: 'qwen3.6' as const,
        label: 'Qwen3.6',
        logoUrl: '/vendor/Qwen.png',
      },
    ],
    [],
  )
  const currentModel = useMemo(() => modelOptions.find((x) => x.key === model) ?? modelOptions[0], [model, modelOptions])

  const datasetOptions = useMemo(() => ['subs', 'cdr_voice', 'cdr_data', 'billing_monthly', 'network_kpi_daily'], [])

  const NeutralModelIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path
        d="M10 2.6 15.9 6v8L10 17.4 4.1 14V6L10 2.6Z"
        stroke={token.colorTextSecondary}
        strokeWidth="1.35"
        opacity="0.9"
        strokeLinejoin="round"
      />
      <path d="M4.1 6 10 9.4 15.9 6" stroke={token.colorTextSecondary} strokeWidth="1.35" opacity="0.55" strokeLinejoin="round" />
      <path d="M10 9.4v8" stroke={token.colorTextSecondary} strokeWidth="1.35" opacity="0.55" strokeLinecap="round" />
      <circle cx="10" cy="9.4" r="1.1" fill={token.colorPrimary} opacity="0.9" />
    </svg>
  )

  const ModelLogo = ({ url, label }: { url: string; label: string }) => (
    <img
      src={url}
      alt={label}
      width={18}
      height={18}
      loading="lazy"
      referrerPolicy="no-referrer"
      style={{
        display: 'block',
        objectFit: 'contain',
        opacity: 0.95,
      }}
    />
  )

  const bubbleMaxWidth = useMemo(() => {
    const usable = Math.max(280, panelWidth - 84)
    return Math.min(640, usable)
  }, [panelWidth])

  const buildSummaryAndNext = (r: MessageResult) => {
    const summary: string[] = []
    const next: string[] = []
    if (r.metric) {
      summary.push(
        `本次结果显示 **${r.metric.label}** 为 **${r.metric.value}**，建议同步确认时间范围、去重口径与是否包含退款/补贴等边界条件，确保与业务侧对同一指标的理解一致，从而避免口径差异导致的解读偏差。`,
      )
      next.push(
        '可从业务维度补充拆分与对比口径，例如按 **渠道/城市/品类/新老客/设备类型** 拆分结构贡献，并结合 **同比/环比/活动前后/节假日** 做对比观察，用于判断增长来自结构变化还是整体波动。',
      )
      return { summary, next }
    }

    const table = r.table
    if (table && table.columns.length >= 2 && table.rows.length) {
      const dimCol = table.columns[0]
      const valCol = table.columns.find((c, idx) => idx !== 0 && table.rows.some((row) => parseNumberLike(row[c]) !== null)) ?? table.columns[1]
      const top = table.rows
        .map((row) => ({ dim: String(row[dimCol] ?? ''), valRaw: row[valCol], val: parseNumberLike(row[valCol]) ?? -Infinity }))
        .sort((a, b) => b.val - a.val)[0]
      if (top?.dim) {
        summary.push(
          `按 **${dimCol}** 拆分后，Top 为 **${top.dim}**（**${String(top.valRaw ?? '')}**）。建议同步补充维度含义、指标单位与是否含税/含券等说明，避免将口径差异误判为真实业务差异，从而影响后续分析结论的可复用性。`,
        )
        next.push(
          '围绕业务结构补充拆分与交叉维度，例如按 **渠道/城市/品类/人群分层** 进行结构拆分，并做 **渠道×城市、品类×渠道、人群×品类** 交叉对比，用于定位主要贡献来源与结构性异常。',
        )
      }
    }

    if (summary.length === 0) summary.push('已生成可视化结果，建议补充指标口径与维度含义说明，以便在不同场景下复用并保持一致的解释标准。')
    if (next.length === 0) next.push('可从业务维度按 **渠道/城市/品类** 做结构拆分，并结合 **同比/环比** 做对比观察，用于定位结构贡献与趋势变化。')
    return { summary, next }
  }

  const upsertSession = (id: string, patch: Partial<Session>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  useEffect(() => {
    if (!activeSessionId && sessions[0]?.id) setActiveSessionId(sessions[0].id)
  }, [activeSessionId, sessions])

  const scrollChatToBottom = () => {
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight })
  }

  useEffect(() => {
    window.setTimeout(() => scrollChatToBottom(), 0)
  }, [activeSessionId, activeSession?.messages?.length, runningVisible])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const inQuick = !!quickPanelRef.current?.contains(t)
      const inQuickBtn = !!quickTriggerRef.current?.contains(t as any)
      const inModelBtn = !!modelTriggerRef.current?.contains(t as any)
      const inModelMenu = !!t.closest('.modelMenu')
      if (!inQuick && !inQuickBtn) setQuickOpen(false)
      if (!inModelMenu && !inModelBtn) setModelOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [])

  const renderEmphasis = (text: string) => {
    const parts = String(text ?? '').split('**')
    return (
      <>
        {parts.map((p, idx) =>
          idx % 2 === 1 ? (
            <span key={idx} style={{ fontWeight: 650 }}>
              {p}
            </span>
          ) : (
            <span key={idx}>{p}</span>
          ),
        )}
      </>
    )
  }

  const send = async (q: string) => {
    if (sending) return
    const question = q.trim()
    if (!question) return
    setSending(true)

    runningUntilRef.current = Date.now() + 3000
    setRunningVisible(true)
    pendingDoneRef.current = null
    pendingMessagesRef.current = null
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }
    setActiveResult({ status: 'running', answerText: '分析中…' })

    const userMsg: ChatMessage = { id: nowId(), role: 'user', content: question, at: Date.now() }
    let sessionId = activeSession?.id ?? ''

    if (!sessionId) {
      const s: Session = { id: nowId(), name: '未命名会话', messages: [userMsg] }
      sessionId = s.id
      setSessions((prev) => [s, ...prev])
      setActiveSessionId(s.id)
    }

    const existingMessages = (sessions.find((s) => s.id === sessionId)?.messages ?? activeSession?.messages ?? [])
    const previousMessages = existingMessages.filter((m) => {
      if (m.role !== 'assistant') return true
      if (m.content === '分析完成') return false
      if (!String(m.content ?? '').trim()) return false
      return true
    })
    const baseMessages = sessionId ? [...previousMessages, userMsg] : [userMsg]
    upsertSession(sessionId, { messages: baseMessages })

    const isFirstUser = !previousMessages.some((m) => m.role === 'user')
    if (isFirstUser) {
      const name = question.replace(/\s+/g, ' ').slice(0, 18)
      if (name) upsertSession(sessionId, { name })
    }

    const startedAt = Date.now()
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const result = buildMockResult(question)
      const took = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      
      if (result.status === 'clarifying') {
        const botMsg: ChatMessage = { id: nowId(), role: 'assistant', content: result.answerText, at: Date.now(), question, result: { status: 'clarifying', answerText: result.answerText } }
        pendingDoneRef.current = { status: 'clarifying', answerText: result.answerText }
        pendingMessagesRef.current = [...baseMessages, botMsg]
        timerRef.current = null

        const now = Date.now()
        const wait = Math.max(0, runningUntilRef.current - now)
        if (wait > 0) {
          finishTimerRef.current = window.setTimeout(() => {
            setRunningVisible(false)
            const pendingMsgList = pendingMessagesRef.current
            pendingMessagesRef.current = null
            if (pendingMsgList) upsertSession(sessionId, { messages: pendingMsgList })

            const pending = pendingDoneRef.current
            pendingDoneRef.current = null
            finishTimerRef.current = null
            if (pending) setActiveResult(pending)
            setSending(false)
          }, wait)
        } else {
          setRunningVisible(false)
          const pendingMsgList = pendingMessagesRef.current
          pendingMessagesRef.current = null
          if (pendingMsgList) upsertSession(sessionId, { messages: pendingMsgList })
          const pending = pendingDoneRef.current
          pendingDoneRef.current = null
          if (pending) setActiveResult(pending)
          setSending(false)
        }
        return
      }

      const doneResult: MessageResult = { ...result, status: 'done', tookMs: took * 1000 }
      const botMsg: ChatMessage = {
        id: nowId(),
        role: 'assistant',
        content: String(result.answerText ?? ''),
        at: Date.now(),
        question,
        result: doneResult,
      }
      const now = Date.now()
      const wait = Math.max(0, runningUntilRef.current - now)
      if (wait > 0) {
        pendingDoneRef.current = doneResult
        pendingMessagesRef.current = [...baseMessages, botMsg]
        finishTimerRef.current = window.setTimeout(() => {
          setRunningVisible(false)
          const pendingMsgList = pendingMessagesRef.current
          pendingMessagesRef.current = null
          if (pendingMsgList) upsertSession(sessionId, { messages: pendingMsgList })
          const pending = pendingDoneRef.current
          pendingDoneRef.current = null
          finishTimerRef.current = null
          if (pending) setActiveResult(pending)
          setSending(false)
        }, wait)
      } else {
        setRunningVisible(false)
        upsertSession(sessionId, { messages: [...baseMessages, botMsg] })
        setActiveResult(doneResult)
        setSending(false)
      }

      setChartType(inferDefaultChartType(doneResult))
      setView('chart')
      timerRef.current = null
    }, 1200)
  }

  const runPresetAnalysis = (context: string) => {
    if (sending) return
    const ctx = String(context ?? '').trim()
    if (!ctx) return

    let sid = activeSessionId
    if (!sid) {
      const s: Session = { id: nowId(), name: '未命名会话', messages: [] }
      setSessions((prev) => [s, ...prev])
      setActiveSessionId(s.id)
      sid = s.id
    }

    setSessions((prev) => prev.map((s) => (s.id === sid && (!s.name || /^会话\d+$/.test(s.name) || s.name === '未命名会话') ? { ...s, name: ctx } : s)))

    setSending(true)
    runningUntilRef.current = Date.now() + 3000
    setRunningVisible(true)
    setActiveResult({ status: 'running', answerText: '正在分析问题...' })

    const answerText =
      '已为你自动进入分析状态，并锁定当前上下文：\n' +
      `「${ctx}」\n\n` +
      '系统已基于该范围完成关键指标计算与初步分析：\n' +
      '- 本月销售额：¥XXX\n' +
      '- 环比增长：+18%（较2月）\n' +
      '- 同比增长：+25%（较去年3月）\n' +
      '- 当前排名：全国第2\n\n' +
      '初步发现：\n' +
      '该时间点销售额存在明显增长\n\n' +
      '您可以继续追问：'

    const startedAt = Date.now()
    window.setTimeout(() => {
      const took = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const doneResult: MessageResult = {
        status: 'done',
        answerText,
        tookMs: took * 1000,
      }
      const botMsg: ChatMessage = { id: nowId(), role: 'assistant', content: answerText, at: Date.now(), question: ctx, result: doneResult }

      const now = Date.now()
      const wait = Math.max(0, runningUntilRef.current - now)
      if (wait > 0) {
        pendingDoneRef.current = doneResult
        pendingMessagesRef.current = [...(activeSession?.messages ?? []), botMsg]
        finishTimerRef.current = window.setTimeout(() => {
          setRunningVisible(false)
          const pendingMsgList = pendingMessagesRef.current
          pendingMessagesRef.current = null
          if (pendingMsgList) setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: pendingMsgList } : s)))
          const pending = pendingDoneRef.current
          pendingDoneRef.current = null
          finishTimerRef.current = null
          if (pending) setActiveResult(pending)
          setSending(false)
        }, wait)
      } else {
        setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: [...(s.messages ?? []), botMsg] } : s)))
        setActiveResult(doneResult)
        setRunningVisible(false)
        setSending(false)
      }
    }, 1200)
  }

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    }
  }, [])

  const stop = () => {
    if (!sending && !runningVisible) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    finishTimerRef.current = null
    pendingDoneRef.current = null
    pendingMessagesRef.current = null
    setRunningVisible(false)
    setSending(false)
    setActiveResult({ status: 'stopped', answerText: '已停止' })
    const botMsg: ChatMessage = { id: nowId(), role: 'assistant', content: '已停止', at: Date.now() }
    if (!activeSession?.id) return
    upsertSession(activeSession.id, { messages: [...(activeSession.messages ?? []), botMsg] })
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const el = layoutRef.current
    if (!el) return
    const compute = () => setLayoutWidth(Math.floor(el.getBoundingClientRect().width))
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!isOverlay) {
      setLeftLockedWidth(null)
      return
    }
    if (!layoutWidth) return
    const locked = Math.max(leftSafeWidth, Math.floor(layoutWidth - layoutPaddingX * 2 - dividerWidth - layoutGap * 2 - dockedMaxWidth))
    setLeftLockedWidth(locked)
  }, [dockedMaxWidth, dividerWidth, isOverlay, layoutGap, layoutPaddingX, layoutWidth, leftSafeWidth])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = dragRef.current.startX - e.clientX
      const layoutW = layoutRef.current?.getBoundingClientRect().width
      const maxW = Math.min(rightMaxWidth, Math.max(520, (layoutW ?? 1200) - 24))
      const next = Math.min(maxW, Math.max(rightMinWidth, dragRef.current.startWidth + dx))
      setPanelWidth(next)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const dx = dragRef.current.startX - e.clientX
      const layoutW = layoutRef.current?.getBoundingClientRect().width
      const maxW = Math.min(rightMaxWidth, Math.max(520, (layoutW ?? 1200) - 24))
      const next = Math.min(maxW, Math.max(rightMinWidth, dragRef.current.startWidth + dx))
      setPanelWidth(next)
    }
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const safeFileStem = (name: string) => {
    const s = String(name ?? '').trim()
    const cleaned = s.replace(/[\\/:*?"<>|\n\r]+/g, '_').replace(/\s+/g, ' ').trim()
    return cleaned || '导出结果'
  }

  const todayYmd = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
  }

  const nextDailySeq = () => {
    const key = `chatbi-export-seq:${todayYmd()}`
    const cur = Number.parseInt(localStorage.getItem(key) ?? '0', 10) || 0
    const next = cur + 1
    localStorage.setItem(key, String(next))
    return String(next).padStart(4, '0')
  }

  const exportExcel = (stem: string) => {
    const table = activeResult?.table
    if (!table) {
      void message.warning('暂无可导出的表格')
      return
    }
    const cols = table.columns
    const aoa = [cols, ...table.rows.map((r) => cols.map((c) => (r as any)[c]))]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '结果')
    XLSX.writeFile(wb, `${safeFileStem(stem)}.xlsx`, { compression: true })
  }

  const exportPdf = (stem: string) => {
    const table = activeResult?.table
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    const title = safeFileStem(stem)
    const cols = table?.columns ?? []
    const rows = table?.rows ?? []
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 18px; }
    h1 { font-size: 16px; margin: 0 0 12px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f7f8fa; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${cols.length ? `<table><thead><tr>${cols.map((c) => `<th>${String(c)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${String((r as any)[c] ?? '')}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>` : '<div>暂无可导出的表格</div>'}
  <script>
    window.addEventListener('load', () => { window.print(); });
  </script>
</body>
</html>`
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  useEffect(() => {
    if (!exportOpen) return
    setExportName(`${todayYmd()}_${nextDailySeq()}`)
    setExportFormat('excel')
  }, [exportOpen])

  return (
    <div
      ref={layoutRef}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: debugStudio ? 0 : 2,
        height: '100vh',
        minHeight: 720,
        padding: debugStudio ? 0 : 10,
        background: panelTheme ? debugStudioBg : token.colorBgLayout,
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: isOverlay ? 'none' : 1,
          width: isOverlay ? (leftLockedWidth ?? undefined) : undefined,
          minWidth: isOverlay ? 0 : leftSafeWidth,
          minHeight: 0,
          height: debugStudio ? '100%' : undefined,
          overflow: 'hidden',
          paddingRight: 0,
          position: 'relative',
        }}
      >
        {debugStudio && studioPayload ? (
          <StudioDebugDashboardCanvas
            payload={studioPayload}
            selectedCardIdx={studioSelectedCardIdx}
            selectedDatum={studioSelectedDatum}
            selectionScope={selectionScopeRef.current}
            onCardSelect={(slotIdx, context) => {
              if (slotIdx === studioSelectedCardIdx) {
                setStudioSelectedCardIdx(null)
                setStudioSelectedDatum(null)
                broadcastGlobalSelection({ uid: `card_${slotIdx}`, scope: selectionScopeRef.current, kind: 'card', next: null })
                return
              }
              setStudioSelectedCardIdx(slotIdx)
              setStudioSelectedDatum(null)
              broadcastGlobalSelection({ uid: `card_${slotIdx}`, scope: selectionScopeRef.current, kind: 'card', next: null })
              runPresetAnalysis(context)
            }}
            onDatumSelect={(next, context) => {
              if (!next) {
                setStudioSelectedDatum(null)
                return
              }
              setStudioSelectedDatum(next)
              runPresetAnalysis(context)
            }}
          />
        ) : (
          <NeutralDashboardCanvas
            selectedKey={selectedDashboardKey}
            onSelect={(key, context) => {
              if (key === selectedDashboardKey) {
                setSelectedDashboardKey('')
                broadcastGlobalSelection({ uid: `dashboard_${key}`, scope: selectionScopeRef.current, kind: 'dashboard', next: null })
                return
              }
              setSelectedDashboardKey(key)
              broadcastGlobalSelection({ uid: `dashboard_${key}`, scope: selectionScopeRef.current, kind: 'dashboard', next: null })
              runPresetAnalysis(context)
            }}
            ui={workspaceUi || undefined}
          />
        )}
      </div>

      <div
        onPointerDown={(e) => {
          ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
          dragRef.current = { startX: e.clientX, startWidth: panelWidth }
        }}
        onPointerEnter={(e) => {
          const line = e.currentTarget.querySelector('[data-divider-line]') as HTMLDivElement | null
          if (line) line.style.background = 'rgba(0,0,0,0.18)'
        }}
        onPointerLeave={(e) => {
          const line = e.currentTarget.querySelector('[data-divider-line]') as HTMLDivElement | null
          if (line) line.style.background = 'rgba(0,0,0,0.42)'
        }}
        style={{
          width: dividerWidth,
          flex: 'none',
          position: isOverlay ? 'absolute' : 'relative',
          right: isOverlay ? panelWidth + 7 : undefined,
          top: isOverlay ? 12 : undefined,
          bottom: isOverlay ? 12 : undefined,
          cursor: 'col-resize',
          minHeight: 12,
          display: 'grid',
          placeItems: 'center',
          userSelect: 'none',
          overflow: 'visible',
          alignSelf: 'stretch',
          zIndex: isOverlay ? 31 : undefined,
          pointerEvents: 'auto',
          marginTop: debugStudio ? debugStudioGap : undefined,
          marginBottom: debugStudio ? debugStudioGap : undefined,
          height: debugStudio ? `calc(100% - ${debugStudioGap * 2}px)` : undefined,
        }}
      >
        <div
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
            dragRef.current = { startX: e.clientX, startWidth: panelWidth }
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -20,
            right: -20,
            cursor: 'col-resize',
          }}
        />
        <div
          data-divider-line
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 10,
            borderRadius: 99,
            background: 'rgba(0,0,0,0.42)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: token.colorFillSecondary,
              opacity: 0.6,
            }}
          />
        </div>

        <div
          style={{
            width: 10,
            height: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: 0,
            placeItems: 'center',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} style={{ width: 3, height: 3, borderRadius: 1, background: '#C9CBD3', opacity: 0.92 }} />
          ))}
        </div>
      </div>

      <div
        ref={chatPanelRef}
        style={{
          width: panelWidth,
          flex: 'none',
          borderRadius: 16,
          border: `1px solid var(--chatbi-panel-border)`,
          background: 'var(--chatbi-chat-bg)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: debugStudio ? `calc(100% - ${debugStudioGap * 2}px)` : undefined,
          maxHeight: debugStudio ? `calc(100% - ${debugStudioGap * 2}px)` : undefined,
          alignSelf: debugStudio ? 'stretch' : undefined,
          marginTop: debugStudio ? debugStudioGap : undefined,
          marginBottom: debugStudio ? debugStudioGap : undefined,
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-base)',
          position: isOverlay ? 'absolute' : 'relative',
          right: isOverlay ? 12 : undefined,
          top: isOverlay ? 12 : undefined,
          bottom: isOverlay ? 12 : undefined,
          zIndex: isOverlay ? 30 : undefined,
          boxShadow: isOverlay ? '0 18px 48px rgba(0,0,0,0.22)' : undefined,
          ['--chatbi-chat-bg' as any]: chatTheme.chatBg,
          ['--chatbi-panel-border' as any]: chatTheme.panelBorder,
          ['--chatbi-chart-bg' as any]: chatTheme.chartBg,
          ['--chatbi-llm-bg' as any]: chatTheme.llmBg,
          ['--chatbi-llm-text' as any]: chatTheme.llmText,
          ['--chatbi-input-bg' as any]: chatTheme.inputBg,
          ['--chatbi-input-bg-focus' as any]: chatTheme.inputFocusBg,
        }}
      >
        <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid var(--chatbi-panel-border)' }}>
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 18, letterSpacing: 0.2, fontWeight: 800 }}>
              <span style={{ opacity: 0.9 }}>Chat</span>
              <span style={{ color: panelAccent, fontStyle: 'italic' }}>BI</span>
            </Typography.Text>
          </div>

          <Space size={2}>
            <Tooltip title="新建会话">
              <Button
                type="text"
                className="iconOnly"
                icon={<PlusOutlined />}
                onClick={() => {
                  const s: Session = { id: nowId(), name: '未命名会话', messages: [] }
                  resetConversationState()
                  setSessions((prev) => [s, ...prev])
                  setActiveSessionId(s.id)
                }}
              />
            </Tooltip>
            <Tooltip title="刷新会话">
              <Button
                type="text"
                className="iconOnly"
                icon={<ReloadOutlined />}
                onClick={() => {
                  const sid = activeSession?.id
                  if (sid) setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: [] } : s)))
                  resetConversationState()
                }}
              />
            </Tooltip>
          </Space>
        </div>

        <div ref={chatScrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column' }}>
          {!activeSession?.messages?.length && !activeResult ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '10%' }}>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <VirtualAvatar size={88} style={{ marginBottom: 12 }} />
                <Typography.Title level={4} style={{ margin: 0, fontWeight: 850, fontSize: 20 }}>
                  你好，我是你的超级数据分析师
                </Typography.Title>
                <div style={{ height: 6 }} />
                <Typography.Text type="secondary">你可以用自然语言提问，快速获得数据结论与洞察</Typography.Text>
              </div>
            </div>
          ) : (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {activeSession?.messages?.map((m) => {
                const isAssistant = m.role === 'assistant'
                const msgResult = m.result

                const assistantMax = Math.min(bubbleMaxWidth, Math.floor(panelWidth * 0.76))
                const userMax = Math.min(bubbleMaxWidth, Math.floor(panelWidth * 0.66))
                const bubbleMax = isAssistant ? assistantMax : userMax

                if (isAssistant && msgResult?.status === 'done') {
                  const activeResult = msgResult
                  const activeQuestion = m.question ?? ''
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <VirtualAvatar size={32} style={{ flex: 'none', marginRight: 10 }} />
                      <div style={{ maxWidth: assistantMax, width: assistantMax }}>
                        {(() => {
                          const supportedChartTypes = inferSupportedChartTypes(activeResult)
                          const variants = activeResult.chartVariants ?? {}
                          const pickOption = (t: ChartTypeKey) => {
                            if (t === 'line') return variants['折线图'] || variants['折线'] || variants['line']
                            if (t === 'bar') return variants['柱状图'] || variants['柱图'] || variants['bar']
                            if (t === 'pie') return variants['饼图'] || variants['pie']
                            if (t === 'funnel') return variants['漏斗图'] || variants['funnel']
                            if (t === 'radar') return variants['雷达图'] || variants['radar']
                            if (t === 'bubble') return variants['气泡图'] || variants['bubble']
                            if (t === 'scatter') return variants['散点图'] || variants['scatter']
                            if (t === 'sankey') return variants['桑基图'] || variants['sankey']
                            return undefined
                          }
                          const activeOption = pickOption(chartType) || buildDerivedChartOption(chartType, activeResult) || activeResult.chart
                          const chartOption = activeOption ? ({ ...(activeOption as any), backgroundColor: 'transparent' } as any) : ({} as any)
                          const chartTypeMenuItems = (Object.keys(CHART_TYPE_LABELS) as ChartTypeKey[]).map((k) => ({
                            key: k,
                            disabled: !supportedChartTypes.has(k),
                            label: (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, opacity: supportedChartTypes.has(k) ? 1 : 0.4 }}>
                                <span style={{ color: token.colorTextSecondary }}>{CHART_TYPE_ICONS[k]}</span>
                                <span>{CHART_TYPE_LABELS[k]}</span>
                              </span>
                            ),
                          }))

                          const isTextOnly = !activeResult.metric && !activeResult.table && !activeResult.chart && !activeResult.chartVariants && !activeResult.sql
                          const { summary, next } = isTextOnly ? { summary: [], next: [] } : buildSummaryAndNext(activeResult)

                          return (
                          <div
                            className={!isTextOnly ? 'chatbiResultCard' : undefined}
                            style={{
                              borderRadius: 14,
                              border: 'none',
                              background: isTextOnly ? 'transparent' : 'var(--chatbi-llm-bg)',
                              padding: isTextOnly ? 0 : 12,
                              color: isTextOnly ? undefined : 'var(--chatbi-llm-text)',
                              ['--ant-color-text' as any]: chatTheme.antText,
                              ['--ant-color-text-secondary' as any]: chatTheme.antTextSecondary,
                              ['--ant-color-text-tertiary' as any]: chatTheme.antTextTertiary,
                              ['--ant-color-text-quaternary' as any]: chatTheme.antTextQuaternary,
                            }}
                          >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: isTextOnly ? 0 : 8 }}>
                                {!isTextOnly ? (
                                  <Typography.Text
                                    style={{
                                      flex: '1 1 auto',
                                      minWidth: 0,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: 'var(--font-size-base)',
                                      lineHeight: 'var(--line-height-base)',
                                      fontWeight: 650,
                                    }}
                                  >
                                    {activeQuestion}
                                  </Typography.Text>
                                ) : (
                                  <span />
                                )}

                                {!isTextOnly ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: 2,
                                      borderRadius: 10,
                                      background: token.colorFillTertiary,
                                      gap: 2,
                                      height: 28,
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<AppstoreOutlined />}
                                      onClick={() => setView('table')}
                                      style={{
                                        borderRadius: 10,
                                        background: view === 'table' ? token.colorFillSecondary : 'transparent',
                                        height: 24,
                                        width: 24,
                                        padding: 0,
                                      }}
                                    />
                                    <Dropdown
                                      trigger={['hover']}
                                      placement="bottomRight"
                                      overlayStyle={{ width: 320 }}
                                      menu={{
                                        items: [
                                          {
                                            key: 'grid',
                                            label: (
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
                                                {chartTypeMenuItems.map((item) => (
                                                  <div
                                                    key={item.key}
                                                    onClick={() => {
                                                      if (item.disabled) return
                                                      setView('chart')
                                                      setChartType(item.key as ChartTypeKey)
                                                    }}
                                                    style={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 6,
                                                      padding: '6px 8px',
                                                      borderRadius: 6,
                                                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                                                      background: chartType === item.key && view === 'chart' ? token.colorFillAlter : 'transparent',
                                                      opacity: item.disabled ? 0.4 : 1,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (!item.disabled) e.currentTarget.style.background = token.colorFillAlter
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (chartType !== item.key || view !== 'chart') e.currentTarget.style.background = 'transparent'
                                                    }}
                                                  >
                                                    {CHART_TYPE_ICONS[item.key as ChartTypeKey]}
                                                    <span>{CHART_TYPE_LABELS[item.key as ChartTypeKey]}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            ),
                                          },
                                        ],
                                      }}
                                    >
                                      <Button
                                        size="small"
                                        type="text"
                                        icon={CHART_TYPE_ICONS[chartType]}
                                        onClick={() => setView('chart')}
                                        style={{
                                          borderRadius: 10,
                                          background: view === 'chart' ? token.colorFillSecondary : 'transparent',
                                            height: 24,
                                            width: 24,
                                            padding: 0,
                                        }}
                                      />
                                    </Dropdown>
                                  </div>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<span style={{ fontSize: 12, fontWeight: 600, transform: 'scale(0.85)' }}>SQL</span>}
                                  style={actionButtonBoxStyle}
                                  onClick={() => setSqlOpen(true)}
                                  disabled={!activeResult.sql}
                                />
                                <Dropdown
                                  placement="bottomRight"
                                  menu={{
                                    items: [{ key: 'export', label: '导出' }],
                                    onClick: () => setExportOpen(true),
                                  }}
                                >
                                  <Button size="small" type="text" style={actionButtonBoxStyle}>
                                    ⋮
                                  </Button>
                                </Dropdown>
                                </div>
                                ) : null}
                              </div>

                              {isTextOnly ? (
                                <div className="llmOutputBox" style={{ padding: 12 }}>
                                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' }}>
                                    {renderEmphasis(String(activeResult.answerText ?? ''))}
                                  </Typography.Paragraph>

                                  <div style={{ height: 10 }} />
                                  <Space size={10} wrap>
                                    {['为什么会增长？', '哪些产品贡献最多？', '是否是一次异常波动？'].map((q) => (
                                      <Button
                                        key={q}
                                        type="default"
                                        size="small"
                                        style={{
                                          borderRadius: 999,
                                          fontSize: 'var(--font-size-base)',
                                          lineHeight: 'var(--line-height-base)',
                                          boxShadow: 'none',
                                          border: 'none',
                                          background: token.colorFillQuaternary,
                                        }}
                                        onClick={() => {
                                          setInput('')
                                          void send(q)
                                        }}
                                      >
                                        {q}
                                      </Button>
                                    ))}
                                  </Space>
                                </div>
                              ) : null}

                              {!isTextOnly && view === 'chart' && chartType === 'metric' && activeResult.metric ? (
                                <div className="llmOutputBox" style={{ textAlign: 'center' }}>
                                  <Typography.Text type="secondary">{activeResult.metric.label}</Typography.Text>
                                  <div style={{ height: 6 }} />
                                  <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{activeResult.metric.value}</div>
                                </div>
                              ) : null}

                              {!isTextOnly && view === 'chart' ? (
                                chartType === 'metric' ? null : (
                                  <div
                                    className="llmOutputBox"
                                    style={{
                                      height: chartType === 'funnel' ? 240 : 320,
                                      overflow: 'hidden',
                                      padding: 0,
                                      borderRadius: 4,
                                      background: 'var(--chatbi-chart-bg)',
                                    }}
                                  >
                                    <EChart key={chartType} option={chartOption} />
                                  </div>
                                )
                              ) : (
                                !isTextOnly ? (
                                <div
                                  className="llmOutputBox"
                                  style={{
                                    height: 320,
                                    overflow: 'hidden',
                                    padding: 0,
                                    borderRadius: 4,
                                    background: 'var(--chatbi-chart-bg)',
                                  }}
                                >
                                  {activeResult.table ? (
                                    <Table
                                      size="middle"
                                      sticky
                                        pagination={{ pageSize: 5 }}
                                      columns={(activeResult.table.columns ?? []).map((c) => ({ title: c, dataIndex: c, key: c, ellipsis: true })) as any}
                                      dataSource={activeResult.table.rows.map((r, i) => ({ ...r, key: i }))}
                                      scroll={{ x: 'max-content', y: 'calc(100% - 56px)' }}
                                    />
                                  ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                                  )}
                                </div>
                                ) : null
                              )}

                              {!isTextOnly ? (
                              <div style={{ marginTop: 10 }}>
                                <Typography.Text strong style={{ fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' }}>
                                  总结摘要
                                </Typography.Text>
                                <div style={{ height: 6 }} />
                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                  {summary.map((x, i) => (
                                    <Typography.Text key={i} style={{ fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' }}>
                                      {renderEmphasis(x)}
                                    </Typography.Text>
                                  ))}
                                </Space>

                                <div style={{ height: 10 }} />

                                <Typography.Text strong style={{ fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' }}>
                                  下一步建议
                                </Typography.Text>
                                <div style={{ height: 6 }} />
                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                  {next.map((x, i) => (
                                    <Typography.Text key={i} style={{ fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)' }}>
                                      {renderEmphasis(x)}
                                    </Typography.Text>
                                  ))}
                                </Space>
                              </div>
                              ) : null}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {isAssistant ? <VirtualAvatar size={32} style={{ flex: 'none', marginRight: 10 }} /> : null}
                    <div style={{ maxWidth: bubbleMax }}>
                      <div
                        className={m.role === 'assistant' ? 'llmOutputBox' : undefined}
                        style={
                          m.role === 'user'
                            ? {
                                maxWidth: bubbleMax,
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: token.colorPrimary,
                                color: token.colorTextLightSolid,
                                border: `1px solid ${token.colorPrimary}`,
                                whiteSpace: 'pre-wrap',
                              }
                            : {
                                maxWidth: bubbleMax,
                                whiteSpace: 'pre-wrap',
                                color: 'inherit',
                              }
                        }
                      >
                        {isAssistant ? renderEmphasis(m.content) : m.content}
                      </div>
                    </div>
                  </div>
                )
              })}

            {runningVisible ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <VirtualAvatar size={32} style={{ flex: 'none', marginRight: 10 }} />
                <div className="llmOutputBox" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="biSparkleIcon" style={{ color: token.colorPrimary }}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2.8l1.4 6a1.7 1.7 0 0 0 1.25 1.25l6 1.4-6 1.4a1.7 1.7 0 0 0-1.25 1.25l-1.4 6-1.4-6a1.7 1.7 0 0 0-1.25-1.25l-6-1.4 6-1.4A1.7 1.7 0 0 0 10.6 8.8l1.4-6Z"
                        fill="currentColor"
                      />
                      <path
                        className="sparkleSmall"
                        d="M21.2 1.8l.42 1.85c.05.19.2.33.39.38l1.85.43-1.85.42a.5.5 0 0 0-.39.39l-.42 1.85-.43-1.85a.5.5 0 0 0-.39-.39l-1.85-.42 1.85-.43c.19-.05.34-.2.38-.39l.43-1.84Z"
                        fill="currentColor"
                        opacity="0.58"
                      />
                    </svg>
                  </span>
                  <span>正在分析问题...</span>
                </div>
              </div>
            ) : null}
          </Space>
          )}
        </div>

        <div style={{ padding: 12, position: 'relative' }}>
          <div
            className="chatInputBox"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              borderRadius: 14,
              padding: 8,
            }}
          >
            <Tooltip title="快捷提问">
              <Button
                type="text"
                className="iconOnly"
                icon={<ThunderboltOutlined style={{ color: token.colorPrimary }} />}
                ref={quickTriggerRef as any}
                onClick={() => {
                  setModelOpen(false)
                  setQuickOpen((v) => !v)
                }}
              />
            </Tooltip>

            <Dropdown
              trigger={['click']}
              placement="topLeft"
              overlayClassName="modelMenu"
              open={modelOpen}
              onOpenChange={(open) => {
                if (open) setQuickOpen(false)
                setModelOpen(open)
              }}
              menu={{
                items: modelOptions.map((x) => {
                  const active = x.key === currentModel.key
                  return {
                    key: x.key,
                    label: (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          minWidth: 240,
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 400,
                          paddingBlock: 2,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <ModelLogo url={x.logoUrl} label={x.label} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.label}</span>
                        </div>
                        <span style={{ color: token.colorPrimary, opacity: active ? 1 : 0, display: 'grid', placeItems: 'center' }}>
                          <CheckOutlined />
                        </span>
                      </div>
                    ),
                  }
                }),
                onClick: ({ key }) => setModel(key as any),
              }}
            >
              <Tooltip title={currentModel.label}>
                <Button
                  type="text"
                  className="iconOnly"
                  ref={modelTriggerRef as any}
                  icon={<NeutralModelIcon />}
                />
              </Tooltip>
            </Dropdown>

            <Tooltip title="数据表">
              <Button
                type="text"
                className="iconOnly"
                icon={<DataTableSearchIcon size={18} secondaryColor={token.colorTextSecondary} primaryColor={token.colorPrimary} />}
                onClick={() => {
                  setDatasetsPreviewActive(datasetOptions[0] ?? '')
                  setDatasetsPreviewOpen(true)
                }}
              />
            </Tooltip>

            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="您正在与ChatBI聊天"
              disabled={sending}
              variant="borderless"
              onPressEnter={(e) => {
                if (e.shiftKey) return
                e.preventDefault()
                void send(input)
                setInput('')
              }}
              styles={{ textarea: { background: 'transparent' } }}
            />

            {sending || runningVisible ? (
              <Tooltip title="停止">
                <Button
                  type="text"
                  danger
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="6.4" y="6.4" width="5.2" height="5.2" rx="1.2" fill="currentColor" />
                    </svg>
                  }
                  style={{ color: token.colorError }}
                  onClick={stop}
                />
              </Tooltip>
            ) : (
              <Tooltip title="发送">
                <Button
                  type="text"
                  icon={<SendOutlined style={{ transform: 'rotate(-35deg)' }} />}
                  disabled={!input.trim()}
                  onClick={() => {
                    void send(input)
                    setInput('')
                  }}
                />
              </Tooltip>
            )}
          </div>

          {quickOpen ? (
            <div
              ref={quickPanelRef}
              className="quickPromptMenu"
              style={{
                position: 'absolute',
                left: 12,
                right: 'auto',
                bottom: 64,
                zIndex: 20001,
                borderRadius: 16,
                background: token.colorBgContainer,
                boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                width: 320,
                maxWidth: 'calc(100% - 24px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 12px 8px 12px' }}>
                <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500, color: token.colorText }}>相关问题</span>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  style={{ color: token.colorTextSecondary, fontSize: 14, lineHeight: 1.5 }}
                  onClick={() => setQuickSeed((s) => s + 1)}
                >
                  换一批
                </Button>
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px 10px 8px' }}>
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  {quickPrompts.slice(0, 5).map((q) => (
                    <Button
                      key={q}
                      type="text"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 10,
                        fontSize: 14,
                        lineHeight: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                      onClick={() => {
                        setQuickOpen(false)
                        void send(q)
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', minWidth: 0, flex: 1 }}>{q}</span>
                    </Button>
                  ))}
                </Space>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={sqlOpen}
        onCancel={() => setSqlOpen(false)}
        onOk={() => setSqlOpen(false)}
        title="AI取数过程"
        width={860}
        centered
        okText="确定"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Tabs
          items={[
            {
              key: 'biz',
              label: '业务逻辑SQL',
              children: (
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 10,
                    background: token.colorFillTertiary,
                    border: `1px solid ${token.colorSplit}`,
                    maxHeight: 420,
                    overflow: 'auto',
                    fontSize: 12,
                  }}
                >
                  {(activeResult?.sql || '').trim()}
                </pre>
              ),
            },
            {
              key: 'exec',
              label: '执行SQL',
              children: (
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 10,
                    background: token.colorFillTertiary,
                    border: `1px solid ${token.colorSplit}`,
                    maxHeight: 420,
                    overflow: 'auto',
                    fontSize: 12,
                  }}
                >
                  {(activeResult?.sql || '').trim()}
                </pre>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={() => {
          if (exportFormat === 'excel') exportExcel(exportName)
          if (exportFormat === 'pdf') exportPdf(exportName)
          setExportOpen(false)
        }}
        title="导出"
        width={760}
        centered
        okText="确定"
        cancelText="取消"
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 88, color: token.colorTextSecondary }}>文件名称</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input value={exportName} onChange={(e) => setExportName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 88, color: token.colorTextSecondary }}>文件格式</div>
            <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <Space size={18} wrap>
                <Radio value="excel">Excel</Radio>
                <Radio value="pdf">PDF</Radio>
              </Space>
            </Radio.Group>
          </div>
        </Space>
      </Modal>

      <DatasetPreviewModal
        open={datasetsPreviewOpen}
        onClose={() => setDatasetsPreviewOpen(false)}
        tables={datasetOptions}
        initialActive={datasetsPreviewActive}
        zIndex={2000}
      />

      <Drawer
        open={sessionDrawerOpen}
        onClose={() => setSessionDrawerOpen(false)}
        title="会话"
        placement="right"
        width={360}
        destroyOnClose
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            近30天对话
          </Typography.Text>
          <Button
            type="link"
            style={{ paddingInline: 0 }}
            onClick={() => {
              const s: Session = { id: nowId(), name: '未命名会话', messages: [] }
              resetConversationState()
              setSessions((prev) => [s, ...prev])
              setActiveSessionId(s.id)
            }}
          >
            新建会话
          </Button>
        </div>

        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              className={sessionRowClass}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: 'none',
                background: s.id === activeSessionId ? token.colorFillSecondary : token.colorFillQuaternary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (s.id === activeSessionId) return
                ;(e.currentTarget as HTMLDivElement).style.background = token.colorFillTertiary
              }}
              onMouseLeave={(e) => {
                if (s.id === activeSessionId) return
                ;(e.currentTarget as HTMLDivElement).style.background = token.colorFillQuaternary
              }}
              onClick={() => {
                setActiveSessionId(s.id)
              }}
            >
              <Space size={8} align="center" style={{ minWidth: 0, flex: 1 }}>
                <MessageOutlined style={{ color: token.colorTextSecondary }} />
                {sessionEditId === s.id ? (
                  <Input
                    size="small"
                    value={sessionEditName}
                    autoFocus
                    onChange={(e) => setSessionEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onPressEnter={() => {
                      upsertSession(s.id, { name: sessionEditName.trim() || '未命名会话' })
                      setSessionEditId('')
                      setSessionEditName('')
                    }}
                    style={{ maxWidth: 200 }}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                )}
              </Space>

              {sessionEditId === s.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    size="small"
                    className="iconOnly"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      upsertSession(s.id, { name: sessionEditName.trim() || '未命名会话' })
                      setSessionEditId('')
                      setSessionEditName('')
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    className="iconOnly"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setSessionEditId('')
                      setSessionEditName('')
                    }}
                  />
                </div>
              ) : (
                <Dropdown
                  trigger={['click']}
                  placement="bottomRight"
                  getPopupContainer={() => document.body}
                  menu={{
                    items: [
                      {
                        key: 'rename',
                        label: '重命名',
                        icon: <EditOutlined />,
                        onClick: () => {
                          setSessionEditId(s.id)
                          setSessionEditName(s.name)
                        },
                      },
                      {
                        key: 'delete',
                        label: '删除',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                          setDeleteSession({ id: s.id, name: s.name })
                        },
                      },
                    ],
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    className={sessionActionsClass}
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              )}
            </div>
          ))}
        </Space>
      </Drawer>

      <Modal
        open={!!deleteSession}
        title={
          deleteSession ? (
            <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{'删除会话'}</div>
          ) : (
            ''
          )
        }
        width={360}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        centered
        zIndex={20000}
        getContainer={() => document.body}
        onCancel={() => setDeleteSession(null)}
        onOk={() => {
          if (!deleteSession) return
          const targetId = deleteSession.id
          setDeleteSession(null)
          setSessions((prev) => {
            const next = prev.filter((x) => x.id !== targetId)
            if (activeSessionId === targetId) {
              setActiveSessionId(next[0]?.id ?? '')
              resetConversationState()
            }
            return next
          })
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 18, color: token.colorTextSecondary, lineHeight: 1.65 }}>
          {deleteSession ? `将删除会话“${deleteSession.name}”。删除后不可恢复。` : ''}
        </div>
      </Modal>

    </div>
  )
}
