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
    configText: '{\n  "name": "指标看板"\n}',
  },
  {
    id: 'custom-2',
    title: '订单分析',
    description: '按渠道/品类/地域拆解订单与支付，定位波动原因。',
    tables: ['orders', 'order_items', 'products'],
    updatedAt: '2026-04-26 11:08',
    published: true,
    configText: '{\n  "name": "订单分析"\n}',
  },
  {
    id: 'custom-3',
    title: '用户增长',
    description: '关注新增、留存与召回，辅助增长策略评估。',
    tables: ['users', 'events', 'sessions'],
    updatedAt: '2026-04-25 19:42',
    published: false,
    configText: '{\n  "name": "用户增长"\n}',
  },
  {
    id: 'custom-4',
    title: '活动复盘',
    description: '活动期间关键指标对比与人群分层复盘。',
    tables: ['events', 'orders', 'users'],
    updatedAt: '2026-04-24 09:30',
    published: false,
    configText: '{\n  "name": "活动复盘"\n}',
  },
  {
    id: 'custom-5',
    title: '渠道投放监控',
    description: '投放成本、转化与 ROI 监控面板。',
    tables: ['sessions', 'events', 'orders'],
    updatedAt: '2026-04-23 13:05',
    published: true,
    configText: '{\n  "name": "渠道投放监控"\n}',
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

