import { create } from 'zustand'
import type { PresentationState, SlideContent } from '../types'

interface PresentationStore extends PresentationState {
  currentSlideContent: SlideContent | null

  // Actions (call Electron IPC or fall back to local state in browser)
  nextSlide: () => Promise<void>
  prevSlide: () => Promise<void>
  nextItem: () => Promise<void>
  prevItem: () => Promise<void>
  goToItem: (itemIndex: number) => Promise<void>
  goToSlide: (slideIndex: number) => Promise<void>
  toggleBlank: () => Promise<void>
  toggleLogo: () => Promise<void>
  setLanguages: (languages: string[]) => Promise<void>
  toggleLoop: () => Promise<void>
  goLive: (serviceId: string) => Promise<void>
  endService: () => Promise<void>
  syncState: (state: PresentationState) => void
  setSlideContent: (content: SlideContent | null) => void
}

const defaultState: PresentationState = {
  isLive: false,
  currentServiceId: null,
  currentItemIndex: 0,
  currentSlideIndex: 0,
  isBlank: false,
  isLogo: false,
  activeLanguages: ['en'],
  bilingualMode: false,
  loopCurrent: false
}

const ipc = (): typeof window.electron.presentation | null => {
  if (typeof window !== 'undefined' && window.electron) return window.electron.presentation
  return null
}

const withIpc = async (
  ipcFn: () => Promise<PresentationState>,
  localFn: (prev: PresentationState) => Partial<PresentationState>
): Promise<PresentationState | Partial<PresentationState>> => {
  const api = ipc()
  if (api) return ipcFn()
  return localFn(usePresentationStore.getState())
}

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  ...defaultState,
  currentSlideContent: null,

  nextSlide: async () => {
    const state = await withIpc(
      () => window.electron.presentation.nextSlide(),
      (prev) => ({ currentSlideIndex: prev.currentSlideIndex + 1 })
    )
    set(state as PresentationState)
  },

  prevSlide: async () => {
    const state = await withIpc(
      () => window.electron.presentation.prevSlide(),
      (prev) => ({ currentSlideIndex: Math.max(0, prev.currentSlideIndex - 1) })
    )
    set(state as PresentationState)
  },

  nextItem: async () => {
    const state = await withIpc(
      () => window.electron.presentation.nextItem(),
      (prev) => ({ currentItemIndex: prev.currentItemIndex + 1, currentSlideIndex: 0 })
    )
    set(state as PresentationState)
  },

  prevItem: async () => {
    const state = await withIpc(
      () => window.electron.presentation.prevItem(),
      (prev) => ({
        currentItemIndex: Math.max(0, prev.currentItemIndex - 1),
        currentSlideIndex: 0
      })
    )
    set(state as PresentationState)
  },

  goToItem: async (itemIndex: number) => {
    const state = await withIpc(
      () => window.electron.presentation.goToItem(itemIndex),
      () => ({ currentItemIndex: itemIndex, currentSlideIndex: 0 })
    )
    set(state as PresentationState)
  },

  goToSlide: async (slideIndex: number) => {
    const state = await withIpc(
      () => window.electron.presentation.goToSlide(slideIndex),
      () => ({ currentSlideIndex: slideIndex })
    )
    set(state as PresentationState)
  },

  toggleBlank: async () => {
    const state = await withIpc(
      () => window.electron.presentation.toggleBlank(),
      (prev) => ({ isBlank: !prev.isBlank, isLogo: false })
    )
    set(state as PresentationState)
  },

  toggleLogo: async () => {
    const state = await withIpc(
      () => window.electron.presentation.toggleLogo(),
      (prev) => ({ isLogo: !prev.isLogo, isBlank: false })
    )
    set(state as PresentationState)
  },

  setLanguages: async (languages: string[]) => {
    const state = await withIpc(
      () => window.electron.presentation.setLanguages(languages),
      () => ({ activeLanguages: languages, bilingualMode: languages.length > 1 })
    )
    set(state as PresentationState)
  },

  toggleLoop: async () => {
    const state = await withIpc(
      () => window.electron.presentation.toggleLoop(),
      (prev) => ({ loopCurrent: !prev.loopCurrent })
    )
    set(state as PresentationState)
  },

  goLive: async (serviceId: string) => {
    const state = await withIpc(
      () => window.electron.presentation.goLive(serviceId),
      () => ({
        isLive: true,
        currentServiceId: serviceId,
        currentItemIndex: 0,
        currentSlideIndex: 0,
        isBlank: false,
        isLogo: false
      })
    )
    set(state as PresentationState)
  },

  endService: async () => {
    const state = await withIpc(
      () => window.electron.presentation.endService(),
      () => ({ isLive: false, isBlank: true })
    )
    set(state as PresentationState)
  },

  syncState: (state: PresentationState) => set(state),

  setSlideContent: (content) => set({ currentSlideContent: content })
}))

// Declare electron global type
declare global {
  interface Window {
    electron: {
      presentation: {
        getState: () => Promise<PresentationState>
        nextSlide: () => Promise<PresentationState>
        prevSlide: () => Promise<PresentationState>
        nextItem: () => Promise<PresentationState>
        prevItem: () => Promise<PresentationState>
        goToItem: (itemIndex: number) => Promise<PresentationState>
        goToSlide: (slideIndex: number) => Promise<PresentationState>
        toggleBlank: () => Promise<PresentationState>
        toggleLogo: () => Promise<PresentationState>
        setLanguages: (languages: string[]) => Promise<PresentationState>
        toggleLoop: () => Promise<PresentationState>
        goLive: (serviceId: string) => Promise<PresentationState>
        endService: () => Promise<PresentationState>
        onStateUpdate: (cb: (state: PresentationState) => void) => () => void
      }
      display: {
        getMonitors: () => Promise<import('../types').MonitorInfo[]>
      }
      isElectron: boolean
    }
  }
}
