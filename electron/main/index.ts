import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { PresentationState } from '../../src/renderer/src/types'
import { createApp } from '../server/app'
import { initDb } from '../server/db'

const SERVER_PORT = 3001

// ─── Presentation State Machine ───────────────────────────────────────────────

let presentationState: PresentationState = {
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

// ─── Windows ──────────────────────────────────────────────────────────────────

let operatorWindow: BrowserWindow | null = null
let presentationWindow: BrowserWindow | null = null

function createOperatorWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    title: 'GloryBridge — Operator',
    backgroundColor: '#020617',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function createPresentationWindow(): BrowserWindow {
  const displays = screen.getAllDisplays()
  const externalDisplay = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0)
  const targetDisplay = externalDisplay || displays[0]

  const win = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: !!externalDisplay,
    frame: false,
    show: false,
    title: 'GloryBridge — Output',
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => win.show())

  // Auto-reopen if closed unexpectedly
  win.on('closed', () => {
    presentationWindow = null
    if (operatorWindow && !operatorWindow.isDestroyed()) {
      presentationWindow = createPresentationWindow()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/presentation')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/presentation' })
  }

  return win
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function broadcastState(): void {
  operatorWindow?.webContents.send('presentation:state-update', presentationState)
  presentationWindow?.webContents.send('presentation:state-update', presentationState)
}

ipcMain.handle('presentation:get-state', () => presentationState)

ipcMain.handle('presentation:next-slide', () => {
  presentationState = { ...presentationState, currentSlideIndex: presentationState.currentSlideIndex + 1 }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:prev-slide', () => {
  const next = Math.max(0, presentationState.currentSlideIndex - 1)
  presentationState = { ...presentationState, currentSlideIndex: next }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:next-item', () => {
  presentationState = {
    ...presentationState,
    currentItemIndex: presentationState.currentItemIndex + 1,
    currentSlideIndex: 0
  }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:prev-item', () => {
  const next = Math.max(0, presentationState.currentItemIndex - 1)
  presentationState = { ...presentationState, currentItemIndex: next, currentSlideIndex: 0 }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:go-to-item', (_e, { itemIndex }: { itemIndex: number }) => {
  presentationState = { ...presentationState, currentItemIndex: itemIndex, currentSlideIndex: 0 }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:go-to-slide', (_e, { slideIndex }: { slideIndex: number }) => {
  presentationState = { ...presentationState, currentSlideIndex: slideIndex }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:toggle-blank', () => {
  presentationState = { ...presentationState, isBlank: !presentationState.isBlank, isLogo: false }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:toggle-logo', () => {
  presentationState = { ...presentationState, isLogo: !presentationState.isLogo, isBlank: false }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:set-languages', (_e, { languages }: { languages: string[] }) => {
  presentationState = {
    ...presentationState,
    activeLanguages: languages,
    bilingualMode: languages.length > 1
  }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:toggle-loop', () => {
  presentationState = { ...presentationState, loopCurrent: !presentationState.loopCurrent }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:go-live', (_e, { serviceId }: { serviceId: string }) => {
  presentationState = {
    ...presentationState,
    isLive: true,
    currentServiceId: serviceId,
    currentItemIndex: 0,
    currentSlideIndex: 0,
    isBlank: false,
    isLogo: false
  }
  broadcastState()
  return presentationState
})

ipcMain.handle('presentation:end-service', () => {
  presentationState = {
    ...presentationState,
    isLive: false,
    isBlank: true
  }
  broadcastState()
  return presentationState
})

ipcMain.handle('display:get-monitors', () => {
  return screen.getAllDisplays().map((d, i) => ({
    index: i,
    label: `Display ${i + 1} (${d.bounds.width}x${d.bounds.height})`,
    bounds: d.bounds,
    isPrimary: d.bounds.x === 0 && d.bounds.y === 0
  }))
})

// ─── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.church.glorybridge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── Start backend server ──
  try {
    initDb(app.getPath('userData'))
    const server = createApp()
    server.listen(SERVER_PORT, '127.0.0.1', () => {
      console.log(`GloryBridge server running on http://127.0.0.1:${SERVER_PORT}`)
    })
  } catch (err) {
    console.error('Failed to start backend server:', err)
  }

  operatorWindow = createOperatorWindow()
  presentationWindow = createPresentationWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      operatorWindow = createOperatorWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
