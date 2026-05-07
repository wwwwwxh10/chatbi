import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SystemState = {
  systemName: string
  logoDataUrl: string | null
  setSystemName: (name: string) => void
  setLogoDataUrl: (dataUrl: string | null) => void
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      systemName: 'ChatBI',
      logoDataUrl: null,
      setSystemName: (systemName) => set({ systemName }),
      setLogoDataUrl: (logoDataUrl) => set({ logoDataUrl }),
    }),
    { name: 'chatbi-system-settings' },
  ),
)

