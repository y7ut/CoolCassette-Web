import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { browseFS } from '../api/client'
import type { FSEntry } from '../api/client'

interface DirPickerProps {
  open: boolean
  currentPath: string
  onSelect: (path: string) => void
  onClose: () => void
}

export default function DirPicker({ open, currentPath, onSelect, onClose }: DirPickerProps) {
  const [path, setPath] = useState(currentPath || '/')
  const [entries, setEntries] = useState<FSEntry[]>([])
  const [parent, setParent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const loadDir = useCallback(async (dir: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await browseFS(dir)
      setPath(res.path)
      setParent(res.parent)
      setEntries(res.entries)
    } catch (e) {
      setError((e as Error).message)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadDir(currentPath || '/')
    }
  }, [open, currentPath, loadDir])

  const handleNavigate = (entry: FSEntry) => {
    loadDir(entry.path)
  }

  const handleGoUp = () => {
    if (parent) loadDir(parent)
  }

  const handlePathSubmit = () => {
    const v = inputRef.current?.value?.trim()
    if (v) loadDir(v)
  }

  const handleConfirm = () => {
    onSelect(path)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-bg border border-border w-full max-w-md flex flex-col fade-in"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-xl text-accent tracking-wider">BROWSE</h3>
          <button onClick={onClose} className="text-dim hover:text-text text-xs tracking-widest">
            ESC
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePathSubmit()}
            className="flex-1 bg-surface border border-border px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-accent"
          />
          <button onClick={handlePathSubmit} className="btn-retro text-[10px] px-2 py-1">
            GO
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-1">
          {loading && (
            <div className="text-dim text-[10px] tracking-widest py-4 text-center animate-pulse-accent">
              LOADING...
            </div>
          )}
          {error && (
            <div className="text-red-400 text-[10px] tracking-wider font-mono py-4 text-center">
              {error}
            </div>
          )}
          {!loading && !error && parent && (
            <button
              onClick={handleGoUp}
              className="w-full text-left px-3 py-2 text-xs text-dim hover:text-text hover:bg-white/5 font-mono transition-colors"
            >
              ..
            </button>
          )}
          {!loading &&
            !error &&
            entries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => handleNavigate(entry)}
                className="w-full text-left px-3 py-2 text-xs text-text hover:bg-accent/10 font-mono truncate transition-colors"
              >
                {entry.name}/
              </button>
            ))}
          {!loading && !error && entries.length === 0 && !parent && (
            <div className="text-dim text-[10px] tracking-widest py-4 text-center">NO DIRECTORIES</div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-[10px] text-dim font-mono truncate max-w-[200px]">{path}</span>
          <button
            onClick={handleConfirm}
            className="btn-retro text-[10px] border-accent text-accent"
          >
            SELECT THIS FOLDER
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
