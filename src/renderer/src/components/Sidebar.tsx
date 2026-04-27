import { LayoutList, Music, BookOpen, Settings, Wifi, WifiOff, Radio } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { NavSection } from '../types'

interface NavItem {
  id: NavSection
  icon: JSX.Element
  label: string
}

const navItems: NavItem[] = [
  { id: 'service', icon: <LayoutList size={20} />, label: 'Service' },
  { id: 'media', icon: <Music size={20} />, label: 'Media' },
  { id: 'scripture', icon: <BookOpen size={20} />, label: 'Scripture' },
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings' }
]

export default function Sidebar(): JSX.Element {
  const { activeSection, setSection, backendOnline, streamOnline } = useAppStore()

  return (
    <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-1 shrink-0">
      {/* Logo */}
      <div className="mb-3 mt-1">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
          <span className="text-white font-bold text-sm">GB</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            title={label}
            className={[
              'flex flex-col items-center justify-center gap-1 w-full py-2.5 rounded-xl text-[10px] font-medium transition-colors duration-150',
              activeSection === id
                ? 'bg-brand-600/20 text-brand-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Status indicators */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <StatusDot label="Backend" online={backendOnline} icon={<Wifi size={12} />} />
        <StatusDot label="Stream" online={streamOnline} icon={<Radio size={12} />} />
      </div>
    </aside>
  )
}

function StatusDot({
  online,
  label,
  icon
}: {
  online: boolean
  label: string
  icon: JSX.Element
}): JSX.Element {
  return (
    <div
      title={`${label}: ${online ? 'Connected' : 'Offline'}`}
      className={`flex items-center justify-center w-7 h-7 rounded-lg ${
        online ? 'text-green-400 bg-green-900/20' : 'text-slate-600 bg-slate-800'
      }`}
    >
      {online ? icon : <WifiOff size={12} />}
    </div>
  )
}
