import type { ReactNode } from 'react'

export type ChartTypeKey = 'bar' | 'pie' | 'line' | 'metric' | 'funnel' | 'radar' | 'bubble' | 'scatter' | 'sankey'

const Svg = ({ children }: { children: ReactNode }) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{children}</svg>

export const CHART_TYPE_LABELS: Record<ChartTypeKey, string> = { bar: '柱图', pie: '饼图', line: '折线图', metric: '指标卡', funnel: '漏斗图', radar: '雷达图', bubble: '气泡图', scatter: '散点图', sankey: '桑基图' }

export const CHART_TYPE_ICONS: Record<ChartTypeKey, ReactNode> = {
  bar: <Svg><path d="M2 13.5H14M3.5 13V9.5M6.5 13V6.5M9.5 13V8" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><path d="M12.5 13V4.5" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round"/></Svg>,
  pie: <Svg><path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 2.5V8h5.5" stroke="#1677FF" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></Svg>,
  line: <Svg><path d="M2 13.5H14M2.5 13V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><path d="M3 10.5l3-3 2.2 2.2L12.8 5" stroke="#1677FF" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></Svg>,
  metric: <Svg><path d="M3 3.5h10v9H3v-9Z" stroke="#A3A8B3" strokeWidth="1.2"/><path d="M4.5 6h5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><path d="M4.5 9.5h7" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round"/></Svg>,
  funnel: <Svg><path d="M3 3.5h10M4 3.5l4 5v4l-2 1v-5l-2-4M12 3.5l-4 5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.2 3.5h2.6" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round"/></Svg>,
  radar: <Svg><path d="M8 2.5l4 2.4v5.2L8 13.5l-4-3.4V4.9L8 2.5ZM8 4.4l2.6 1.6v3.2L8 11.4 5.4 9.2V6L8 4.4Z" stroke="#A3A8B3" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 2.5l4 2.4" stroke="#1677FF" strokeWidth="1.6" strokeLinecap="round"/></Svg>,
  bubble: <Svg><path d="M2.5 13.5H14M2.5 13.5V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="9.5" r="2.2" stroke="#A3A8B3" strokeWidth="1.2"/><circle cx="11.2" cy="6" r="1.8" stroke="#A3A8B3" strokeWidth="1.2"/><circle cx="12.2" cy="11.6" r="1.4" stroke="#A3A8B3" strokeWidth="1.2"/><path d="M10.2 4.8h2" stroke="#1677FF" strokeWidth="1.6"/></Svg>,
  scatter: <Svg><path d="M2.5 13.5H14M2.5 13.5V2.5" stroke="#A3A8B3" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="9" r="1" fill="#1677FF"/><circle cx="9" cy="6.8" r="1" fill="#A3A8B3"/><circle cx="11.8" cy="8.5" r="1" fill="#A3A8B3"/></Svg>,
  sankey: <Svg><rect x="2.6" y="3" width="2.6" height="3" rx="1" fill="#A3A8B3"/><rect x="2.6" y="10" width="2.6" height="3" rx="1" fill="#A3A8B3"/><rect x="10.8" y="6.5" width="2.6" height="3" rx="1" fill="#A3A8B3"/><path d="M5.8 4.5c2.4 0 2.4 3.5 5 3.5M5.8 11.5c2.4 0 2.4-3.5 5-3.5" stroke="#A3A8B3" strokeWidth="1.2"/><path d="M5.9 4.5c1.8 0 2.3 1.2 3.1 2.2" stroke="#1677FF" strokeWidth="1.6"/></Svg>,
}
