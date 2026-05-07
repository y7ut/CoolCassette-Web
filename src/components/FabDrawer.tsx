import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

type SortField = 'album' | 'artist' | 'created_at' | 'modified_at'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: 'Album', value: 'album' },
  { label: 'Artist', value: 'artist' },
  { label: 'Created', value: 'created_at' },
  { label: 'Modified', value: 'modified_at' },
]

interface FabDrawerProps {
  onOpenSettings: () => void
}

export default function FabDrawer({ onOpenSettings }: FabDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const lastClickRef = useRef<number>(0)

  const sortBy = (searchParams.get('sort_by') as SortField) || 'album'
  const order = (searchParams.get('order') as SortOrder) || 'asc'
  const search = searchParams.get('q') || ''

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const onScroll = () => {
      setDrawerOpen(window.scrollY <= 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const setSort = useCallback((field: SortField) => {
    const currentOrder = (searchParams.get('order') as SortOrder) || 'asc'
    const currentSearch = searchParams.get('q') || ''
    const newOrder: SortOrder = field === sortBy && currentOrder === 'asc' ? 'desc' : 'asc'
    const params: Record<string, string> = { sort_by: field, order: newOrder }
    if (currentSearch) params.q = currentSearch
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [searchParams, sortBy, setSearchParams])

  const commitSearch = useCallback((value: string) => {
    const params: Record<string, string> = { sort_by: sortBy, order }
    if (value) params.q = value
    setSearchParams(params)
  }, [sortBy, order, setSearchParams])

  const handleToggleClick = () => {
    const now = Date.now()
    if (now - lastClickRef.current < 300) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      lastClickRef.current = 0
      return
    }
    lastClickRef.current = now
    setDrawerOpen((v) => !v)
  }

  return (
    <div className="fab-container">
      <div className={`fab-panel ${drawerOpen ? 'fab-panel-open' : ''}`}>

        <div className="search-wrap flex items-center h-[30px]">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitSearch(searchInput)}
            placeholder="SEARCH"
            className="bg-transparent text-xs text-text px-2 py-1 w-44 outline-none placeholder:text-dim font-mono tracking-wider border-b border-border focus:border-accent transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); commitSearch('') }}
              className="px-2 text-dim hover:text-accent text-xs transition-colors flex-shrink-0"
            >
              ✕
            </button>
          )}
        </div>
                {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`text-[10px] px-3 py-1.5 tracking-wider uppercase ${
                active ? 'text-accent' : 'text-dim'
              }`}
            >
              {opt.label}
              {active && (order === 'asc' ? ' ↑' : ' ↓')}
            </button>
          )
        })}
        <button
          onClick={onOpenSettings}
          className="text-[10px] px-3 py-1.5 text-dim tracking-wider uppercase"
        >
          SETTING
        </button>
      </div>
      <button onClick={handleToggleClick} className="fab-toggle" />
    </div>
  )
}
