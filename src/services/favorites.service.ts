
import { api } from '@/api/client'

import type {
  FavoritesResponse,
  FavoriteMutationResponse,
} from '@/contracts/favorites'

export const favoritesService = {
  // Listar favoritos do usuário autenticado
  async list(): Promise<FavoritesResponse> {
    const { data } = await api.get<FavoritesResponse>(
      '/favorites'
    )

    return data
  },

  // Adicionar NFT aos favoritos
  async add(
    nftId: string
  ): Promise<FavoriteMutationResponse> {
    const { data } = await api.post<FavoriteMutationResponse>(
      `/favorites/${encodeURIComponent(nftId)}`
    )

    return data
  },

  // Remover NFT dos favoritos
  async remove(
    nftId: string
  ): Promise<FavoriteMutationResponse> {
    const { data } = await api.delete<FavoriteMutationResponse>(
      `/favorites/${encodeURIComponent(nftId)}`
    )

    return data
  },
}
