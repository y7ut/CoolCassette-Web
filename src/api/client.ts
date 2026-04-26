import type { CoolCassetteAPI } from './types'
import { httpClient } from './http-client'
import wailsClient from './wails-client'

export type {
  AlbumDetail,
  AlbumItem,
  AlbumListResponse,
  ClearCacheResponse,
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

const client: CoolCassetteAPI =
  import.meta.env.VITE_TRANSPORT === 'wails' ? wailsClient : httpClient

export const getLibraryStatus = (...a: Parameters<CoolCassetteAPI['getLibraryStatus']>) =>
  client.getLibraryStatus(...a)
export const postReload = (...a: Parameters<CoolCassetteAPI['postReload']>) =>
  client.postReload(...a)
export const postClearCache = (...a: Parameters<CoolCassetteAPI['postClearCache']>) =>
  client.postClearCache(...a)
export const browseFS = (...a: Parameters<CoolCassetteAPI['browseFS']>) =>
  client.browseFS(...a)
export const getAlbums = (...a: Parameters<CoolCassetteAPI['getAlbums']>) =>
  client.getAlbums(...a)
export const getAlbumDetail = (...a: Parameters<CoolCassetteAPI['getAlbumDetail']>) =>
  client.getAlbumDetail(...a)
export const postPreview = (...a: Parameters<CoolCassetteAPI['postPreview']>) =>
  client.postPreview(...a)
export const postPublish = (...a: Parameters<CoolCassetteAPI['postPublish']>) =>
  client.postPublish(...a)
export const setIndexVersion = (...a: Parameters<CoolCassetteAPI['setIndexVersion']>) =>
  client.setIndexVersion(...a)
export const getIndexVersion = (...a: Parameters<CoolCassetteAPI['getIndexVersion']>) =>
  client.getIndexVersion(...a)
export const clearIndexVersion = (...a: Parameters<CoolCassetteAPI['clearIndexVersion']>) =>
  client.clearIndexVersion(...a)

export function getIndexHeaders(): Record<string, string> {
  const { version, hash } = client.getIndexVersion()
  const h: Record<string, string> = {}
  if (version) h['X-CoolCassette-Index-Version'] = version
  if (hash) h['X-CoolCassette-Index-Hash'] = hash
  return h
}
