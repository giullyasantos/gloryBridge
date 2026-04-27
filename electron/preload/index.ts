import { contextBridge, ipcRenderer } from 'electron'
import type { PresentationState } from '../../src/renderer/src/types'

// Expose safe IPC API to renderer via window.electron
const api = {
  // Presentation controls
  presentation: {
    getState: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:get-state'),
    nextSlide: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:next-slide'),
    prevSlide: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:prev-slide'),
    nextItem: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:next-item'),
    prevItem: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:prev-item'),
    goToItem: (itemIndex: number): Promise<PresentationState> =>
      ipcRenderer.invoke('presentation:go-to-item', { itemIndex }),
    goToSlide: (slideIndex: number): Promise<PresentationState> =>
      ipcRenderer.invoke('presentation:go-to-slide', { slideIndex }),
    toggleBlank: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:toggle-blank'),
    toggleLogo: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:toggle-logo'),
    setLanguages: (languages: string[]): Promise<PresentationState> =>
      ipcRenderer.invoke('presentation:set-languages', { languages }),
    toggleLoop: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:toggle-loop'),
    goLive: (serviceId: string): Promise<PresentationState> =>
      ipcRenderer.invoke('presentation:go-live', { serviceId }),
    endService: (): Promise<PresentationState> => ipcRenderer.invoke('presentation:end-service'),
    onStateUpdate: (cb: (state: PresentationState) => void): (() => void) => {
      const listener = (_: Electron.IpcRendererEvent, state: PresentationState): void => cb(state)
      ipcRenderer.on('presentation:state-update', listener)
      return () => ipcRenderer.removeListener('presentation:state-update', listener)
    }
  },
  // Display management
  display: {
    getMonitors: () => ipcRenderer.invoke('display:get-monitors')
  },
  // Native file dialog
  dialog: {
    openFile: (options: {
      filters?: Array<{ name: string; extensions: string[] }>
      properties?: string[]
    }): Promise<string | null> => ipcRenderer.invoke('dialog:open-file', options)
  },
  // Utility
  isElectron: true
}

contextBridge.exposeInMainWorld('electron', api)

export type ElectronAPI = typeof api
