import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  isAuthed: boolean
  login: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthed: false,
      login: () => set({ isAuthed: true }),
      logout: () => set({ isAuthed: false }),
    }),
    { name: 'chatbi-auth-v2' },
  ),
)
