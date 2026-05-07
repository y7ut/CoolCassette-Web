import type {
  CoolCassetteAPI,
  ReloadRequest,
} from './types'

declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetLibraryStatus(): Promise<any>
          ReloadLibrary(req: { music_dirs?: string[]; wampy_dir?: string }): Promise<any>
          ClearCache(): Promise<any>
          BrowseFS(dirPath: string): Promise<any>
          ListAlbums(limit: number, sortBy: string, order: string, cursor: string, search: string): Promise<any>
          GetAlbum(id: string): Promise<any>
          GeneratePreview(id: string, force: boolean): Promise<any>
          PublishAlbum(id: string, force: boolean): Promise<any>
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

class WailsIPCError extends Error {
  code?: number
  constructor(message: string, code?: number) {
    super(message)
    this.code = code
  }
}

function wrapError(err: unknown): never {
  if (err instanceof Error) {
    if (err.message === 'index content changed') {
      clearIndexVersion()
      throw new WailsIPCError(err.message, 409)
    }
    throw new WailsIPCError(err.message)
  }
  throw new WailsIPCError(String(err))
}

const wailsClient: CoolCassetteAPI = {
  async getLibraryStatus() {
    try {
      return trackIndex(await window.go.main.App.GetLibraryStatus())
    } catch (e) { throw wrapError(e) }
  },

  async postReload(body?: ReloadRequest) {
    try {
      const resp = await window.go.main.App.ReloadLibrary(body || {})
      if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
      return resp
    } catch (e) { throw wrapError(e) }
  },

  async postClearCache() {
    try {
      return await window.go.main.App.ClearCache()
    } catch (e) { throw wrapError(e) }
  },

  async browseFS(dirPath: string) {
    try {
      return await window.go.main.App.BrowseFS(dirPath)
    } catch (e) { throw wrapError(e) }
  },

  async getAlbums(params) {
    try {
      const resp = await window.go.main.App.ListAlbums(
        params.limit || 0,
        params.sort_by || '',
        params.order || '',
        params.cursor || '',
        params.q || '',
      )
      if (resp.index_version) setIndexVersion(resp.index_version, resp.index_hash)
      return resp
    } catch (e) { throw wrapError(e) }
  },

  async getAlbumDetail(id: string) {
    try {
      return trackIndex(await window.go.main.App.GetAlbum(id))
    } catch (e) { throw wrapError(e) }
  },

  async postPreview(id: string, force = false) {
    try {
      return trackIndex(await window.go.main.App.GeneratePreview(id, force))
    } catch (e) { throw wrapError(e) }
  },

  async postPublish(id: string, force = false) {
    try {
      return trackIndex(await window.go.main.App.PublishAlbum(id, force))
    } catch (e) { throw wrapError(e) }
  },

  setIndexVersion,
  getIndexVersion,
  clearIndexVersion,
}

export default wailsClient
