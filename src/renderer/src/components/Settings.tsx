import { useState, useEffect } from 'react'
import { Monitor, Globe, Type, Youtube, Facebook, Key, Save, Loader2, RefreshCw } from 'lucide-react'
import Button from './ui/Button'
import { api } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import type { AppSettings, MonitorInfo } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  'display.outputMonitorIndex': 1,
  'display.defaultLanguage': 'en',
  'display.fallbackLanguage': 'en',
  'ai.apiKey': '',
  'stream.youtubeKey': '',
  'stream.facebookKey': '',
  'presentation.defaultFontSize': 48
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [monitors, setMonitors] = useState<MonitorInfo[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useAppStore()

  useEffect(() => {
    loadSettings()
    loadMonitors()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      const data = await api.settings.get()
      setSettings(data)
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false)
    }
  }

  const loadMonitors = async (): Promise<void> => {
    if (window.electron) {
      const m = await window.electron.display.getMonitors()
      setMonitors(m)
    }
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    try {
      await api.settings.update(settings)
      addToast('Settings saved', 'success')
    } catch {
      addToast('Failed to save settings (backend offline)', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <h2 className="font-semibold text-slate-100">Settings</h2>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Display */}
        <Section icon={<Monitor size={16} />} title="Display">
          <div className="space-y-3">
            <Field label="Output Monitor">
              <div className="flex items-center gap-2">
                <select
                  className="input flex-1"
                  value={settings['display.outputMonitorIndex']}
                  onChange={(e) => set('display.outputMonitorIndex', Number(e.target.value))}
                >
                  {monitors.length > 0 ? (
                    monitors.map((m) => (
                      <option key={m.index} value={m.index}>
                        {m.label} {m.isPrimary ? '(Primary)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={0}>Display 1 (Primary)</option>
                      <option value={1}>Display 2 (Output)</option>
                    </>
                  )}
                </select>
                <button
                  onClick={loadMonitors}
                  className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Refresh monitors"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* Language */}
        <Section icon={<Globe size={16} />} title="Language">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default Language">
              <select
                className="input"
                value={settings['display.defaultLanguage']}
                onChange={(e) => set('display.defaultLanguage', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
              </select>
            </Field>
            <Field label="Fallback Language">
              <select
                className="input"
                value={settings['display.fallbackLanguage']}
                onChange={(e) => set('display.fallbackLanguage', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Typography */}
        <Section icon={<Type size={16} />} title="Presentation Typography">
          <Field label={`Default Font Size: ${settings['presentation.defaultFontSize']}px`}>
            <input
              type="range"
              min={24}
              max={96}
              step={4}
              value={settings['presentation.defaultFontSize']}
              onChange={(e) => set('presentation.defaultFontSize', Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>24px</span>
              <span>96px</span>
            </div>
          </Field>
        </Section>

        {/* AI */}
        <Section icon={<Key size={16} />} title="AI Integration">
          <Field label="Anthropic API Key">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={settings['ai.apiKey']}
              onChange={(e) => set('ai.apiKey', e.target.value)}
              className="input font-mono"
            />
          </Field>
          <p className="text-xs text-slate-500 mt-2">
            Used for AI song translation, scripture search suggestions, and song generation.
          </p>
        </Section>

        {/* Streaming */}
        <Section icon={<Youtube size={16} />} title="Streaming (Phase 2)">
          <div className="space-y-3">
            <Field label="YouTube Stream Key">
              <div className="relative">
                <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                <input
                  type="password"
                  placeholder="YouTube stream key"
                  value={settings['stream.youtubeKey']}
                  onChange={(e) => set('stream.youtubeKey', e.target.value)}
                  className="input pl-8 font-mono"
                />
              </div>
            </Field>
            <Field label="Facebook Stream Key">
              <div className="relative">
                <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                <input
                  type="password"
                  placeholder="Facebook stream key"
                  value={settings['stream.facebookKey']}
                  onChange={(e) => set('stream.facebookKey', e.target.value)}
                  className="input pl-8 font-mono"
                />
              </div>
            </Field>
          </div>
          <div className="mt-3 bg-slate-800 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500">
              Streaming integration is coming in Phase 2. Keys are saved securely for when it's ready.
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children
}: {
  icon: JSX.Element
  title: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 space-y-3">
        {children}
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
