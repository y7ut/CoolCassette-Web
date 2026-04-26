import { useEffect, useState } from 'react'
import type { AlbumDetail } from '../api/client'
import ReelCanvas from './ReelCanvas'
import StatusBadge from './StatusBadge'
import { usePlayerStore } from '../stores/playerStore'
const FRAME_DELAY = 55

interface TapeStageProps {
  album: AlbumDetail
  onPreview?: () => void
  onPublish?: () => void
  isGenerating?: boolean
}

export default function TapeStage({ album, onPreview, onPublish, isGenerating }: TapeStageProps) {
  const [, setFrameIdx] = useState(0)
  const [reelDelay, setReelDelay] = useState(FRAME_DELAY)
  const audioPlaying = usePlayerStore((s) => s.isPlaying)
  const currentAlbumId = usePlayerStore((s) => s.currentAlbumId)
  const speed = usePlayerStore((s) => s.speed)
  const [reelPlaying, setReelPlaying] = useState(false)
  const status = album.status

  useEffect(() => {
    if (currentAlbumId === album.id) {
      setReelPlaying(audioPlaying)
    }
  }, [audioPlaying, currentAlbumId, album.id])

  useEffect(() => {
    if (status === 'built') {
      setReelDelay(Math.round(FRAME_DELAY / speed))
    }
  }, [speed, status])

  const reelConfig = { delayMS: reelDelay }

  let tapeUrl: string | null = null
  if (status === 'built' && album.published_tape_png_url) {
    tapeUrl = album.published_tape_png_url
  } else if (status === 'preview_ready') {
    tapeUrl = `/api/albums/${album.id}/assets/tape.png`
  } else if (status === 'built') {
    tapeUrl = `/api/albums/${album.id}/assets/tape.png`
  }

  const reelUrl = (status === 'built' && album.published_reel_png_url)
    ? album.published_reel_png_url
    : `/api/albums/${album.id}/assets/reel.png`

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div
        className="relative overflow-hidden tape-shadow bg-[#111] w-full"
        style={{ maxWidth: 800, aspectRatio: '800/480' }}
      >
        {tapeUrl ? (
          <img
            src={tapeUrl!}
            alt="tape"
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
            
          />
        ) : (
          <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-5xl text-border mb-4">NO TAPE</div>
              <p className="text-dim text-xs tracking-widest">PREVIEW NOT GENERATED</p>
            </div>
          </div>
        )}

        {status === 'built' && (
          <ReelCanvas
            atlasUrl={reelUrl}
            reelConfig={reelConfig}
            reelAtlasFrames={album.reel_atlas_frames}
            isPlaying={reelPlaying}
            onFrameChange={setFrameIdx}
          />
        )}

        <div className="absolute inset-0 scanlines" />
        <div className="absolute inset-0 vignette" />

        {status === 'not_built' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <StatusBadge status="not_built" size="md" />
              <p className="text-dim text-xs mt-3 tracking-wider">
                GENERATE TAPE PREVIEW TO BEGIN
              </p>
              <button
                onClick={onPreview}
                disabled={isGenerating}
                className="btn-retro mt-4 text-sm"
              >
                {isGenerating ? 'GENERATING...' : 'GENERATE PREVIEW'}
              </button>
            </div>
          </div>
        )}
      </div>

      {status === 'preview_ready' && (
        <div className="flex gap-4 items-center text-[11px] text-dim tracking-wider font-mono">
          <span>PREVIEW READY</span>
          <button onClick={onPublish} disabled={isGenerating} className="btn-retro">
            {isGenerating ? 'PUBLISHING...' : 'PUBLISH TO WAMPY'}
          </button>
        </div>
      )}
    </div>
  )
}
