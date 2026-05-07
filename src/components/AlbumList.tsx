import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAlbums } from '../hooks/useAlbums'
import AlbumCard from './AlbumCard'
import { saveListState } from './ScrollRestoration'

type SortField = 'album' | 'artist' | 'created_at' | 'modified_at'
type SortOrder = 'asc' | 'desc'

export default function AlbumList() {
  const [searchParams] = useSearchParams()

  const sortBy = (searchParams.get('sort_by') as SortField) || 'album'
  const order = (searchParams.get('order') as SortOrder) || 'asc'
  const search = searchParams.get('q') || ''

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAlbums(sortBy, order, search)

  const is409 = error && (error as any).code === 409
  useEffect(() => {
    if (is409) refetch()
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

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          saveListState(sortBy, order)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sortBy, order])

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
      <div className="mb-8 pt-3">
        <h1 className="font-display text-4xl text-accent tracking-wider">COOLCASSETTE</h1>
        <p className="text-[10px] text-dim tracking-[0.2em] uppercase mt-1">
          Library Browser
        </p>
      </div>

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
