
import { queryOptions } from '@tanstack/react-query'

import { favoritesService } from '@/services/favorites.service'

export const favoriteKeys = {
  all: ['favorites'] as const,

  byUser: (userId: string) =>
    [...favoriteKeys.all, 'user', userId] as const,
}

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoriteKeys.byUser(userId),
    queryFn: () => favoritesService.list(),
    staleTime: 15_000,
    retry: false,
  })
}
