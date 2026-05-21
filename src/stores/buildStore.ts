import { create } from 'zustand'
import type { QueryClient } from '@tanstack/react-query'
import {
  getBuildQueue,
  postPreviewAsync,
  postPublishAsync,
  clearIndexVersion,
} from '../api/client'
import type {
  BuildJob,
  BuildJobStatus,
  BuildQueueResponse,
  BuildTaskType,
} from '../api/types'
import { toast } from './toastStore'

export type { BuildJob, BuildJobStatus, BuildTaskType, BuildQueueResponse }

// ─── State shape ─────────────────────────────────────────────────────────────

interface BuildState {
  /** Full job map from last poll (all statuses) */
  albumJobs: Record<string, BuildJob>
  /** Raw queue response — for QueueModal active tab */
  queue: BuildQueueResponse | null
  /** Raw all-jobs response — for QueueModal history tab */
  historyQueue: BuildQueueResponse | null
  /** Interval handle, null when stopped */
  intervalHandle: ReturnType<typeof setInterval> | null
  /** Injected QueryClient — set once from App via registerQueryClient() */
  _queryClient: QueryClient | null

  registerQueryClient(qc: QueryClient): void
  startPolling(): void
  stopPolling(): void
  refresh(): Promise<void>
  refreshHistory(): Promise<void>
  enqueue(albumId: string, type: BuildTaskType, force?: boolean): Promise<BuildJob>
  getAlbumJob(albumId: string): BuildJob | undefined
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TERMINAL: BuildJobStatus[] = ['succeeded', 'failed', 'canceled']
const isTerminal = (s: BuildJobStatus) => TERMINAL.includes(s)

function notifyJobFinished(job: BuildJob) {
  const name = job.album_name || job.album_id
  const op = job.type === 'preview' ? 'Preview' : 'Publish'
  if (job.status === 'succeeded') {
    toast(`${op} complete: ${name}`, { type: 'success' })
  } else if (job.status === 'failed') {
    const reason = job.error ? `: ${job.error}` : ''
    toast(`${op} failed: ${name}${reason}`, { type: 'error' })
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useBuildStore = create<BuildState>((set, get) => ({
  albumJobs: {},
  queue: null,
  historyQueue: null,
  intervalHandle: null,
  _queryClient: null,

  registerQueryClient(qc) {
    set({ _queryClient: qc })
  },

  startPolling() {
    if (get().intervalHandle !== null) return
    get().refresh()
    const handle = setInterval(() => get().refresh(), 5_000)
    set({ intervalHandle: handle })
  },

  stopPolling() {
    const { intervalHandle } = get()
    if (intervalHandle !== null) clearInterval(intervalHandle)
    set({ intervalHandle: null })
  },

  async refresh() {
    try {
      // Fetch ALL jobs so albumJobs retains completed entries across poll cycles.
      // The `waiting` filter was causing succeeded jobs to disappear before
      // components could react to the status transition.
      const queue = await getBuildQueue('all')
      const prev = get().albumJobs

      // Build next map: one entry per album, keep the most recently created job
      const next: Record<string, BuildJob> = {}
      for (const job of queue.jobs) {
        const existing = next[job.album_id]
        if (!existing || new Date(job.created_at) > new Date(existing.created_at)) {
          next[job.album_id] = job
        }
      }

      // Detect active → terminal transitions
      let anyFinished = false
      for (const [albumId, job] of Object.entries(next)) {
        const prevJob = prev[albumId]
        if (isTerminal(job.status) && prevJob && !isTerminal(prevJob.status)) {
          notifyJobFinished(job)
          anyFinished = true
        }
      }

      if (anyFinished) {
        // Index changed on server — drop our cached version so album list
        // fetches fresh data, then invalidate to trigger the refetch.
        clearIndexVersion()
        get()._queryClient?.invalidateQueries({ queryKey: ['albums'] })
      }

      // Expose the "active only" slice for QueueModal's active tab
      const activeJobs = queue.jobs.filter((j) => !isTerminal(j.status))
      const activeQueue: BuildQueueResponse = { ...queue, jobs: activeJobs }

      set({ queue: activeQueue, albumJobs: next })

      const hasActive = Object.values(next).some((j) => !isTerminal(j.status))
      if (!hasActive) get().stopPolling()
    } catch {
      // Ignore transient poll failures silently
    }
  },

  async refreshHistory() {
    try {
      const historyQueue = await getBuildQueue('done')
      set({ historyQueue })
    } catch {
      // Ignore
    }
  },

  async enqueue(albumId, type, force) {
    const fn = type === 'preview' ? postPreviewAsync : postPublishAsync
    const resp = await fn(albumId, force)
    const job = resp.job
    set((s) => ({ albumJobs: { ...s.albumJobs, [albumId]: job } }))
    get().startPolling()
    return job
  },

  getAlbumJob(albumId) {
    return get().albumJobs[albumId]
  },
}))

// ─── Convenience selector hooks ──────────────────────────────────────────────

export function useAlbumJob(albumId: string): BuildJob | undefined {
  return useBuildStore((s) => s.albumJobs[albumId])
}

export function useAlbumPending(albumId: string): boolean {
  const job = useAlbumJob(albumId)
  return job !== undefined && !isTerminal(job.status)
}
