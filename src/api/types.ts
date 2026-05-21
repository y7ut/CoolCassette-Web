export interface LibraryStatus {
  index_version: string
  index_hash: string
  album_count: number
  music_dirs: string[]
  wampy_dir: string
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

export interface ReloadRequest {
  music_dirs?: string[]
  wampy_dir?: string
}

export interface ReloadResponse {
  accepted: boolean
  scan_id: string
  index_version: string
  index_hash: string
  scanning: boolean
}

export interface ClearCacheResponse {
  files_removed: number
  bytes_freed: number
  cache_dir: string
}

export type BuildTaskType = 'preview' | 'publish'
export type BuildJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
export type BuildQueueStatusFilter = 'all' | 'waiting' | 'done'

export interface BuildJob {
  id: string
  type: BuildTaskType
  album_id: string
  album_name?: string
  force: boolean
  status: BuildJobStatus
  queue_position?: number
  created_at: string
  started_at?: string
  finished_at?: string
  result?: AlbumDetail
  error?: string
}

export interface BuildEnqueueResponse {
  accepted: boolean
  job: BuildJob
}

export interface BuildBatchEnqueueResponse {
  accepted: boolean
  jobs: BuildJob[]
}

export interface BuildQueueResponse {
  max_running: number
  max_waiting: number
  running: number
  waiting: number
  jobs: BuildJob[]
}

export interface FSEntry {
  name: string
  path: string
  is_dir: boolean
}

export interface FSBrowseResponse {
  path: string
  parent: string
  entries: FSEntry[]
}

export interface CoolCassetteAPI {
  getLibraryStatus(): Promise<LibraryStatus>
  postReload(body?: ReloadRequest): Promise<ReloadResponse>
  postClearCache(): Promise<ClearCacheResponse>
  browseFS(dirPath: string): Promise<FSBrowseResponse>
  getAlbums(params: {
    limit?: number
    sort_by?: string
    order?: string
    cursor?: string
    q?: string
  }): Promise<AlbumListResponse>
  getAlbumDetail(id: string): Promise<AlbumDetail>
  postPreview(id: string, force?: boolean): Promise<AlbumDetail>
  postPublish(id: string, force?: boolean): Promise<AlbumDetail>
  postPreviewAsync(id: string, force?: boolean): Promise<BuildEnqueueResponse>
  postPublishAsync(id: string, force?: boolean): Promise<BuildEnqueueResponse>
  postPreviewBatchAsync(ids: string[], force?: boolean): Promise<BuildBatchEnqueueResponse>
  postPublishBatchAsync(ids: string[], force?: boolean): Promise<BuildBatchEnqueueResponse>
  getBuildJob(jobID: string): Promise<BuildJob>
  getBuildQueue(status?: BuildQueueStatusFilter): Promise<BuildQueueResponse>
  setIndexVersion(v: string, h: string): void
  getIndexVersion(): { version: string; hash: string }
  clearIndexVersion(): void
}
