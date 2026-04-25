import { create } from 'zustand'

export interface Track {
  name: string
  path: string
}

interface PlayerState {
  isPlaying: boolean
  currentTrack: Track | null
  currentAlbumId: string | null
  trackList: Track[]
  trackIndex: number
  currentTime: number
  duration: number
  speed: number
  setTrackList: (tracks: Track[], albumId: string, startIndex?: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  playOrToggle: (tracks: Track[], albumId: string) => void
  next: () => void
  prev: () => void
  setTime: (time: number) => void
  setDuration: (duration: number) => void
  seek: (time: number) => void
  setSpeed: (speed: number) => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  currentAlbumId: null,
  trackList: [],
  trackIndex: -1,
  currentTime: 0,
  duration: 0,
  speed: 1,

  setTrackList: (tracks, albumId, startIndex = 0) => {
    const idx = Math.min(startIndex, tracks.length - 1)
    set({
      trackList: tracks,
      trackIndex: idx,
      currentTrack: tracks[idx] || null,
      currentAlbumId: albumId,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  playOrToggle: (tracks, albumId) => {
    const { currentTrack, currentAlbumId } = get()
    if (!currentTrack || currentAlbumId !== albumId) {
      get().setTrackList(tracks, albumId, 0)
    } else {
      get().toggle()
    }
  },

  next: () => {
    const { trackList, trackIndex, currentAlbumId } = get()
    if (trackList.length === 0) return
    const idx = (trackIndex + 1) % trackList.length
    set({
      trackIndex: idx,
      currentTrack: trackList[idx],
      currentAlbumId,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })
  },

  prev: () => {
    const { trackList, trackIndex, currentTime, currentAlbumId } = get()
    if (trackList.length === 0) return
    if (currentTime > 3) {
      set({ currentTime: 0 })
      const audio = document.querySelector('audio')
      if (audio) audio.currentTime = 0
      return
    }
    const idx = (trackIndex - 1 + trackList.length) % trackList.length
    set({
      trackIndex: idx,
      currentTrack: trackList[idx],
      currentAlbumId,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })
  },

  setTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  seek: (time) => set({ currentTime: time }),
  setSpeed: (speed) => set({ speed }),

  reset: () =>
    set({
      isPlaying: false,
      currentTrack: null,
      currentAlbumId: null,
      trackList: [],
      trackIndex: -1,
      currentTime: 0,
      duration: 0,
    }),
}))
