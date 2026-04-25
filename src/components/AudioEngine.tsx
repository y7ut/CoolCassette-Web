import { useRef, useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import type { MusicFile } from '../api/client'

interface AudioEngineProps {
  tracks: MusicFile[]
  albumId: string
}

export default function AudioEngine({ tracks, albumId }: AudioEngineProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const currentAlbumId = usePlayerStore((s) => s.currentAlbumId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const speed = usePlayerStore((s) => s.speed)
  const next = usePlayerStore((s) => s.next)
  const pause = usePlayerStore((s) => s.pause)
  const setTime = usePlayerStore((s) => s.setTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const playOrToggle = usePlayerStore((s) => s.playOrToggle)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || !currentAlbumId) return

    const src = `/api/albums/${currentAlbumId}/tracks/${encodeURIComponent(currentTrack.name)}`
    if (!audio.src.endsWith(src)) {
      audio.src = src
      audio.load()
    }

    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [currentTrack, currentAlbumId, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setTime(audio.currentTime)
    const onLoadedMeta = () => setDuration(audio.duration)
    const onEnded = () => {
      pause()
      next()
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [setTime, setDuration, pause, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        playOrToggle(tracks, albumId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tracks, albumId, playOrToggle])

  return <audio ref={audioRef} crossOrigin="anonymous" />
}
