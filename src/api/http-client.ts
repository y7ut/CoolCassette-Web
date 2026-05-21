import type {
  AlbumDetail,
  AlbumListResponse,
  ClearCacheResponse,
  CoolCassetteAPI,
  FSBrowseResponse,
  LibraryStatus,
  ReloadRequest,
  ReloadResponse,
} from './types'

const API_BASE = ''

let currentIndexVersion = ''
let currentIndexHash = ''

function setIndexVersion(v: string, h: string) {
  currentIndexVersion = v
  currentIndexHash = h
}

function getIndexVersion() {
  return { version: currentIndexVersion, hash: currentIndexHash }
}

function clearIndexVersion() {
  currentIndexVersion = ''
  currentIndexHash = ''
}

function getIndexHeaders(): Record<string, string> {
  const h: Record<string, string> = {}
  if (currentIndexVersion) h['X-CoolCassette-Index-Version'] = currentIndexVersion
  if (currentIndexHash) h['X-CoolCassette-Index-Hash'] = currentIndexHash
  return h
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  })

  if (res.status === 409) {
    const body = await res.json()
    if (body.index_version && body.index_hash) {
      setIndexVersion(body.index_version, body.index_hash)
    } else {
      clearIndexVersion()
    }
    const err = new Error(body.error || 'index content changed')
    ;(err as any).code = 409
    ;(err as any).body = body
    throw err
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const iv = res.headers.get('X-CoolCassette-Index-Version')
  const ih = res.headers.get('X-CoolCassette-Index-Hash')
  if (iv && ih) setIndexVersion(iv, ih)

  return res.json()
}

export const httpClient: CoolCassetteAPI = {
  getLibraryStatus(): Promise<LibraryStatus> {
    return apiFetch('/api/library/status')
  },

  postReload(body?: ReloadRequest): Promise<ReloadResponse> {
    return apiFetch('/api/library/reload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  postClearCache(): Promise<ClearCacheResponse> {
    return apiFetch('/api/library/clear-cache', {
      method: 'POST',
    })
  },

  browseFS(dirPath: string): Promise<FSBrowseResponse> {
    return apiFetch(`/api/fs/browse?path=${encodeURIComponent(dirPath)}`)
  },

  getAlbums(params: {
    limit?: number
    sort_by?: string
    order?: string
    cursor?: string
    q?: string
  }): Promise<AlbumListResponse> {
    const sp = new URLSearchParams()
    if (params.limit) sp.set('limit', String(params.limit))
    if (params.sort_by) sp.set('sort_by', params.sort_by)
    if (params.order) sp.set('order', params.order)
    if (params.cursor) sp.set('cursor', params.cursor)
    if (params.q) sp.set('q', params.q)
    return apiFetch(`/api/albums?${sp.toString()}`, {
      headers: getIndexHeaders(),
    })
  },

  getAlbumDetail(id: string): Promise<AlbumDetail> {
    return apiFetch(`/api/albums/${id}`)
  },

  postPreview(id: string, force = false): Promise<AlbumDetail> {
    return apiFetch(`/api/albums/${id}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    })
  },

  postPublish(id: string, force = false): Promise<AlbumDetail> {
    return apiFetch(`/api/albums/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    })
  },

  postPreviewAsync(id: string, force = false) {
    return apiFetch(`/api/albums/${id}/preview/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    })
  },

  postPublishAsync(id: string, force = false) {
    return apiFetch(`/api/albums/${id}/publish/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    })
  },

  postPreviewBatchAsync(ids: string[], force = false) {
    return apiFetch('/api/build/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ album_ids: ids, force }),
    })
  },

  postPublishBatchAsync(ids: string[], force = false) {
    return apiFetch('/api/build/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ album_ids: ids, force }),
    })
  },

  getBuildJob(jobID: string) {
    return apiFetch(`/api/build/jobs/${jobID}`)
  },

  getBuildQueue(status = 'all') {
    const sp = new URLSearchParams()
    if (status && status !== 'all') sp.set('status', status)
    const qs = sp.toString()
    return apiFetch(`/api/build/queue${qs ? `?${qs}` : ''}`)
  },

  setIndexVersion,
  getIndexVersion,
  clearIndexVersion,
}
