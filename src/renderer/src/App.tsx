import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import OperatorWindow from './windows/OperatorWindow'
import PresentationWindow from './windows/PresentationWindow'
import { usePresentationStore } from './store/usePresentationStore'
import { useAppStore } from './store/useAppStore'
import { api } from './api/client'

export default function App(): JSX.Element {
  const syncState = usePresentationStore((s) => s.syncState)
  const setBackendOnline = useAppStore((s) => s.setBackendOnline)

  // Subscribe to IPC state updates from Electron main process
  useEffect(() => {
    if (!window.electron) return
    const unsub = window.electron.presentation.onStateUpdate((state) => {
      syncState(state)
    })
    // Hydrate initial state
    window.electron.presentation.getState().then(syncState)
    return unsub
  }, [syncState])

  // Poll backend health
  useEffect(() => {
    const check = async (): Promise<void> => {
      try {
        await api.health.check()
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [setBackendOnline])

  return (
    <Routes>
      <Route path="/" element={<OperatorWindow />} />
      <Route path="/presentation" element={<PresentationWindow />} />
    </Routes>
  )
}
