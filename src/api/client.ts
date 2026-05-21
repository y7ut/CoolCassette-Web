import type { CoolCassetteAPI } from './types'
import wailsClient from './wails-client'
import { httpClient } from './http-client'

export type {
  AlbumDetail,
  AlbumItem,
  AlbumListResponse,
  ClearCacheResponse,
  BuildBatchEnqueueResponse,
  BuildEnqueueResponse,
  BuildJob,
  BuildJobStatus,
  BuildQueueResponse,
  BuildQueueStatusFilter,
  BuildTaskType,
  CoolCassetteAPI,
  FSBrowseResponse,
  LibraryStatus,
  MusicFile,
  ReelAtlasFrame,
  ReelConfig,
  ReloadRequest,
  ReloadResponse,
  FSEntry,
} from './types'

const active: CoolCassetteAPI =
  import.meta.env.VITE_TRANSPORT === 'wails' ? wailsClient : httpClient

export const getLibraryStatus = () => active.getLibraryStatus()
export const postReload = (body?: Parameters<CoolCassetteAPI['postReload']>[0]) =>
  active.postReload(body)
export const postClearCache = () => active.postClearCache()
export const browseFS = (dirPath: string) => active.browseFS(dirPath)
export const getAlbums = (params: Parameters<CoolCassetteAPI['getAlbums']>[0]) =>
  active.getAlbums(params)
export const getAlbumDetail = (id: string) => active.getAlbumDetail(id)
export const postPreview = (id: string, force?: boolean) => active.postPreview(id, force)
export const postPublish = (id: string, force?: boolean) => active.postPublish(id, force)
export const postPreviewAsync = (id: string, force?: boolean) => active.postPreviewAsync(id, force)
export const postPublishAsync = (id: string, force?: boolean) => active.postPublishAsync(id, force)
export const postPreviewBatchAsync = (ids: string[], force?: boolean) => active.postPreviewBatchAsync(ids, force)
export const postPublishBatchAsync = (ids: string[], force?: boolean) => active.postPublishBatchAsync(ids, force)
export const getBuildJob = (jobID: string) => active.getBuildJob(jobID)
export const getBuildQueue = (status?: Parameters<CoolCassetteAPI['getBuildQueue']>[0]) => active.getBuildQueue(status)
export const setIndexVersion = (v: string, h: string) => active.setIndexVersion(v, h)
export const getIndexVersion = () => active.getIndexVersion()
export const clearIndexVersion = () => active.clearIndexVersion()

export function getIndexHeaders(): Record<string, string> {
  const { version, hash } = active.getIndexVersion()
  const h: Record<string, string> = {}
  if (version) h['X-CoolCassette-Index-Version'] = version
  if (hash) h['X-CoolCassette-Index-Hash'] = hash
  return h
}
