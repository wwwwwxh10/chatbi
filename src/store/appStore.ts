import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'
export type LocaleCode = 'zh-CN' | 'en-US'

type AppState = {
  themeMode: ThemeMode
  locale: LocaleCode
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  setLocale: (locale: LocaleCode) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      locale: 'zh-CN',
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleTheme: () => {
        const cur = get().themeMode
        set({ themeMode: cur === 'dark' ? 'light' : 'dark' })
      },
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'chatbi-preferences' },
  ),
)
