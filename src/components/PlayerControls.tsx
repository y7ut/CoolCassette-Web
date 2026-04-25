import { usePlayerStore } from '../stores/playerStore'
import type { MusicFile } from '../api/client'

const SPEEDS = [0.5, 1, 2]

interface PlayerControlsProps {
  tracks: MusicFile[]
  albumId: string
}

export default function PlayerControls({ tracks, albumId }: PlayerControlsProps) {
  const {
    currentTrack,
    currentAlbumId,
    isPlaying,
    currentTime,
    duration,
    speed,
    setTrackList,
    playOrToggle,
    toggle,
    next,
    prev,
    seek,
    setSpeed,
  } = usePlayerStore()

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seek(pct * duration)
    const audio = document.querySelector('audio')
    if (audio) audio.currentTime = pct * duration
  }

  const fmtTime = (t: number) => {
    if (!isFinite(t)) return '00:00'
    const m = String(Math.floor(t / 60)).padStart(2, '0')
    const s = String(Math.floor(t % 60)).padStart(2, '0')
    return `${m}:${s}`
  }

  const handleToggle = () => {
    playOrToggle(tracks, albumId)
  }

  const trackName = currentAlbumId === albumId && currentTrack ? currentTrack.name : '—'

  return (
    <div className="mb-4 space-y-3">
      <div className="flex justify-between text-[10px] text-dim">
        <span className="truncate">{trackName}</span>
        <span className="font-display text-accent text-base tracking-wider shrink-0 ml-2">
          {fmtTime(currentTime)}
        </span>
      </div>

      <div className="progress-bar" onClick={handleSeek}>
        <div
          className="progress-fill"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={prev} className="btn-retro text-xs px-3 py-1.5">⏮ PREV</button>
        <button onClick={handleToggle} className="btn-retro text-lg px-4 py-1.5 border-accent text-accent">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={next} className="btn-retro text-xs px-3 py-1.5">NEXT ⏭</button>

        <div className="w-px h-6 bg-border mx-1" />

        <span className="text-[10px] text-dim tracking-widest">SPEED</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`btn-retro text-[10px] px-2 py-1 ${speed === s ? 'border-accent text-accent' : ''}`}
          >
            ×{s}
          </button>
        ))}
      </div>
    </div>
  )
}
