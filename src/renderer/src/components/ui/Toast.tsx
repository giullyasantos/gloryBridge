import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Toast as ToastItem } from '../../types'

const icons = {
  success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  error: <XCircle size={16} className="text-red-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
}

const colors = {
  success: 'border-green-700/50 bg-green-900/30',
  error: 'border-red-700/50 bg-red-900/30',
  info: 'border-blue-700/50 bg-blue-900/30',
  warning: 'border-yellow-700/50 bg-yellow-900/30'
}

function ToastItem({ toast }: { toast: ToastItem }): JSX.Element {
  const removeToast = useAppStore((s) => s.removeToast)

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl ${colors[toast.type]} animate-fade-in`}
    >
      {icons[toast.type]}
      <span className="text-sm text-slate-200 flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-500 hover:text-slate-300 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer(): JSX.Element {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
