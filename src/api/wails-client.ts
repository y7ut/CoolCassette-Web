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
          GetLibraryStatus: () => Promise<string>
          ReloadLibrary: (req: string) => Promise<string>
          ClearCache: () => Promise<string>
          BrowseFS: (dirPath: string) => Promise<string>
          ListAlbums: (limit: number, sortBy: string, order: string, cursor: string) => Promise<string>
          GetAlbum: (id: string) => Promise<string>
          GeneratePreview: (id: string, force: boolean) => Promise<string>
          PublishAlbum: (id: string, force: boolean) => Promise<string>
        }
      }
    }
  }
}

function parse<T>(json: string): T {
  return JSON.parse(json) as T
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
  async getLibraryStatus(): Promise<LibraryStatus> {
    return trackIndex(parse<LibraryStatus>(await window.go.main.App.GetLibraryStatus()))
  },

  async postReload(body?: ReloadRequest): Promise<ReloadResponse> {
    const resp = parse<ReloadResponse>(
      await window.go.main.App.ReloadLibrary(JSON.stringify(body || {})),
    )
    if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
    return resp
  },

  async postClearCache(): Promise<ClearCacheResponse> {
    return parse<ClearCacheResponse>(await window.go.main.App.ClearCache())
  },

  async browseFS(dirPath: string): Promise<FSBrowseResponse> {
    return parse<FSBrowseResponse>(await window.go.main.App.BrowseFS(dirPath))
  },

  async getAlbums(params: {
    limit?: number
    sort_by?: string
    order?: string
    cursor?: string
  }): Promise<AlbumListResponse> {
    const resp = parse<AlbumListResponse>(
      await window.go.main.App.ListAlbums(
        params.limit || 0,
        params.sort_by || '',
        params.order || '',
        params.cursor || '',
      ),
    )
    if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
    return resp
  },

  async getAlbumDetail(id: string): Promise<AlbumDetail> {
    return trackIndex(parse<AlbumDetail>(await window.go.main.App.GetAlbum(id)))
  },

  async postPreview(id: string, force = false): Promise<AlbumDetail> {
    return trackIndex(parse<AlbumDetail>(await window.go.main.App.GeneratePreview(id, force)))
  },

  async postPublish(id: string, force = false): Promise<AlbumDetail> {
    return trackIndex(parse<AlbumDetail>(await window.go.main.App.PublishAlbum(id, force)))
  },

  setIndexVersion,
  getIndexVersion,
  clearIndexVersion,
}

export default wailsClient
