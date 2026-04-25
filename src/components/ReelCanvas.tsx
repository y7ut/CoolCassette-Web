import { useRef, useEffect, useMemo } from 'react'

interface FrameRect {
  x: number
  y: number
  w: number
  h: number
}

interface ReelCanvasProps {
  atlasUrl: string
  reelConfig?: { delayMS: number }
  reelAtlasFrames?: string[]
  isPlaying: boolean
  onFrameChange?: (frame: number) => void
}

function parseFrameLines(lines: string[] | undefined): FrameRect[] | null {
  if (!lines || lines.length === 0) return null
  const frames: FrameRect[] = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length !== 4) return null
    const nums = parts.map(Number)
    if (nums.some(isNaN)) return null
    frames.push({ x: nums[0], y: nums[1], w: nums[2], h: nums[3] })
  }
  return frames.length > 0 ? frames : null
}

const ATLAS_COLS = 4
const FRAME_W = 440
const FRAME_H = 110
const FRAME_COUNT = 40
const DEFAULT_DELAY = 55

const CIRCLES = [
  { cx: 57, cy: 56, r: 42 },
  { cx: 383, cy: 56, r: 42 },
]

const DEFAULT_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => ({
  x: (i % ATLAS_COLS) * FRAME_W,
  y: Math.floor(i / ATLAS_COLS) * FRAME_H,
  w: FRAME_W,
  h: FRAME_H,
}))

export default function ReelCanvas({
  atlasUrl,
  reelConfig,
  reelAtlasFrames,
  isPlaying,
  onFrameChange,
}: ReelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onFrameChangeRef = useRef(onFrameChange)
  onFrameChangeRef.current = onFrameChange

  const frames = useMemo<FrameRect[]>(
    () => parseFrameLines(reelAtlasFrames) ?? DEFAULT_FRAMES,
    [reelAtlasFrames]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let atlasImg: HTMLImageElement | null = null
    let frameIdx = 0
    let playing = false
    let lastTick = 0
    let delay = reelConfig?.delayMS ?? DEFAULT_DELAY
    let raf = 0

    function drawFrame(idx: number) {
      if (!atlasImg) return
      const f = frames[idx]

      ctx.clearRect(0, 0, FRAME_W, FRAME_H)

      ctx.save()
      ctx.beginPath()
      for (const c of CIRCLES) {
        ctx.moveTo(c.cx + c.r, c.cy)
        ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      }
      ctx.clip()
      ctx.drawImage(atlasImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h)
      ctx.restore()

      onFrameChangeRef.current?.(idx)
    }

    function tick(ts: number) {
      if (!playing) return

      if (ts - lastTick >= delay) {
        frameIdx = (frameIdx + 1) % frames.length
        drawFrame(frameIdx)
        lastTick = ts
      }

      raf = requestAnimationFrame(tick)
    }

    function startPlay() {
      if (playing) return
      playing = true
      lastTick = performance.now()
      raf = requestAnimationFrame(tick)
    }

    function stopPlay() {
      playing = false
      cancelAnimationFrame(raf)
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      atlasImg = img
      drawFrame(0)
    }
    img.src = atlasUrl

    ;(canvas as any)._reel = {
      startPlay,
      stopPlay,
      setDelay: (d: number) => { delay = d },
    }

    return () => {
      img.onload = null
      cancelAnimationFrame(raf)
    }
  }, [atlasUrl, frames])

  useEffect(() => {
    const reel = (canvasRef.current as any)?._reel
    if (!reel) return
    if (isPlaying) {
      reel.startPlay()
    } else {
      reel.stopPlay()
    }
  }, [isPlaying])

  useEffect(() => {
    const reel = (canvasRef.current as any)?._reel
    if (!reel) return
    reel.setDelay(reelConfig?.delayMS ?? DEFAULT_DELAY)
  }, [reelConfig])

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_W}
      height={FRAME_H}
      className="absolute pointer-events-none"
      style={{ left: '22.5%', top: '33.54%', width: '55%', height: '22.92%', zIndex: 10 }}
    />
  )
}
