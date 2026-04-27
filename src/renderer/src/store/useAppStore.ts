import { create } from 'zustand'
import type { NavSection, Toast, ToastType } from '../types'

interface AppStore {
  activeSection: NavSection
  toasts: Toast[]
  backendOnline: boolean
  streamOnline: boolean

  setSection: (section: NavSection) => void
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
  setBackendOnline: (online: boolean) => void
  setStreamOnline: (online: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeSection: 'service',
  toasts: [],
  backendOnline: false,
  streamOnline: false,

  setSection: (section) => set({ activeSection: section }),

  addToast: (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setBackendOnline: (online) => set({ backendOnline: online }),
  setStreamOnline: (online) => set({ streamOnline: online })
}))
