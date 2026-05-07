import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DataSource } from '../pages/dataSources/model'
import { buildSeed } from '../pages/dataSources/model'

type DataSourcesState = {
  items: DataSource[]
  setItems: (items: DataSource[]) => void
  addItem: (item: DataSource) => void
  updateItem: (id: string, patch: Partial<DataSource>) => void
  removeItem: (id: string) => void
}

export const useDataSourcesStore = create<DataSourcesState>()(
  persist(
    (set) => ({
      items: buildSeed(),
      setItems: (items) => set({ items }),
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      updateItem: (id, patch) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'chatbi-data-sources-v3' },
  ),
)
