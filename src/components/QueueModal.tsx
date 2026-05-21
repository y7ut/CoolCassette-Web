import { useEffect, useState } from 'react'
import { X, Loader2, Check, AlertCircle, Clock, Zap, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBuildStore } from '../stores/buildStore'
import type { BuildJob, BuildJobStatus, BuildTaskType } from '../stores/buildStore'

interface QueueModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'active' | 'history'

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BuildJobStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  queued:    { label: 'QUEUED',   className: 'text-dim border-dim',              icon: <Clock       size={10} /> },
  running:   { label: 'RUNNING',  className: 'text-accent border-accent',         icon: <Loader2     size={10} className="animate-spin" /> },
  succeeded: { label: 'DONE',     className: 'text-green-400 border-green-400',   icon: <Check       size={10} /> },
  failed:    { label: 'FAILED',   className: 'text-red-400 border-red-400',       icon: <AlertCircle size={10} /> },
  canceled:  { label: 'CANCELED', className: 'text-text-muted border-text-muted', icon: <X           size={10} /> },
}

const TYPE_CONFIG: Record<BuildTaskType, { label: string; className: string }> = {
  preview: { label: 'PREVIEW', className: 'text-orange-400' },
  publish: { label: 'PUBLISH', className: 'text-accent' },
}

function StatusBadge({ status }: { status: BuildJobStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] tracking-wider font-mono ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Job row ──────────────────────────────────────────────────────────────────

function JobRow({ job, onClose }: { job: BuildJob; onClose: () => void }) {
  const typeCfg = TYPE_CONFIG[job.type]
  // Cover is always available via album_id — no need to check has_cover
  const coverUrl = `/api/albums/${job.album_id}/assets/cover.png`

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">

      {/* Cover thumbnail — always rendered */}
      <div className="w-10 h-10 shrink-0 bg-[#111] border border-border overflow-hidden">
        <img
          src={coverUrl}
          alt={job.album_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
            el.parentElement!.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:VT323,monospace;font-size:10px;color:#2a2a2a">NO</span>'
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text truncate leading-tight" title={job.album_name || job.album_id}>
          {job.album_name || job.album_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] tracking-wider font-mono ${typeCfg.className}`}>
            {typeCfg.label}
          </span>
          {job.status === 'running' && (
            <span className="text-[9px] text-dim font-mono flex items-center gap-1">
              <Zap size={9} className="text-accent" /> ACTIVE
            </span>
          )}
          {job.queue_position !== undefined && (
            <span className="text-[9px] text-dim font-mono">#{job.queue_position}</span>
          )}
        </div>
        {job.error && (
          <p className="text-[10px] text-red-400 mt-0.5 truncate" title={job.error}>
            {job.error}
          </p>
        )}
      </div>

      {/* Right: status + detail link */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge status={job.status} />
        <Link
          to={`/album/${job.album_id}`}
          onClick={onClose}
          className="inline-flex items-center gap-0.5 text-[9px] text-dim hover:text-accent transition-colors font-mono tracking-wider"
          title="View album detail"
        >
          <ExternalLink size={9} />
          DETAIL
        </Link>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function QueueModal({ open, onClose }: QueueModalProps) {
  const [tab, setTab] = useState<Tab>('active')

  const activeJobs  = useBuildStore((s) => s.queue?.jobs)
  const historyJobs = useBuildStore((s) => s.historyQueue?.jobs)
  const refresh        = useBuildStore((s) => s.refresh)
  const refreshHistory = useBuildStore((s) => s.refreshHistory)

  // On open: fetch both tabs immediately
  useEffect(() => {
    if (!open) return
    refresh()
    refreshHistory()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // When switching to history tab, refresh it
  useEffect(() => {
    if (open && tab === 'history') refreshHistory()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const sortJobs = (jobs: BuildJob[]) =>
    [...jobs].sort((a, b) => {
      const order: Record<string, number> = { running: 0, queued: 1, succeeded: 2, failed: 2, canceled: 2 }
      const ao = order[a.status] ?? 3
      const bo = order[b.status] ?? 3
      if (ao !== bo) return ao - bo
      if (a.queue_position !== undefined && b.queue_position !== undefined) {
        return a.queue_position - b.queue_position
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const displayJobs = sortJobs(tab === 'active' ? (activeJobs ?? []) : (historyJobs ?? []))

  const handleRefresh = () => {
    if (tab === 'active') refresh()
    else refreshHistory()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Centered dialog */}
      <div className="fixed inset-0 z-[165] flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg mx-4 bg-surface border border-border shadow-2xl fade-in flex flex-col"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="font-display text-xl text-accent tracking-wider">TASKS</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="text-dim hover:text-accent transition-colors p-1"
                title="Refresh"
              >
                <Loader2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="text-dim hover:text-text transition-colors p-1"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(['active', 'history'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[10px] tracking-widest uppercase font-mono transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? 'text-accent border-accent'
                    : 'text-dim border-transparent hover:text-text-muted'
                }`}
              >
                {t === 'active' ? 'ACTIVE' : 'HISTORY'}
              </button>
            ))}
          </div>

          {/* Job list */}
          <div className="overflow-y-auto flex-1 px-4">
            {displayJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <p className="font-display text-2xl text-dim tracking-wider">EMPTY</p>
                <p className="text-[11px] text-text-muted mt-2 font-mono">
                  {tab === 'active' ? 'No active jobs' : 'No history yet'}
                </p>
              </div>
            ) : (
              displayJobs.map((job) => <JobRow key={job.id} job={job} onClose={onClose} />)
            )}
          </div>
        </div>
      </div>
    </>
  )
}
