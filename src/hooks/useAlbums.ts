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

export function useAlbums(sortBy: string, order: string, search: string) {
  return useInfiniteQuery({
    queryKey: ['albums', sortBy, order, search],
    queryFn: async ({ pageParam }) => {
      const fetchPage = async (cursor: string | undefined) =>
        getAlbums({
          limit: PAGE_SIZE,
          sort_by: sortBy,
          order: order,
          cursor: cursor || undefined,
          q: search || undefined,
        })

      try {
        return await fetchPage(pageParam || undefined)
      } catch (err: any) {
        if (err.code === 409) {
          // 409 response body already contains the new index version — adopt it and retry once
          if (err.body?.index_version && err.body?.index_hash) {
            setIndexVersion(err.body.index_version, err.body.index_hash)
          } else {
            clearIndexVersion()
          }
          // One automatic retry with the updated index header
          return await fetchPage(pageParam || undefined)
        }
        throw err
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined
    },
    initialPageParam: '' as string | undefined,
    retry: false, // we handle retries manually above
  })
}
