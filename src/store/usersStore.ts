import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'Admin' | 'Analyst' | 'Viewer'
export type UserStatus = 'Active' | 'Disabled'

export type SystemUser = {
  id: string
  accountId: string
  accountName: string
  role: UserRole
  status: UserStatus
  mustChangePassword: boolean
}

function seed(): SystemUser[] {
  return [
    { id: 'u-1', accountId: 'admin', accountName: '管理员', role: 'Admin', status: 'Active', mustChangePassword: false },
    { id: 'u-2', accountId: 'analyst', accountName: '分析师', role: 'Analyst', status: 'Active', mustChangePassword: true },
    { id: 'u-3', accountId: 'viewer', accountName: '访客', role: 'Viewer', status: 'Disabled', mustChangePassword: true },
  ]
}

type UsersState = {
  users: SystemUser[]
  addUser: (u: SystemUser) => void
  updateUser: (id: string, patch: Partial<SystemUser>) => void
  removeUser: (id: string) => void
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      users: seed(),
      addUser: (u) => set((s) => ({ users: [u, ...s.users] })),
      updateUser: (id, patch) => set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((x) => x.id !== id) })),
    }),
    { name: 'chatbi-users' },
  ),
)
