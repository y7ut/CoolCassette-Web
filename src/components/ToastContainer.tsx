import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'
import { useToastStore, type ToastType, type ToastBorderSide } from '../stores/toastStore'

const borderSideColorMap: Record<ToastType, Record<ToastBorderSide, string>> = {
  error: { left: 'border-l-red-500', top: 'border-t-red-500' },
  success: { left: 'border-l-accent', top: 'border-t-accent' },
  info: { left: 'border-l-dim', top: 'border-t-dim' },
}

function truncate(msg: string, max = 120): string {
  if (msg.length <= max) return msg
  return msg.slice(0, max) + '...'
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <>
      {toasts.map((t) => {
        const isCenter = t.position === 'center'
        const borderColor = borderSideColorMap[t.type][t.borderSide]
        return (
          <div key={t.id} className={isCenter ? 'fixed inset-0 z-[200] flex items-center justify-center' : 'contents'}>
            <ToastItem toast={t} borderColor={borderColor} onDismiss={() => removeToast(t.id)} />
          </div>
        )
      })}
    </>
  )
}

function ToastItem({ toast: t, borderColor, onDismiss }: { toast: { id: number; message: string; borderSide: ToastBorderSide }; borderColor: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(t.message).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className={`border border-border border-l-0 border-t-0 ${t.borderSide === 'left' ? 'border-l-2' : 'border-t-2'} ${borderColor} bg-surface/80 backdrop-blur-sm px-3 py-2.5 fade-in relative max-w-xs`}
    >
      <button onClick={onDismiss} className="absolute top-1.5 right-1.5 text-dim hover:text-text-muted" title="Dismiss">
        <X size={14} />
      </button>
      <p className="pr-4 text-xs leading-relaxed text-text" style={{ fontFamily: "'Space Mono', monospace" }}>
        {truncate(t.message)}
      </p>
      <div className="flex justify-end mt-1.5">
        <button onClick={handleCopy} className="text-dim hover:text-text-muted flex items-center gap-1" title="Copy">
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
      </div>
    </div>
  )
}
