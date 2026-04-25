import { useRef, useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'

export default function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    pause,
    toggle,
    setTime,
    setDuration,
    seek,
  } = usePlayerStore()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (audio.src !== `file://${currentTrack.path}`) {
      audio.src = `file://${currentTrack.path}`
      audio.load()
    }

    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setTime(audio.currentTime)
    const onLoadedMeta = () => setDuration(audio.duration)
    const onEnded = () => {
      pause()
      setTime(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [setTime, setDuration, pause])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && currentTrack) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentTrack, toggle])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const t = pct * duration
    if (audioRef.current) {
      audioRef.current.currentTime = t
    }
    seek(t)
  }

  const fmtTime = (t: number) => {
    if (!isFinite(t)) return '00:00'
    const m = String(Math.floor(t / 60)).padStart(2, '0')
    const s = String(Math.floor(t % 60)).padStart(2, '0')
    return `${m}:${s}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 border-t border-border backdrop-blur-sm z-50">
      <div className="max-w-[800px] mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="btn-retro text-sm px-3 py-2">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[10px] text-dim mb-1">
              <span className="truncate">{currentTrack.name}</span>
              <span className="font-display text-accent text-base tracking-wider">
                {fmtTime(currentTime)}
              </span>
            </div>
            <div className="progress-bar" onClick={handleSeek}>
              <div
                className="progress-fill"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  )
}
