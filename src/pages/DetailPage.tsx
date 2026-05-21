import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAlbumDetail } from '../hooks/useAlbumDetail'
import { usePlayerStore } from '../stores/playerStore'
import { toast } from '../stores/toastStore'
import { useBuildStore, useAlbumJob, useAlbumPending } from '../stores/buildStore'
import TapeStage from '../components/TapeStage'
import Playlist from '../components/Playlist'
import PlayerControls from '../components/PlayerControls'
import AudioEngine from '../components/AudioEngine'

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: album, isLoading, refetch } = useAlbumDetail(id || '')
  const reset = usePlayerStore((s) => s.reset)

  const enqueue = useBuildStore((s) => s.enqueue)
  const pending = useAlbumPending(id || '')
  const job = useAlbumJob(id || '')

  // Bumped on every job completion to bust the browser image cache
  const [imageBust, setImageBust] = useState(() => Date.now())
  const prevJobStatus = useRef<string | undefined>(undefined)

  useEffect(() => {
    return () => reset()
  }, [reset])

  // When this album's job reaches a terminal state, refetch detail and bust image cache.
  useEffect(() => {
    if (!job) return
    if (job.status === prevJobStatus.current) return
    prevJobStatus.current = job.status
    if (job.status === 'succeeded' || job.status === 'failed') {
      setImageBust(Date.now())
      refetch()
    }
  }, [job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = async () => {
    if (!id) return
    try {
      await enqueue(id, 'preview', true)
    } catch (e) {
      toast('Preview failed: ' + (e as Error).message, { type: 'error', position: 'center', borderSide: 'top' })
    }
  }

  const handlePublish = async () => {
    if (!id) return
    try {
      await enqueue(id, 'publish', false)
    } catch (e) {
      toast('Publish failed: ' + (e as Error).message, { type: 'error', position: 'center', borderSide: 'top' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dim text-xs tracking-widest animate-pulse-accent">LOADING...</div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-sm">Album not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-[900px] mx-auto fade-in">
      <AudioEngine tracks={album.music_files} albumId={album.id} />

      <div className="flex items-center gap-4 mb-8">
        {album.has_cover && (
          <img
            src={album.cover_url}
            alt={album.album}
            className="w-16 h-16 object-cover border border-border shrink-0"
            crossOrigin="anonymous"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl text-accent tracking-wider truncate">{album.album}</h1>
          <p className="text-sm text-dim mt-1 truncate">{album.artist}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-retro text-xs shrink-0">
          ← BACK
        </button>
      </div>

      <div className="mb-10">
        <TapeStage
          album={album}
          onPreview={handlePreview}
          onPublish={handlePublish}
          isGenerating={pending}
          imageBust={imageBust}
        />
      </div>

      {album.music_files && album.music_files.length > 0 && (
        <div>
          <PlayerControls tracks={album.music_files} albumId={album.id} />
          <Playlist tracks={album.music_files} albumId={album.id} />
        </div>
      )}
    </div>
  )
}
