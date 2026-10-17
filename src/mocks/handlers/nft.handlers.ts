
import { http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'

import { nftListQuerySchema } from '@/contracts/nft'

import {
  listNfts,
  getNftById,
  listCollections,
} from '../domain/nft.catalog'

export const nftHandlers = [

  // GET /api/nfts
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)

    const result = nftListQuerySchema.safeParse(
      Object.fromEntries(url.searchParams)
    )

    if (!result.success) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetros de busca inválidos.',
            details: result.error.flatten(),
          },
        },
        { status: 422 }
      )
    }

    const { minPriceEth, maxPriceEth } = result.data

    // O preço mínimo não pode superar o máximo.
    if (
      minPriceEth !== undefined &&
      maxPriceEth !== undefined &&
      new Decimal(minPriceEth).gt(maxPriceEth)
    ) {
      return HttpResponse.json(
        {
          error: {
            code: 'INVALID_PRICE_RANGE',
            message:
              'O preço mínimo não pode superar o máximo.',
          },
        },
        { status: 422 }
      )
    }

    const response = listNfts(result.data)

    return HttpResponse.json(response)
  }),

  // GET /api/nfts/:id
  http.get('/api/nfts/:id', ({ params }) => {
    const id = String(params.id)
    const nft = getNftById(id)

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

    return HttpResponse.json({ nft })
  }),

  // GET /api/collections
  http.get('/api/collections', () => {
    return HttpResponse.json(listCollections())
  }),
]
