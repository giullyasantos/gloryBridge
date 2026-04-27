import { create } from 'zustand'
import type { ServicePlan, ServiceItem, ServiceItemType } from '../types'
import { api } from '../api/client'

interface ServiceStore {
  plans: ServicePlan[]
  activePlan: ServicePlan | null
  isLoading: boolean
  error: string | null

  fetchPlans: () => Promise<void>
  loadPlan: (id: string) => Promise<void>
  createPlan: (title: string, date?: string) => Promise<ServicePlan>
  updatePlan: (id: string, data: Partial<Pick<ServicePlan, 'title' | 'date' | 'notes'>>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  addItem: (planId: string, type: ServiceItemType, refId?: string, text?: string) => Promise<void>
  removeItem: (planId: string, itemId: string) => Promise<void>
  reorderItems: (planId: string, items: ServiceItem[]) => Promise<void>
  setActivePlan: (plan: ServicePlan | null) => void
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  plans: [],
  activePlan: null,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null })
    try {
      const plans = await api.services.list()
      set({ plans, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  loadPlan: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const plan = await api.services.get(id)
      set({ activePlan: plan, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  createPlan: async (title: string, date?: string) => {
    const plan = await api.services.create({ title, date })
    set((s) => ({ plans: [plan, ...s.plans] }))
    return plan
  },

  updatePlan: async (id: string, data) => {
    const updated = await api.services.update(id, data)
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? updated : p)),
      activePlan: s.activePlan?.id === id ? updated : s.activePlan
    }))
  },

  deletePlan: async (id: string) => {
    await api.services.delete(id)
    set((s) => ({
      plans: s.plans.filter((p) => p.id !== id),
      activePlan: s.activePlan?.id === id ? null : s.activePlan
    }))
  },

  addItem: async (planId: string, type: ServiceItemType, refId?: string, text?: string) => {
    const plan = get().activePlan
    if (!plan || plan.id !== planId) return
    const newItem = await api.services.addItem(planId, { type, refId, text })
    set((s) => {
      if (!s.activePlan || s.activePlan.id !== planId) return s
      return { activePlan: { ...s.activePlan, items: [...s.activePlan.items, newItem] } }
    })
  },

  removeItem: async (planId: string, itemId: string) => {
    await api.services.removeItem(planId, itemId)
    set((s) => {
      if (!s.activePlan || s.activePlan.id !== planId) return s
      return {
        activePlan: {
          ...s.activePlan,
          items: s.activePlan.items.filter((i) => i.id !== itemId)
        }
      }
    })
  },

  reorderItems: async (planId: string, items: ServiceItem[]) => {
    // Optimistic update
    set((s) => {
      if (!s.activePlan || s.activePlan.id !== planId) return s
      return { activePlan: { ...s.activePlan, items } }
    })
    await api.services.reorder(planId, items.map((i) => i.id))
  },

  setActivePlan: (plan) => set({ activePlan: plan })
}))
