import { usePlayerStore } from '../stores/playerStore'
import type { MusicFile } from '../api/client'

interface PlaylistProps {
  tracks: MusicFile[]
  albumId: string
}

export default function Playlist({ tracks, albumId }: PlaylistProps) {
  const { currentTrack, currentAlbumId, isPlaying, setTrackList, toggle, trackIndex } = usePlayerStore()

  const handleTrackClick = (index: number) => {
    if (currentTrack?.name === tracks[index].name && currentAlbumId === albumId) {
      toggle()
    } else {
      setTrackList(tracks, albumId, index)
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xs font-mono tracking-widest text-dim mb-4 uppercase">
        Playlist — {tracks.length} track{tracks.length !== 1 ? 's' : ''}
      </h2>
      <div>
        {tracks.map((track, i) => {
          const isActive = currentAlbumId === albumId && trackIndex === i
          return (
            <button
              key={track.path}
              onClick={() => handleTrackClick(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-b-0 hover:bg-white/5`}
            >
              <span className="text-[10px] text-dim font-mono w-6">
                { String(i + 1).padStart(2, '0') + "."}
              </span>
              <span className={`text-sm truncate flex-1 ${isActive ? 'text-accent' : 'text-text'}`}>
                {track.title}
              </span>
              {isActive && (
                <span className="text-accent text-xs">
                  {isPlaying ? '▶' : '⏸'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
