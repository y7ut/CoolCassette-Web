import { Link } from 'react-router-dom'
import { Check, Eye, Hammer } from 'lucide-react'
import { useRef, useEffect } from 'react'
import type { AlbumItem } from '../api/client'
import { saveListState } from './ScrollRestoration'

interface AlbumCardProps {
  album: AlbumItem
}

const STATUS_ICON = {
  built: { Icon: Check, className: 'text-accent' },
  preview_ready: { Icon: Eye, className: 'text-orange-400' },
  not_built: { Icon: Hammer, className: 'text-dim' },
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
  const { Icon, className } = STATUS_ICON[album.status]

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
        <Icon size={16} className={`shrink-0 ${className}`} strokeWidth={2} />
      </div>
    </Link>
  )
}
