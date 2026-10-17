
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { NftListParams } from '@/contracts/nft'

import {
  nftKeys,
  nftListQueryOptions,
  nftDetailQueryOptions,
  nftCollectionsQueryOptions,
} from './nft.queries'

// Consultar catálogo
export function useNftList(
  params: NftListParams = {}
) {
  return useQuery(nftListQueryOptions(params))
}

// Consultar NFT individual
export function useNftDetail(id: string) {
  return useQuery({
    ...nftDetailQueryOptions(id),

    // Evita consultas com ID vazio.
    enabled: id.trim().length > 0,
  })
}

// Consultar coleções
export function useNftCollections() {
  return useQuery(nftCollectionsQueryOptions())
}

// Atualizar o cache após mudanças de dados
export function useInvalidateNfts() {
  const queryClient = useQueryClient()

  return {
    invalidateList: () =>
      queryClient.invalidateQueries({
        queryKey: nftKeys.lists(),
      }),

    invalidateDetail: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: nftKeys.detail(id),
      }),

    invalidateAll: () =>
      queryClient.invalidateQueries({
        queryKey: nftKeys.all,
      }),
  }
}
