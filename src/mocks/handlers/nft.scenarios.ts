import { publishNft } from '../realtime/socket.publisher'

import { http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import { z } from 'zod'

import { ethAmountSchema } from '@/contracts/nft'

import {
  getNftDatabase,
  saveNftDatabase,
} from '../storage/nft.store'

const updateEditionSchema = z.object({
  priceEth: ethAmountSchema.optional(),
  availableQuantity: z.number().int().min(0).optional(),
}).refine(
  data =>
    data.priceEth !== undefined ||
    data.availableQuantity !== undefined,
  { message: 'Informe pelo menos uma alteração.' }
)

// Available whenever mocks are enabled, including static demonstrations.
export const nftScenarioHandlers = import.meta.env.VITE_ENABLE_MOCKS === 'true'
  ? [
      http.patch(
        '/api/__test/nfts/:nftId/editions/:editionId',
        async ({ request, params }) => {
          const body = await request.json().catch(() => null)
          const result = updateEditionSchema.safeParse(body)

          if (!result.success) {
            return HttpResponse.json(
              {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Dados inválidos.',
                },
              },
              { status: 422 }
            )
          }

          const database = getNftDatabase()

          const nft = database.nfts.find(
            item => item.id === String(params.nftId)
          )

          if (!nft) {
            return HttpResponse.json(
              { error: { code: 'NFT_NOT_FOUND' } },
              { status: 404 }
            )
          }

          const edition = nft.editions.find(
            item => item.id === String(params.editionId)
          )

          if (!edition) {
            return HttpResponse.json(
              { error: { code: 'EDITION_NOT_FOUND' } },
              { status: 404 }
            )
          }

          const { priceEth, availableQuantity } = result.data

          if (
            availableQuantity !== undefined &&
            availableQuantity > edition.totalSupply
          ) {
            return HttpResponse.json(
              {
                error: {
                  code: 'INVALID_STOCK',
                  message: 'Estoque maior que a oferta total.',
                },
              },
              { status: 422 }
            )
          }

          let changed = false

          if (
            priceEth !== undefined &&
            !new Decimal(priceEth).eq(edition.priceEth)
          ) {
            edition.priceEth = priceEth
            changed = true
          }

          if (
            availableQuantity !== undefined &&
            availableQuantity !== edition.availableQuantity
          ) {
            edition.availableQuantity = availableQuantity
            changed = true
          }

          if (changed) {
            edition.version += 1
            nft.version += 1

            nft.startingPriceEth = Decimal.min(
              ...nft.editions.map(item => item.priceEth)
            ).toString()

            nft.availableQuantity = nft.editions.reduce(
              (total, item) =>
                total + item.availableQuantity,
              0
            )

            saveNftDatabase(database)
            publishNft(nft, edition)
          }

          return HttpResponse.json({
            nft,
            edition,
            changed,
          })
        }
      ),
    ]
  : []
