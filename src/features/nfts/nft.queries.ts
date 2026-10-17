
import {
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query'

import { nftService } from '@/services/nft.service'

import {
  nftListQuerySchema,
  type NftListParams,
} from '@/contracts/nft'

// Chaves padronizadas do cache
export const nftKeys = {
  all: ['nfts'] as const,

  lists: () => [...nftKeys.all, 'list'] as const,

  list: (params: NftListParams = {}) =>
    [
      ...nftKeys.lists(),
      nftListQuerySchema.parse(params),
    ] as const,

  details: () => [...nftKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...nftKeys.details(), id] as const,

  collections: ['nft-collections'] as const,
}

// Catálogo com filtros e paginação
export function nftListQueryOptions(
  params: NftListParams = {}
) {
  const normalizedParams = nftListQuerySchema.parse(params)

  return queryOptions({
    queryKey: nftKeys.list(normalizedParams),

    queryFn: ({ signal }) => nftService.list(normalizedParams, signal),

    staleTime: 30_000,

    placeholderData: keepPreviousData,

    retry: 1,
  })
}

// Detalhes de um NFT
export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),

    queryFn: ({ signal }) => nftService.getById(id, signal),

    staleTime: 30_000,

    retry: 1,
  })
}

// Coleções
export function nftCollectionsQueryOptions() {
  return queryOptions({
    queryKey: nftKeys.collections,

    queryFn: () => nftService.getCollections(),

    staleTime: 5 * 60_000,

    retry: 1,
  })
}
