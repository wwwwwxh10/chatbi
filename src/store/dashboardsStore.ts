import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CustomDashboard = {
  id: string
  title: string
  description?: string
  tables: string[]
  updatedAt: string
  published: boolean
  configText?: string
}

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function studioSeedConfig({
  title,
  description,
  tables,
}: {
  title: string
  description?: string
  tables: string[]
}) {
  const cfg = {
    __preset: 'studio-sample-v1',
    name: title,
    description: description ?? '',
    tables,
    appearance: { language: 'zh-CN', timeZone: 'UTC+08:00', theme: 'cyber', chartPalette: 'deepsea' },
    layout: { mode: 'template', template: 'main-sub' },
    widgets: [
      { kind: 'kpi', config: { title: 'ARPU均值', format: 'currency', valueKey: 'arpu' } },
      { kind: 'kpi', config: { title: 'ARPU均值', format: 'currency', valueKey: 'arpu' } },
      { kind: 'flip', config: { title: '在网总用户数', unit: '万', valueKey: 'subs' } },
      { kind: 'progress', config: { title: '告警处理进度', valueKey: 'progress', max: 100 } },
      { kind: 'line', config: { title: 'GMV 趋势', unit: '万', xKey: 'date', yKey: 'gmv' } },
      { kind: 'radar', config: { title: '能力雷达', indicators: ['维度A', '维度B', '维度C', '维度D', '维度E'], valueKey: 'score' } },
      { kind: 'bar', config: { title: '品类对比', unit: '万', xKey: 'category', yKey: 'gmv' } },
      { kind: 'bubble', config: { title: '散点分布', xKey: 'x', yKey: 'y', sizeKey: 'size' } },
    ],
  }
  return JSON.stringify(cfg, null, 2)
}

type DashboardsState = {
  items: CustomDashboard[]
  setItems: (items: CustomDashboard[]) => void
  addItem: (item: CustomDashboard) => void
  updateItem: (id: string, patch: Partial<CustomDashboard>) => void
  removeItem: (id: string) => void
}

const seed: CustomDashboard[] = [
  {
    id: 'custom-1',
    title: '指标看板',
    description: '覆盖核心指标、趋势与结构分布，用于日常运营监控。',
    tables: ['orders', 'users', 'events', 'products', 'sessions'],
    updatedAt: '2026-04-27 16:12',
    published: true,
    configText: studioSeedConfig({
      title: '指标看板',
      description: '覆盖核心指标、趋势与结构分布，用于日常运营监控。',
      tables: ['orders', 'users', 'events', 'products', 'sessions'],
    }),
  },
  {
    id: 'custom-2',
    title: '订单分析',
    description: '按渠道/品类/地域拆解订单与支付，定位波动原因。',
    tables: ['orders', 'order_items', 'products'],
    updatedAt: '2026-04-26 11:08',
    published: true,
    configText: studioSeedConfig({
      title: '订单分析',
      description: '按渠道/品类/地域拆解订单与支付，定位波动原因。',
      tables: ['orders', 'order_items', 'products'],
    }),
  },
  {
    id: 'custom-3',
    title: '用户增长',
    description: '关注新增、留存与召回，辅助增长策略评估。',
    tables: ['users', 'events', 'sessions'],
    updatedAt: '2026-04-25 19:42',
    published: false,
    configText: studioSeedConfig({
      title: '用户增长',
      description: '关注新增、留存与召回，辅助增长策略评估。',
      tables: ['users', 'events', 'sessions'],
    }),
  },
  {
    id: 'custom-4',
    title: '活动复盘',
    description: '活动期间关键指标对比与人群分层复盘。',
    tables: ['events', 'orders', 'users'],
    updatedAt: '2026-04-24 09:30',
    published: false,
    configText: studioSeedConfig({
      title: '活动复盘',
      description: '活动期间关键指标对比与人群分层复盘。',
      tables: ['events', 'orders', 'users'],
    }),
  },
  {
    id: 'custom-5',
    title: '渠道投放监控',
    description: '投放成本、转化与 ROI 监控面板。',
    tables: ['sessions', 'events', 'orders'],
    updatedAt: '2026-04-23 13:05',
    published: true,
    configText: studioSeedConfig({
      title: '渠道投放监控',
      description: '投放成本、转化与 ROI 监控面板。',
      tables: ['sessions', 'events', 'orders'],
    }),
  },
]

export const useDashboardsStore = create<DashboardsState>()(
  persist(
    (set) => ({
      items: seed,
      setItems: (items) => set({ items }),
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      updateItem: (id, patch) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'chatbi-dashboards-v1' },
  ),
)

export function createDashboardId() {
  return `custom-${Date.now()}`
}

export function touchUpdatedAt() {
  return nowText()
}
