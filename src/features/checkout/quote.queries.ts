
import { queryOptions } from '@tanstack/react-query'

import { quoteService } from '@/services/quote.service'

// Chaves de cache das cotações
export const quoteKeys = {
  all: ['quotes'] as const,

  byOwner: (owner: string) =>
    [...quoteKeys.all, owner] as const,

  detail: (owner: string, quoteId: string) =>
    [...quoteKeys.byOwner(owner), 'detail', quoteId] as const,
}

// Recuperar cotação existente
export function quoteQueryOptions(
  owner: string,
  quoteId: string
) {
  return queryOptions({
    queryKey: quoteKeys.detail(owner, quoteId),

    queryFn: ({ signal }) => quoteService.getById(quoteId, signal),

    // Revalidar a cotação ao consultá-la novamente.
    staleTime: 0,

    // Não repetir automaticamente erros 404 ou 410.
    retry: false,
  })
}
