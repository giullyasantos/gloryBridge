# GloryBridge — Orchestration Layer Requirements

## Overview
The orchestration layer is the glue between the Electron frontend, Express backend, and SQLite database. It ensures all three layers stay in sync, handles cross-cutting concerns, and manages the live presentation state machine.

In Electron's architecture this lives primarily in the **main process**, coordinating between the renderer (frontend), the local backend server, and the database via IPC and events.

---

## Responsibilities

### 1. App Lifecycle Management
- Start and stop the local Express server when the Electron app launches/quits
- Run Prisma migrations on startup before the UI loads
- Seed database on first run
- Handle graceful shutdown (flush state, close DB connections)

### 2. Presentation State Machine
The most critical piece. Tracks what is currently being shown and coordinates between the operator window and the output window.

**State shape:**
```typescript
PresentationState {
  isLive: boolean
  currentServiceId: string | null
  currentItemIndex: number
  currentSlideIndex: number
  isBlank: boolean
  isLogo: boolean
  activeLanguages: string[]   // e.g. ["en", "es"]
  bilingualMode: boolean
  loopCurrent: boolean
}
```

**State transitions:**
- `NEXT_SLIDE` / `PREV_SLIDE` — advance within current item
- `NEXT_ITEM` / `PREV_ITEM` — move to next service item
- `TOGGLE_BLANK` — black out output, preserve state
- `TOGGLE_LOGO` — show holding slide
- `SET_LANGUAGE` — change active language(s)
- `TOGGLE_LOOP` — loop current slide/item
- `GO_LIVE` / `END_SERVICE` — start/stop service mode

All transitions emit an IPC event to the presentation window to re-render.

### 3. IPC Bridge
Electron main process routes messages between renderer (React UI) and the output window.

**Channels:**
- `presentation:state-change` — push new state to output window
- `presentation:get-state` — renderer requests current state
- `service:loaded` — service plan data ready for renderer
- `media:file-ready` — media file path resolved and ready
- `settings:updated` — config change broadcast to all windows
- `error:critical` — surface errors to operator UI

### 4. Display Management
- Detect connected monitors on startup and on change
- Assign output window to the correct display (configurable)
- Handle monitor connect/disconnect gracefully (fall back to operator window)
- Remember last used display config in AppSettings

### 5. Background Services Coordinator
Manages services that run in the background:

| Service | Trigger | Managed By |
|---|---|---|
| Bible API fetch | Scripture search | Backend → Main |
| AI translation | User requests translate | Backend → Main → UI |
| Stream start/stop | Operator action | Backend |
| Socket.io server | App start | Backend |

### 6. Error Boundary & Recovery
- If backend server crashes, attempt auto-restart (max 3x)
- If DB migration fails, show clear error and prevent app from loading broken state
- If AI service is unavailable, degrade gracefully — disable AI buttons, show toast
- If output window closes unexpectedly, reopen it automatically

### 7. File System Management
- Resolve media file paths across platforms (Windows / macOS / Linux)
- Copy uploaded media to app's data directory
- Clean up orphaned media files (files in folder with no DB reference)

---

## IPC API (Main ↔ Renderer)

### From Renderer to Main
```
ipcRenderer.invoke('presentation:next-slide')
ipcRenderer.invoke('presentation:prev-slide')
ipcRenderer.invoke('presentation:next-item')
ipcRenderer.invoke('presentation:prev-item')
ipcRenderer.invoke('presentation:toggle-blank')
ipcRenderer.invoke('presentation:set-language', { languages: ['en', 'es'] })
ipcRenderer.invoke('presentation:go-live', { serviceId })
ipcRenderer.invoke('display:get-monitors')
ipcRenderer.invoke('display:set-output', { monitorIndex })
ipcRenderer.invoke('media:upload', { filePath })
```

### From Main to Renderer / Output Window
```
ipcMain → 'presentation:state-update'  (payload: PresentationState)
ipcMain → 'presentation:slide-content' (payload: SlideContent)
ipcMain → 'service:updated'            (payload: ServicePlan)
ipcMain → 'error:notify'               (payload: { message, severity })
```

---

## Data Flow: Live Presentation

```
Operator clicks "Next Slide"
        ↓
Renderer: ipcRenderer.invoke('presentation:next-slide')
        ↓
Main Process: updates PresentationState
        ↓
Main Process: resolves slide content from DB via backend
        ↓
Main Process: emits 'presentation:slide-content' to Output Window
        ↓
Output Window: renders new slide
        ↓
Main Process: emits 'presentation:state-update' to Operator Window
        ↓
Operator Window: updates slide navigator, preview
```

Total target latency: **< 50ms** from click to output render.

---

## Out of Scope for MVP
- Cloud state sync between multiple machines
- Remote operator websocket relay
- Auto-save service state to resume after crash (nice to have v2)
