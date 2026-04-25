import { useInfiniteQuery } from '@tanstack/react-query'
import { getAlbums, getLibraryStatus, setIndexVersion, clearIndexVersion } from '../api/client'

const PAGE_SIZE = 24

export function useLibraryStatus() {
  return useInfiniteQuery({
    queryKey: ['libraryStatus'],
    queryFn: async () => {
      const data = await getLibraryStatus()
      setIndexVersion(data.index_version, data.index_hash)
      return data
    },
    getNextPageParam: () => undefined,
    initialPageParam: null as null,
  })
}

export function useAlbums(sortBy: string, order: string) {
  return useInfiniteQuery({
    queryKey: ['albums', sortBy, order],
    queryFn: async ({ pageParam }) => {
      try {
        const data = await getAlbums({
          limit: PAGE_SIZE,
          sort_by: sortBy,
          order: order,
          cursor: pageParam || undefined,
        })
        return data
      } catch (err: any) {
        if (err.code === 409) {
          clearIndexVersion()
        }
        throw err
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined
    },
    initialPageParam: '' as string | undefined,
  })
}
