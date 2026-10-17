
import { http, HttpResponse } from 'msw'

import { requireAuth } from '../domain/auth.guard'
import { getNftById } from '../domain/nft.catalog'

import {
  getFavoriteIds,
  addFavorite,
  removeFavorite,
} from '../storage/favorites.store'

import type {
  FavoritesResponse,
  FavoriteMutationResponse,
} from '@/contracts/favorites'

export const favoritesHandlers = [
  // GET /api/favorites
  http.get('/api/favorites', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    const response: FavoritesResponse = {
      nftIds: getFavoriteIds(auth.userId),
    }

    return HttpResponse.json(response)
  }),

  // POST /api/favorites/:nftId
  http.post(
    '/api/favorites/:nftId',
    async ({ request, params }) => {
      const auth = await requireAuth(request)

      if (!auth.authorized) {
        return auth.response
      }

      const nftId = String(params.nftId ?? '')
      const nft = getNftById(nftId)

      if (!nft) {
        return HttpResponse.json(
          {
            error: {
              code: 'NFT_NOT_FOUND',
              message: 'NFT não encontrado.',
            },
          },
          { status: 404 }
        )
      }

      addFavorite(auth.userId, nftId)

      const response: FavoriteMutationResponse = {
        nftId,
        isFavorite: true,
      }

      return HttpResponse.json(response)
    }
  ),

  // DELETE /api/favorites/:nftId
  http.delete(
    '/api/favorites/:nftId',
    async ({ request, params }) => {
      const auth = await requireAuth(request)

      if (!auth.authorized) {
        return auth.response
      }

      const nftId = String(params.nftId ?? '')

      removeFavorite(auth.userId, nftId)

      const response: FavoriteMutationResponse = {
        nftId,
        isFavorite: false,
      }

      return HttpResponse.json(response)
    }
  ),
]
