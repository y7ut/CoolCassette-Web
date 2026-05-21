import { Link } from 'react-router-dom'
import { Check, CassetteTape, Loader2 } from 'lucide-react'
import { useRef, useEffect, useCallback } from 'react'
import type { AlbumItem } from '../api/client'
import { saveListState } from './ScrollRestoration'
import { useBuildStore, useAlbumPending, useAlbumJob } from '../stores/buildStore'

interface AlbumCardProps {
  album: AlbumItem
}

function MarqueeText({ children, className }: { children: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const inner = el.firstElementChild as HTMLElement
    if (!inner) return
    const overflow = inner.scrollWidth - el.clientWidth
    if (overflow > 1) {
      el.style.setProperty('--marquee-offset', `-${overflow}px`)
      el.style.setProperty('--marquee-duration', `${inner.scrollWidth / 60}s`)
      el.classList.add('marquee-overflow')
    }
  }, [children])

  return (
    <div className="marquee-container" ref={containerRef}>
      <div className={`${className} marquee-inner`}>
        {children}
      </div>
    </div>
  )
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const enqueue = useBuildStore((s) => s.enqueue)
  const pending = useAlbumPending(album.id)
  const job = useAlbumJob(album.id)

  const handleIconClick = useCallback(
    async (e: React.MouseEvent) => {
      // Only intercept clicks on the icon for not_built albums
      if (album.status !== 'not_built' || pending) return
      e.preventDefault() // prevent navigating to detail
      e.stopPropagation()
      try {
        await enqueue(album.id, 'preview', false)
      } catch {
        // errors handled by buildStore / toast
      }
    },
    [album.status, album.id, pending, enqueue],
  )

  // Determine icon state
  let icon: React.ReactNode
  if (pending) {
    icon = (
      <span
        className="text-accent shrink-0"
        title={job?.type === 'publish' ? 'Publishing…' : 'Generating preview…'}
      >
        <Loader2 size={16} className="animate-spin" strokeWidth={2} />
      </span>
    )
  } else if (album.status === 'built') {
    icon = (
      <span title="Published to Wampy" className="shrink-0 inline-flex">
        <Check
          size={16}
          className="text-accent"
          strokeWidth={2}
        />
      </span>
    )
  } else if (album.status === 'preview_ready') {
    icon = (
      <span title="Preview ready — not yet published" className="shrink-0 inline-flex">
        <CassetteTape size={16} className="text-accent" strokeWidth={2} />
      </span>
    )
  } else {
    // not_built — clickable to trigger async preview
    icon = (
      <button
        onClick={handleIconClick}
        className="shrink-0 text-dim hover:text-accent transition-colors"
        title="Click to generate preview"
      >
        <CassetteTape size={16} strokeWidth={2} />
      </button>
    )
  }

  return (
    <Link
      to={`/album/${album.id}`}
      onClick={() => saveListState('', '')}
      className="group block card-lift overflow-hidden border border-border"
    >
      <div className="aspect-square relative overflow-hidden bg-[#111]">
        {album.has_cover ? (
          <img
            src={album.cover_url}
            alt={album.album}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-4xl text-border">NO COVER</span>
          </div>
        )}
      </div>
      <div className="p-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <MarqueeText className="text-sm font-bold text-text">{album.album}</MarqueeText>
          <div className="mt-1">
            <MarqueeText className="text-xs text-dim">{album.artist}</MarqueeText>
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            {album.track_count} TRACK{album.track_count !== 1 ? 'S' : ''}
          </p>
        </div>
        {icon}
      </div>
    </Link>
  )
}
