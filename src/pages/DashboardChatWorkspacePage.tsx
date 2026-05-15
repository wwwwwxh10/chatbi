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
  HistoryOutlined,
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
import { buildMockResult } from './chat/chatUtils'
import type { MessageResult } from './chat/chatUtils'
import { CHART_PALETTES, KIND_NAME, THEME_ACCENT } from './studioModel'
import type { StudioAppearance, StudioLayout, WidgetKind } from './studioModel'
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
      series: [{ type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, lineStyle: { width: 3 }, areaStyle: { opacity: 0.08 }, data: vals }],
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

function NeutralDashboardCanvas({ selectedKey, onSelect }: { selectedKey: string; onSelect: (key: string, context: string) => void }) {
  const { token } = theme.useToken()

  const CardPlaceholder = ({ children, clickable, active, onClick }: { children?: ReactNode; clickable?: boolean; active?: boolean; onClick?: () => void }) => (
    <div
      className="dashboardChartCard"
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
      style={{
        height: '100%',
        borderRadius: 14,
        background: token.colorBgContainer,
        border: `1px solid ${active ? token.colorPrimary : token.colorSplit}`,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  )

  const MetricCard = ({ title, k }: { title: string; k: string }) => (
    <CardPlaceholder clickable active={selectedKey === k} onClick={() => onSelect(k, '2025年3月｜上海｜销售额')}>
      <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{title}</div>
      <div style={{ height: 10 }} />
      <div style={{ width: '70%', height: 34, borderRadius: 10, background: token.colorFillTertiary }} />
      <div style={{ height: 10 }} />
      <div style={{ width: '42%', height: 12, borderRadius: 8, background: token.colorFillSecondary }} />
    </CardPlaceholder>
  )

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gridTemplateRows: '140px minmax(0, 1fr) minmax(0, 1fr)',
          gap: 12,
        }}
      >
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <MetricCard k="kpi-a" title="核心指标 A" />
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <MetricCard k="kpi-b" title="核心指标 B" />
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <MetricCard k="kpi-c" title="核心指标 C" />
        </div>
        <div style={{ gridColumn: 'span 3', height: '100%' }}>
          <MetricCard k="kpi-d" title="核心指标 D" />
        </div>

        <div style={{ gridColumn: 'span 8', height: '100%' }}>
          <CardPlaceholder
            clickable
            active={selectedKey === 'sales'}
            onClick={() => onSelect('sales', '2025年3月｜上海｜销售额')}
          >
            <div style={{ width: 120, height: 16, borderRadius: 6, background: token.colorFillTertiary, marginBottom: 16 }} />
            <div style={{ flex: 1, borderRadius: 12, background: token.colorFillQuaternary, position: 'relative', overflow: 'hidden' }}>
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={token.colorSplit} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.6" />
                ))}
                {[20, 40, 60, 80].map((x) => (
                  <line key={x} x1={x} y1="0" x2={x} y2="100" stroke={token.colorSplit} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.35" />
                ))}
                <path d="M 0,78 L 14,60 L 28,66 L 42,44 L 56,54 L 70,30 L 84,36 L 100,18" fill="none" stroke={token.colorPrimary} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M 0,86 L 14,74 L 28,78 L 42,62 L 56,66 L 70,52 L 84,58 L 100,46" fill="none" stroke={token.colorSplit} strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.9" />
              </svg>
            </div>
          </CardPlaceholder>
        </div>
        <div style={{ gridColumn: 'span 4', height: '100%' }}>
          <CardPlaceholder clickable active={selectedKey === 'radar'} onClick={() => onSelect('radar', '2025年3月｜上海｜销售额')}>
            <div style={{ width: 90, height: 16, borderRadius: 6, background: token.colorFillTertiary, marginBottom: 16 }} />
            <div style={{ flex: 1, borderRadius: 12, background: token.colorFillQuaternary, display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '86%', aspectRatio: '1 / 1', maxWidth: 240, borderRadius: '50%', border: `1px dashed ${token.colorSplit}`, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '14%', borderRadius: '50%', border: `1px dashed ${token.colorSplit}` }} />
                <div style={{ position: 'absolute', inset: '28%', borderRadius: '50%', border: `1px dashed ${token.colorSplit}` }} />
                <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
                  <polygon points="50,8 82,28 92,58 66,92 20,76 8,40" fill={token.colorPrimary} />
                </svg>
              </div>
            </div>
          </CardPlaceholder>
        </div>

        <div style={{ gridColumn: 'span 6', height: '100%' }}>
          <CardPlaceholder clickable active={selectedKey === 'donut'} onClick={() => onSelect('donut', '2025年3月｜上海｜销售额')}>
            <div style={{ width: 100, height: 16, borderRadius: 6, background: token.colorFillTertiary, marginBottom: 16 }} />
            <div style={{ flex: 1, borderRadius: 12, background: token.colorFillQuaternary, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ opacity: 0.22, maxWidth: 220, maxHeight: 220 }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke={token.colorSplit} strokeWidth="18" strokeDasharray="60 200" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={token.colorSplit} strokeWidth="18" strokeDasharray="80 200" strokeDashoffset="-70" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={token.colorSplit} strokeWidth="18" strokeDasharray="40 200" strokeDashoffset="-160" />
              </svg>
            </div>
          </CardPlaceholder>
        </div>
        <div style={{ gridColumn: 'span 6', height: '100%' }}>
          <CardPlaceholder clickable active={selectedKey === 'list'} onClick={() => onSelect('list', '2025年3月｜上海｜销售额')}>
            <div style={{ width: 80, height: 16, borderRadius: 6, background: token.colorFillTertiary, marginBottom: 16 }} />
            <div style={{ flex: 1, borderRadius: 12, background: token.colorFillQuaternary, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, background: token.colorFillSecondary, display: 'grid', placeItems: 'center', fontSize: 10, color: token.colorTextSecondary }}>
                    {i}
                  </div>
                  <div style={{ width: '28%', height: 12, borderRadius: 6, background: token.colorFillTertiary }} />
                  <div style={{ flex: 1, height: 10, borderRadius: 8, background: token.colorFillTertiary, overflow: 'hidden' }}>
                    <div style={{ width: `${92 - i * 9}%`, height: '100%', borderRadius: 8, background: token.colorFillSecondary }} />
                  </div>
                </div>
              ))}
            </div>
          </CardPlaceholder>
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

function StudioDebugDashboardCanvas({
  payload,
}: {
  payload: StudioDebugPayload
}) {
  const { token } = theme.useToken()

  const appearance = payload.appearance ?? { language: 'zh-CN', timeZone: 'Asia/Shanghai', theme: 'obsidian', chartPalette: 'cyber' }
  const layout = payload.layout ?? { mode: 'template', template: 'main-sub' }
  const palette = CHART_PALETTES[appearance.chartPalette] ?? CHART_PALETTES.cyber
  const themeColors = palette.colors ?? []
  const accent = appearance.theme === 'obsidian' ? token.colorPrimary : THEME_ACCENT[appearance.theme]

  const cyberPageBg =
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 22px), radial-gradient(1200px 700px at 30% 10%, rgba(45, 100, 255, 0.18), transparent 55%), radial-gradient(900px 520px at 80% 30%, rgba(121, 54, 255, 0.12), transparent 55%), radial-gradient(1200px 900px at 60% 120%, rgba(20, 255, 185, 0.08), transparent 60%), #03060c'
  const techPageBg =
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.028), rgba(255,255,255,0.028) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.028), rgba(255,255,255,0.028) 1px, transparent 1px, transparent 22px), radial-gradient(1200px 700px at 28% 8%, rgba(43, 123, 255, 0.22), transparent 55%), radial-gradient(900px 520px at 78% 30%, rgba(20, 160, 255, 0.16), transparent 58%), radial-gradient(1200px 900px at 60% 120%, rgba(90, 200, 255, 0.10), transparent 60%), #03060c'
  const studioShellBg = appearance.theme === 'obsidian' ? token.colorBgLayout : appearance.theme === 'cyber' ? cyberPageBg : techPageBg

  const surfaceBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'linear-gradient(135deg, rgba(18, 44, 96, 0.62), rgba(10, 16, 28, 0.86))'
        : appearance.theme === 'cyber'
          ? 'linear-gradient(135deg, rgba(20, 30, 50, 0.60), rgba(10, 15, 25, 0.80))'
          : 'rgba(10, 14, 24, 0.76)'

  const emptyBg =
    appearance.theme === 'obsidian'
      ? token.colorBgContainer
      : appearance.theme === 'tech'
        ? 'linear-gradient(135deg, rgba(18, 44, 96, 0.45), rgba(10, 16, 28, 0.84))'
        : appearance.theme === 'cyber'
          ? 'linear-gradient(135deg, rgba(20, 30, 50, 0.60), rgba(10, 15, 25, 0.80))'
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

  const optionForSlot = (kind: WidgetKind, name: string): EChartsOption | null => {
    if (kind === 'bar') return buildBarOption(name, themeColors)
    if (kind === 'bar-h') return buildHBarOption(name, themeColors)
    if (kind === 'bar-stacked') return buildStackedBarOption(name, themeColors)
    if (kind === 'bar-grouped') return buildGroupedBarOption(name, themeColors)
    if (kind === 'bar-gradient') return buildGradientBarOption(name, themeColors)
    if (kind === 'line') return buildLineOption(name, themeColors)
    if (kind === 'line-area') return buildAreaOption(name, themeColors)
    if (kind === 'line-curve') return buildCurveOption(name, themeColors)
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

  const renderSlotBody = (raw: { kind: WidgetKind | null; configText: string } | undefined) => {
    const kind = raw?.kind ?? null
    const parsed = (() => {
      try {
        return raw?.configText ? JSON.parse(raw.configText) : null
      } catch {
        return null
      }
    })()
    const chartTitle = String(parsed?.title ?? (kind ? KIND_NAME[kind] : ''))

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
                <CircleDot size={14} />
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {chartTitle}
              </Typography.Text>
            </Space>
          </div>
          <div style={{ display: 'grid', alignContent: 'center', minHeight: 0 }}>
            <FlipCounter title={chartTitle} unit={unit} target={value} />
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
          <div className="studioSlotHeader" style={{ padding: '10px 12px' }}>
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
                    color: token.colorTextTertiary,
                    opacity: 0.85,
                  }}
                >
                  <Workflow size={14} />
                </span>
                <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: 0.2 }}>{chartTitle}</Typography.Text>
              </Space>
            </div>
          </div>
          <div style={{ padding: 12, flex: 1, minHeight: 0, display: 'grid', alignContent: 'center', gap: 10 }}>
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

    const opt = optionForSlot(kind, chartTitle)
    return opt ? (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="studioSlotHeader" style={{ padding: '12px 12px 8px 12px' }}>
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
                  color: token.colorTextTertiary,
                  opacity: 0.85,
                  flex: '0 0 22px',
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
                  return <Icon size={14} />
                })()}
              </span>
              <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: 0.2 }}>{chartTitle}</Typography.Text>
            </Space>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, paddingTop: kind === 'funnel' ? 0 : 10 }}>
          <EChart option={opt as any} />
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
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: studioShellBg }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${token.colorSplit}`, background: 'rgba(0,0,0,0.10)' }}>
        <Typography.Text strong style={{ display: 'block', lineHeight: 1.2 }}>
          {String(payload.title ?? '').trim() || '未命名仪表盘'}
        </Typography.Text>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <div
          style={{
            height: '100%',
            minHeight: 0,
            borderRadius: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 16,
            border: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 'none' : `1px solid ${token.colorSplit}`,
            background: appearance.theme === 'obsidian' ? token.colorBgLayout : appearance.theme === 'cyber' || appearance.theme === 'tech' ? 'transparent' : 'rgba(8, 12, 22, 0.70)',
            overflow: 'auto',
            padding: appearance.theme === 'obsidian' || appearance.theme === 'cyber' || appearance.theme === 'tech' ? 0 : 12,
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
              alignItems: 'stretch',
              minHeight: 0,
            }}
          >
            {positions.map((pos: any, idx: number) => {
              const raw = slots[idx]
              const kind = raw?.kind ?? null
              const borderColor = kind ? token.colorSplit : token.colorSplit
              return (
                <div
                  key={idx}
                  className={`studioSlot${kind ? ' studioSlotFilled dashboardChartCard' : ' studioSlotEmpty'}`}
                  style={{
                    ['--studio-accent' as any]: accent,
                    gridColumn: `${pos.colStart} / span ${pos.colSpan}`,
                    gridRow: `${pos.rowStart} / span ${pos.rowSpan}`,
                    height: '100%',
                    borderRadius: 14,
                    border: kind ? `1px solid ${borderColor}` : `1px dashed ${borderColor}`,
                    background: kind ? surfaceBg : emptyBg,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                  }}
                >
                  {renderSlotBody(raw)}
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

export default function DashboardChatWorkspacePage() {
  const { token } = theme.useToken()

  const debugStudio = useMemo(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('debug') === 'studio'
  }, [])

  const studioPayload = useMemo(() => {
    if (!debugStudio) return null
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('studio:debug-dashboard-v1')
      return raw ? (JSON.parse(raw) as StudioDebugPayload) : null
    } catch {
      return null
    }
  }, [debugStudio])

  const sessionRowClass = 'sessionRow'
  const sessionActionsClass = 'sessionActions'

  const actionButtonBoxStyle = {
    background: token.colorFillTertiary,
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

  const [sessionEditId, setSessionEditId] = useState<string>('')
  const [sessionEditName, setSessionEditName] = useState<string>('')

  const [deleteSession, setDeleteSession] = useState<{ id: string; name: string } | null>(null)

  const [runningVisible, setRunningVisible] = useState(false)
  const runningUntilRef = useRef(0)
  const pendingDoneRef = useRef<MessageResult | null>(null)
  const finishTimerRef = useRef<number | null>(null)
  const pendingMessagesRef = useRef<ChatMessage[] | null>(null)

  const [panelWidth, setPanelWidth] = useState(420)
  const overlayThreshold = 720
  const isOverlay = panelWidth > overlayThreshold
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
    if (!isOverlay) {
      setLeftLockedWidth(null)
      return
    }
    const el = layoutRef.current
    if (!el) return
    const compute = () => {
      const w = el.getBoundingClientRect().width
      const locked = Math.max(360, Math.floor(w - 20 - 2 - 10 - overlayThreshold))
      setLeftLockedWidth(locked)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isOverlay])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = dragRef.current.startX - e.clientX
      const layoutW = layoutRef.current?.getBoundingClientRect().width
      const maxW = Math.min(960, Math.max(520, (layoutW ?? 1200) - 24))
      const next = Math.min(maxW, Math.max(420, dragRef.current.startWidth + dx))
      setPanelWidth(next)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const dx = dragRef.current.startX - e.clientX
      const layoutW = layoutRef.current?.getBoundingClientRect().width
      const maxW = Math.min(960, Math.max(520, (layoutW ?? 1200) - 24))
      const next = Math.min(maxW, Math.max(420, dragRef.current.startWidth + dx))
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
      style={{ display: 'flex', gap: 2, height: '100vh', minHeight: 720, padding: 10, background: token.colorBgLayout, position: 'relative' }}
    >
      <div
        style={{
          flex: isOverlay ? 'none' : 1,
          width: isOverlay ? leftLockedWidth ?? undefined : undefined,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          paddingRight: 0,
          position: 'relative',
        }}
      >
        {debugStudio && studioPayload ? (
          <StudioDebugDashboardCanvas
            payload={studioPayload}
          />
        ) : (
          <NeutralDashboardCanvas
            selectedKey={selectedDashboardKey}
            onSelect={(key, context) => {
              if (key === selectedDashboardKey) {
                setSelectedDashboardKey('')
                return
              }
              setSelectedDashboardKey(key)
              runPresetAnalysis(context)
            }}
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
          width: 10,
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
              background: `linear-gradient(180deg, ${token.colorFillTertiary} 0%, ${token.colorFillSecondary} 50%, ${token.colorFillTertiary} 100%)`,
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
          border: `1px solid ${token.colorSplit}`,
          background: token.colorBgContainer,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-base)',
          position: isOverlay ? 'absolute' : 'relative',
          right: isOverlay ? 12 : undefined,
          top: isOverlay ? 12 : undefined,
          bottom: isOverlay ? 12 : undefined,
          zIndex: isOverlay ? 30 : undefined,
          boxShadow: isOverlay ? '0 18px 48px rgba(0,0,0,0.22)' : undefined,
        }}
      >
        <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: `1px solid ${token.colorSplit}` }}>
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 18, letterSpacing: 0.2, fontWeight: 800 }}>
              <span style={{ opacity: 0.9 }}>Chat</span>
              <span style={{ color: token.colorPrimary, fontStyle: 'italic' }}>BI</span>
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
            <Tooltip title="历史会话">
              <Button
                type="text"
                className="iconOnly"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setSessionDrawerOpen(true)
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
                            style={{
                              borderRadius: 14,
                              border: isTextOnly ? 'none' : `1px solid ${token.colorSplit}`,
                              background: isTextOnly ? 'transparent' : token.colorBgContainer,
                              padding: isTextOnly ? 0 : 12,
                            }}
                          >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: isTextOnly ? 0 : 8 }}>
                                {!isTextOnly ? (
                                  <Typography.Text style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-base)', fontWeight: 650 }}>
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
                                    }}
                                  >
                                    <EChart key={chartType} option={activeOption || {}} />
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
                                color: token.colorText,
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
