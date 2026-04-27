import Sidebar from '../components/Sidebar'
import ServicePlanner from '../components/ServicePlanner'
import MediaLibrary from '../components/MediaLibrary'
import ScriptureSearch from '../components/ScriptureSearch'
import Settings from '../components/Settings'
import PresentationControls from '../components/PresentationControls'
import ToastContainer from '../components/ui/Toast'
import { useAppStore } from '../store/useAppStore'

export default function OperatorWindow(): JSX.Element {
  const activeSection = useAppStore((s) => s.activeSection)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Left sidebar — navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {activeSection === 'service' && <ServicePlanner />}
        {activeSection === 'media' && <MediaLibrary />}
        {activeSection === 'scripture' && <ScriptureSearch />}
        {activeSection === 'settings' && <Settings />}
      </main>

      {/* Right panel — live presentation controls */}
      <PresentationControls />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
