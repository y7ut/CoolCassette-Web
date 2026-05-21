import { useQuery } from '@tanstack/react-query'
import { getAlbumDetail } from '../api/client'

export function useAlbumDetail(id: string) {
  return useQuery({
    queryKey: ['albumDetail', id],
    queryFn: () => getAlbumDetail(id),
    enabled: !!id,
  })
}
