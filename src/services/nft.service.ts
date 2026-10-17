
import { api } from '@/api/client'

import type {
  NftListParams,
  NftListResponse,
  NftDetailResponse,
  NftCollection,
} from '@/contracts/nft'

export const nftService = {
  // GET /api/nfts
  async list(
    params: NftListParams = {},
    signal?: AbortSignal
  ): Promise<NftListResponse> {
    const { data } = await api.get<NftListResponse>(
      '/nfts',
      { params, signal }
    )

    return data
  },

  // GET /api/nfts/:id
  async getById(
    id: string,
    signal?: AbortSignal
  ): Promise<NftDetailResponse> {
    const { data } = await api.get<NftDetailResponse>(
      `/nfts/${encodeURIComponent(id)}`, { signal }
    )

    return data
  },

  // GET /api/collections
  async getCollections(): Promise<NftCollection[]> {
    const { data } = await api.get<NftCollection[]>(
      '/collections'
    )

    return data
  },
}
