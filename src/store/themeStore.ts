import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId } from '../theme/types'

type ThemeState = {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'business',
      setThemeId: (id) => set({ themeId: id }),
    }),
    { name: 'chart-demo-theme' },
  ),
)

