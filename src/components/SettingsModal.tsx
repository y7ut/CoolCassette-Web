import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getLibraryStatus, postReload, postClearCache, clearIndexVersion } from '../api/client'
import type { LibraryStatus } from '../api/client'
import DirPicker from './DirPicker'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onReloaded: () => void
}

export default function SettingsModal({ open, onClose, onReloaded }: SettingsModalProps) {
  const [status, setStatus] = useState<LibraryStatus | null>(null)
  const [musicDirs, setMusicDirs] = useState<string[]>([])
  const [wampyDir, setWampyDir] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ type: 'music'; index: number } | { type: 'wampy' } | null>(null)
  const [cacheResult, setCacheResult] = useState<{ files: number; mb: string } | null>(null)
  const [clearing, setClearing] = useState(false)
  const pollRef = useRef<number>(0)

  const loadStatus = useCallback(async () => {
    try {
      const s = await getLibraryStatus()
      setStatus(s)
      if (!dirty) {
        setMusicDirs(s.music_dirs || [])
        setWampyDir(s.wampy_dir || '')
      }
    } catch {}
  }, [dirty])

  useEffect(() => {
    if (open) loadStatus()
  }, [open, loadStatus])

  useEffect(() => {
    if (!open || !scanning) return
    pollRef.current = setInterval(async () => {
      try {
        const s = await getLibraryStatus()
        setStatus(s)
        if (s.total_albums > 0) {
          setProgress(Math.round((s.scanned_albums / s.total_albums) * 100))
        }
        if (!s.scanning) {
          setScanning(false)
          clearInterval(pollRef.current)
          clearIndexVersion()
          onReloaded()
        }
      } catch {}
    }, 800)
    return () => clearInterval(pollRef.current)
  }, [open, scanning, onReloaded])

  const handleReload = async () => {
    setError('')
    setScanning(true)
    setProgress(0)
    try {
      const body: { music_dirs?: string[]; wampy_dir?: string } = {}
      if (musicDirs.length > 0) body.music_dirs = musicDirs.filter(Boolean)
      if (wampyDir) body.wampy_dir = wampyDir
      await postReload(Object.keys(body).length > 0 ? body : undefined)
    } catch (e) {
      setError((e as Error).message)
      setScanning(false)
    }
  }

  const addMusicDir = () => setMusicDirs((d) => [...d, ''])
  const removeMusicDir = (i: number) => setMusicDirs((d) => d.filter((_, idx) => idx !== i))

  const handleClearCache = async () => {
    setClearing(true)
    setCacheResult(null)
    try {
      const res = await postClearCache()
      setCacheResult({ files: res.files_removed, mb: (res.bytes_freed / 1024 / 1024).toFixed(1) })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setClearing(false)
    }
  }

  const handleDirPick = (path: string) => {
    setDirty(true)
    if (pickerTarget?.type === 'music' && 'index' in pickerTarget) {
      setMusicDirs((d) => {
        const next = [...d]
        next[pickerTarget.index] = path
        return next
      })
    } else if (pickerTarget?.type === 'wampy') {
      setWampyDir(path)
    }
    setPickerTarget(null)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-bg border border-border w-full max-w-lg p-6 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-accent tracking-wider">SETTINGS</h2>
          {!scanning && (
            <button onClick={onClose} className="text-dim hover:text-text text-xs tracking-widest">
              ESC
            </button>
          )}
        </div>

        {/* Music dirs */}
        <div className="mb-5">
          <label className="block text-[10px] text-dim tracking-widest uppercase mb-2">
            MUSIC DIRECTORIES
          </label>
          <div className="space-y-2">
            {musicDirs.map((dir, i) => (
              <div key={i} className="flex gap-2">
                <button
                  onClick={() => setPickerTarget({ type: 'music', index: i })}
                  disabled={scanning}
                  className="flex-1 bg-surface border border-border px-3 py-2 text-xs text-text font-mono text-left hover:border-accent transition-colors truncate focus:outline-none focus:border-accent"
                >
                  {dir || '— CLICK TO BROWSE —'}
                </button>
                {!scanning && musicDirs.length > 1 && (
                  <button
                    onClick={() => {
                      removeMusicDir(i)
                      setDirty(true)
                    }}
                    className="text-dim hover:text-red-400 text-xs px-2 border border-border"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {!scanning && (
            <button
              onClick={() => {
                addMusicDir()
                setDirty(true)
              }}
              className="mt-2 text-[10px] text-dim hover:text-accent tracking-widest border border-border px-3 py-1"
            >
              + ADD DIR
            </button>
          )}
        </div>

        {/* Wampy dir */}
        <div className="mb-6">
          <label className="block text-[10px] text-dim tracking-widest uppercase mb-2">
            WAMPY DIRECTORY
          </label>
          <button
            onClick={() => setPickerTarget({ type: 'wampy' })}
            disabled={scanning}
            className="w-full bg-surface border border-border px-3 py-2 text-xs text-text font-mono text-left hover:border-accent transition-colors truncate focus:outline-none focus:border-accent"
          >
            {wampyDir || '— CLICK TO BROWSE —'}
          </button>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-[10px] text-dim tracking-widest mb-2">
              <span>SCANNING...</span>
              <span className="text-text">
                {progress}%{' '}
                {status ? `(${status.scanned_albums ?? 0}/${status.total_albums ?? 0})` : ''}
              </span>
            </div>
            <div className="pixel-progress">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`pixel-progress-segment ${i < Math.ceil(progress / 5) ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-400 text-[10px] tracking-wider font-mono">{error}</div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!scanning && (
            <button onClick={onClose} className="btn-retro text-[10px]">
              CANCEL
            </button>
          )}
          <button
            onClick={handleReload}
            disabled={scanning}
            className="btn-retro text-[10px] border-accent text-accent"
          >
            {scanning ? 'SCANNING...' : 'RELOAD LIBRARY'}
          </button>
        </div>

        {/* Cache */}
        {!scanning && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-dim tracking-widest uppercase">CACHE</div>
                {cacheResult && (
                  <div className="text-[10px] text-text font-mono mt-1">
                    CLEARED {cacheResult.files} FILES · {cacheResult.mb} MB FREED
                  </div>
                )}
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearing}
                className="btn-retro text-[10px]"
              >
                {clearing ? 'CLEARING...' : 'CLEAR CACHE'}
              </button>
            </div>
          </div>
        )}

        {/* Status info */}
        {status && !scanning && (
          <div className="mt-5 pt-4 border-t border-border text-[10px] text-dim tracking-wider font-mono space-y-1">
            <div>
              ALBUMS: <span className="text-text">{status.album_count}</span>
            </div>
            <div className="truncate">
              INDEX: <span className="text-text">{status.index_version}</span>
            </div>
          </div>
        )}
      </div>

      <DirPicker
        open={pickerTarget !== null}
        currentPath={
          pickerTarget
            ? pickerTarget.type === 'wampy'
              ? wampyDir
              : musicDirs[pickerTarget.index] || '/'
            : '/'
        }
        onSelect={handleDirPick}
        onClose={() => setPickerTarget(null)}
      />
    </div>,
    document.body
  )
}
