import { Link } from 'react-router-dom'
import { Check, Eye, Hammer } from 'lucide-react'
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
          <h3 className="text-sm font-bold text-text truncate">{album.album}</h3>
          <p className="text-xs text-dim mt-1 truncate">{album.artist}</p>
          <p className="text-[10px] text-text-muted mt-2">
            {album.track_count} TRACK{album.track_count !== 1 ? 'S' : ''}
          </p>
        </div>
        <Icon size={16} className={`shrink-0 ${className}`} strokeWidth={2} />
      </div>
    </Link>
  )
}
