import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAlbumDetail } from '../hooks/useAlbumDetail'
import { postPreview, postPublish } from '../api/client'
import { usePlayerStore } from '../stores/playerStore'
import { toast } from '../stores/toastStore'
import TapeStage from '../components/TapeStage'
import Playlist from '../components/Playlist'
import PlayerControls from '../components/PlayerControls'
import AudioEngine from '../components/AudioEngine'

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: album, isLoading, refetch } = useAlbumDetail(id || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const reset = usePlayerStore((s) => s.reset)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handlePreview = async () => {
    if (!id) return
    setIsGenerating(true)
    try {
      await postPreview(id, true)
      await refetch()
    } catch (e) {
      toast('Preview failed: ' + (e as Error).message, { type: 'error', position: 'center', borderSide: 'top' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!id) return
    setIsGenerating(true)
    try {
      await postPublish(id, false)
      await refetch()
    } catch (e) {
      toast('Publish failed: ' + (e as Error).message, { type: 'error', position: 'center', borderSide: 'top' })
    } finally {
      setIsGenerating(false)
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

      {/* Header: cover + title + back */}
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

      {/* Tape Stage */}
      <div className="mb-10">
        <TapeStage
          album={album}
          onPreview={handlePreview}
          onPublish={handlePublish}
          isGenerating={isGenerating}
        />
      </div>

      {/* Player controls + Playlist */}
      {album.music_files && album.music_files.length > 0 && (
        <div>
          <PlayerControls tracks={album.music_files} albumId={album.id} />
          <Playlist tracks={album.music_files} albumId={album.id} />
        </div>
      )}
    </div>
  )
}
