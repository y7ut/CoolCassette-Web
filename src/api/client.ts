const API_BASE = '' // proxied via vite to http://127.0.0.1:7350

export interface LibraryStatus {
  index_version: string
  index_hash: string
  album_count: number
  scanning: boolean
  scan_id: string
  scan_started_at: string
  scan_finished_at: string
  scanned_albums: number
  total_albums: number
  scan_error?: string
}

export interface AlbumItem {
  id: string
  dir: string
  name: string
  slug: string
  artist: string
  album: string
  track_count: number
  status: 'built' | 'preview_ready' | 'not_built'
  has_cover: boolean
  cassette_ref_valid: boolean
  cover_url: string
  created_at: string
  modified_at: string
}

export interface AlbumListResponse {
  items: AlbumItem[]
  next_cursor: string | null
  has_more: boolean
  index_version: string
  index_hash: string
}

export interface MusicFile {
  name: string
  path: string
  title?: string
  artist?: string
  album?: string
}

export interface ReelConfig {
  reelx: number
  reely: number
  artistx: number
  artisty: number
  titlex: number
  titley: number
  albumx: number
  albumy: number
  titlewidth: number
}

export type ReelAtlasFrame = { x: number; y: number; w: number; h: number }

export interface AlbumDetail extends AlbumItem {
  music_files: MusicFile[]
  index_version: string
  index_hash: string
  published_tape_png_url?: string
  published_reel_png_url?: string
  tape_config?: ReelConfig
  reel_config?: { delayMS: number }
  reel_atlas_frames?: string[]
}

let currentIndexVersion = ''
let currentIndexHash = ''

export function getIndexHeaders(): Record<string, string> {
  const h: Record<string, string> = {}
  if (currentIndexVersion) h['X-CoolCassette-Index-Version'] = currentIndexVersion
  if (currentIndexHash) h['X-CoolCassette-Index-Hash'] = currentIndexHash
  return h
}

export function setIndexVersion(v: string, h: string) {
  currentIndexVersion = v
  currentIndexHash = h
}

export function getIndexVersion() {
  return { version: currentIndexVersion, hash: currentIndexHash }
}

export function clearIndexVersion() {
  currentIndexVersion = ''
  currentIndexHash = ''
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
    // Update to new version/hash from response body for auto-retry
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

export async function getLibraryStatus(): Promise<LibraryStatus> {
  return apiFetch('/api/library/status')
}

export async function getAlbums(params: {
  limit?: number
  sort_by?: string
  order?: string
  cursor?: string
}): Promise<AlbumListResponse> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.sort_by) sp.set('sort_by', params.sort_by)
  if (params.order) sp.set('order', params.order)
  if (params.cursor) sp.set('cursor', params.cursor)

  return apiFetch(`/api/albums?${sp.toString()}`, {
    headers: getIndexHeaders(),
  })
}

export async function getAlbumDetail(id: string): Promise<AlbumDetail> {
  return apiFetch(`/api/albums/${id}`)
}

export async function postPreview(id: string, force = false): Promise<AlbumDetail> {
  return apiFetch(`/api/albums/${id}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  })
}

export async function postPublish(id: string, force = false): Promise<AlbumDetail> {
  return apiFetch(`/api/albums/${id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  })
}
