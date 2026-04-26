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

declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetLibraryStatus(): Promise<LibraryStatus>
          ReloadLibrary(req: string): Promise<ReloadResponse>
          ClearCache(): Promise<ClearCacheResponse>
          BrowseFS(dirPath: string): Promise<FSBrowseResponse>
          ListAlbums(limit: number, sortBy: string, order: string, cursor: string): Promise<AlbumListResponse>
          GetAlbum(id: string): Promise<AlbumDetail>
          GeneratePreview(id: string, force: boolean): Promise<AlbumDetail>
          PublishAlbum(id: string, force: boolean): Promise<AlbumDetail>
        }
      }
    }
  }
}

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

function trackIndex<T extends { index_version?: string; index_hash?: string }>(data: T): T {
  if (data.index_version && data.index_hash) {
    setIndexVersion(data.index_version, data.index_hash)
  }
  return data
}

const wailsClient: CoolCassetteAPI = {
  async getLibraryStatus() {
    return trackIndex(await window.go.main.App.GetLibraryStatus())
  },

  async postReload(body?: ReloadRequest) {
    const resp = await window.go.main.App.ReloadLibrary(JSON.stringify(body || {}))
    if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
    return resp
  },

  async postClearCache() {
    return window.go.main.App.ClearCache()
  },

  async browseFS(dirPath: string) {
    return window.go.main.App.BrowseFS(dirPath)
  },

  async getAlbums(params) {
    const resp = await window.go.main.App.ListAlbums(
      params.limit || 0,
      params.sort_by || '',
      params.order || '',
      params.cursor || '',
    )
    if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
    return resp
  },

  async getAlbumDetail(id: string) {
    return trackIndex(await window.go.main.App.GetAlbum(id))
  },

  async postPreview(id: string, force = false) {
    return trackIndex(await window.go.main.App.GeneratePreview(id, force))
  },

  async postPublish(id: string, force = false) {
    return trackIndex(await window.go.main.App.PublishAlbum(id, force))
  },

  setIndexVersion,
  getIndexVersion,
  clearIndexVersion,
}

export default wailsClient
