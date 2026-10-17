
import { queryOptions } from '@tanstack/react-query'

import { walletService } from '@/services/wallet.service'

// Chaves de cache por usuário
export const walletKeys = {
  all: ['wallets'] as const,

  byUser: (userId: string) =>
    [...walletKeys.all, 'user', userId] as const,
}

// Listagem de carteiras
export function walletQueryOptions(userId: string) {
  return queryOptions({
    queryKey: walletKeys.byUser(userId),

    queryFn: () => walletService.list(),

    staleTime: 30_000,

    retry: 1,
  })
}
