import { useQuery } from '@tanstack/react-query'
import { getAlbumDetail, postPreview, postPublish } from '../api/client'

export function useAlbumDetail(id: string) {
  return useQuery({
    queryKey: ['albumDetail', id],
    queryFn: () => getAlbumDetail(id),
    enabled: !!id,
  })
}

export function usePreviewMutation() {
  return {
    mutateAsync: postPreview,
  }
}

export function usePublishMutation() {
  return {
    mutateAsync: postPublish,
  }
}
