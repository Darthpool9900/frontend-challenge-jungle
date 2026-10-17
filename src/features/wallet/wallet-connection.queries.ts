
import { queryOptions } from '@tanstack/react-query'

import { walletConnectionService } from '@/services/wallet-connection.service'

export const walletConnectionKeys = {
  all: ['wallet-connection'] as const,

  byUser: (userId: string) =>
    [...walletConnectionKeys.all, userId] as const,
}

export function walletConnectionQueryOptions(
  userId: string
) {
  return queryOptions({
    queryKey: walletConnectionKeys.byUser(userId),
    queryFn: () => walletConnectionService.get(),
    staleTime: 0,
    retry: false,
  })
}
