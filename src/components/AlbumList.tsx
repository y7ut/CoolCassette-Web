import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAlbums } from '../hooks/useAlbums'
import AlbumCard from './AlbumCard'
import { saveListState } from './ScrollRestoration'

type SortField = 'album' | 'artist' | 'created_at' | 'modified_at'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: 'Album', value: 'album' },
  { label: 'Artist', value: 'artist' },
  { label: 'Created', value: 'created_at' },
  { label: 'Modified', value: 'modified_at' },
]

export default function AlbumList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = (searchParams.get('sort_by') as SortField) || 'album'
  const order = (searchParams.get('order') as SortOrder) || 'asc'

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAlbums(sortBy, order)

  // Auto-retry on 409: new index version/hash already set by apiFetch
  const is409 = error && (error as any).code === 409
  useEffect(() => {
    if (is409) {
      refetch()
    }
  }, [is409, refetch])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    observerRef.current = new IntersectionObserver(handleObserver, { rootMargin: '200px' })
    observerRef.current.observe(el)
    return () => observerRef.current?.disconnect()
  }, [handleObserver])

  // Save scroll position on scroll
  useEffect(() => {
    const onScroll = () => {
      saveListState(sortBy, order)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sortBy, order])

  const setSort = (field: SortField) => {
    const newOrder: SortOrder = sortBy === field && order === 'asc' ? 'desc' : 'asc'
    setSearchParams({ sort_by: field, order: newOrder })
  }

  const albums = data?.pages.flatMap((p) => p.items) || []

  const showLoading = isLoading || (isFetching && !isFetchingNextPage && albums.length === 0)

  if (error && !is409) {
    return (
      <div className="text-center py-20 fade-in">
        <h1 className="font-display text-4xl text-accent tracking-wider mb-2">COOLCASSETTE</h1>
        <p className="text-red-400 text-sm">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-accent tracking-wider">COOLCASSETTE</h1>
          <p className="text-[10px] text-dim tracking-[0.2em] uppercase mt-1">
            Library Browser
          </p>
        </div>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`btn-retro text-[10px] px-3 py-1.5 ${
                  active ? 'border-accent text-accent' : ''
                }`}
              >
                {opt.label}
                {active && (order === 'asc' ? ' ↑' : ' ↓')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Album grid */}
      {showLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden bg-surface border border-border">
              <div className="aspect-square skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton" />
                <div className="h-3 skeleton w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>

          {/* Load more sentinel */}
          <div ref={loadMoreRef} className="h-8 mt-8 flex items-center justify-center">
            {isFetchingNextPage && (
              <span className="text-dim text-xs tracking-widest animate-pulse-accent">
                LOADING MORE...
              </span>
            )}
            {!hasNextPage && albums.length > 0 && (
              <span className="text-dim text-xs tracking-widest">END OF LIBRARY</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
