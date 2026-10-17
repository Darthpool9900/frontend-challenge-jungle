
import { queryOptions } from '@tanstack/react-query'
import { cartService } from '@/services/cart.service'

export const cartKeys = {
  all: ['cart'] as const,

  byOwner: (owner: string) =>
    [...cartKeys.all, owner] as const,
}

export function cartQueryOptions(owner: string) {
  return queryOptions({
    queryKey: cartKeys.byOwner(owner),
    queryFn: ({ signal }) => cartService.get(signal),
    staleTime: 0,
    retry: 1,
  })
}
