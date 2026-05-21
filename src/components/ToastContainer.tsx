import { useState, useEffect } from 'react'
import { Copy, Check, X } from 'lucide-react'
import { useToastStore, type ToastType, type ToastBorderSide } from '../stores/toastStore'
import type { Toast } from '../stores/toastStore'

const borderSideColorMap: Record<ToastType, Record<ToastBorderSide, string>> = {
  error: { left: 'border-l-red-500', top: 'border-t-red-500' },
  success: { left: 'border-l-accent', top: 'border-t-accent' },
  info: { left: 'border-l-dim', top: 'border-t-dim' },
}

function truncate(msg: string, max = 120): string {
  if (msg.length <= max) return msg
  return msg.slice(0, max) + '...'
}

/**
 * ToastContainer
 *
 * Layout strategy:
 * - "center" toasts: full-screen overlay (unchanged, for blocking errors)
 * - "top-right" toasts: stacked column at TOP-LEFT so they never overlap
 *   the FabDrawer toggle on the right edge.
 *   Stack order: newest on top, older ones push down.
 */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  const centerToasts = toasts.filter((t) => t.position === 'center')
  const stackedToasts = toasts.filter((t) => t.position !== 'center')

  return (
    <>
      {/* Stacked non-center toasts — top-left column */}
      {stackedToasts.length > 0 && (
        <div
          className="fixed top-14 left-3 z-[190] flex flex-col gap-2 pointer-events-none"
          style={{ maxWidth: '300px' }}
        >
          {stackedToasts.map((t) => {
            const borderColor = borderSideColorMap[t.type][t.borderSide]
            return (
              <div key={t.id} className="pointer-events-auto">
                <ToastItem
                  toast={t}
                  borderColor={borderColor}
                  onDismiss={() => removeToast(t.id)}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Center / blocking toasts */}
      {centerToasts.map((t) => {
        const borderColor = borderSideColorMap[t.type][t.borderSide]
        return (
          <div
            key={t.id}
            className="fixed inset-0 z-[200] flex items-center justify-center"
          >
            <ToastItem
              toast={t}
              borderColor={borderColor}
              onDismiss={() => removeToast(t.id)}
            />
          </div>
        )
      })}
    </>
  )
}

function ToastItem({
  toast: t,
  borderColor,
  onDismiss,
}: {
  toast: Toast
  borderColor: string
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  // Auto-dismiss non-error toasts after 4 s
  useEffect(() => {
    if (t.type === 'error') return
    const timer = setTimeout(onDismiss, 4_000)
    return () => clearTimeout(timer)
  }, [t.id, t.type, onDismiss])

  const handleCopy = () => {
    navigator.clipboard.writeText(t.message).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className={`border border-border ${
        t.borderSide === 'left' ? 'border-l-2' : 'border-t-2'
      } ${borderColor} bg-surface/90 backdrop-blur-sm px-3 py-2.5 fade-in relative max-w-xs w-full`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-1.5 right-1.5 text-dim hover:text-text-muted"
        title="Dismiss"
      >
        <X size={14} />
      </button>
      <p
        className="pr-4 text-xs leading-relaxed text-text"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {truncate(t.message)}
      </p>
      <div className="flex justify-end mt-1.5">
        <button
          onClick={handleCopy}
          className="text-dim hover:text-text-muted flex items-center gap-1"
          title="Copy"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
      </div>
    </div>
  )
}
