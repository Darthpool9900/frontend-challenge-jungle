
import { api } from '@/api/client'

import type {
  AddCartItemInput,
  CartResponse,
  CartMergeResponse
} from '@/contracts/cart'

export const cartService = {
  // GET /api/cart
  async get(signal?: AbortSignal): Promise<CartResponse> {
    const { data } = await api.get<CartResponse>('/cart', { signal })

    return data
  },


  // Mesclar carrinho visitante após autenticação
  async mergeGuest(): Promise<CartMergeResponse> {
    const { data } = await api.post<CartMergeResponse>(
      '/cart/merge'
    )

    return data
  },

  // POST /api/cart/items
  async add(
    input: AddCartItemInput
  ): Promise<CartResponse> {
    const { data } = await api.post<CartResponse>(
      '/cart/items',
      input
    )

    return data
  },

  // PATCH /api/cart/items/:nftId/:editionId
  async update(
    nftId: string,
    editionId: string,
    quantity: number
  ): Promise<CartResponse> {
    const { data } = await api.patch<CartResponse>(
      `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`,
      { quantity }
    )

    return data
  },

  // DELETE /api/cart/items/:nftId/:editionId
  async remove(
    nftId: string,
    editionId: string
  ): Promise<CartResponse> {
    const { data } = await api.delete<CartResponse>(
      `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`
    )

    return data
  },
}
