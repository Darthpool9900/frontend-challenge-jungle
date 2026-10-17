
import { z } from 'zod'

import {
  walletNetworkSchema,
  type WalletNetwork,
} from '@/contracts/wallet'

export const quoteRequestSchema = z.object({
  network: walletNetworkSchema.default('ethereum'),

  couponCode: z.string()
    .trim()
    .min(1)
    .max(32)
    .optional(),
})

export type QuoteRequest = z.input<
  typeof quoteRequestSchema
>

export type NormalizedQuoteRequest = z.output<
  typeof quoteRequestSchema
>

export type QuoteIssueCode =
  | 'EMPTY_CART'
  | 'NFT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'PRICE_CHANGED'

export interface QuoteIssue {
  code: QuoteIssueCode
  message: string
  nftId?: string
  editionId?: string
}

export interface QuoteItem {
  nftId: string
  editionId: string
  name: string
  quantity: number
  unitPriceEth: string
  totalEth: string
  editionVersion: number
}

export interface QuoteResponse {
  quoteId: string
  status: 'ready' | 'requires_review'
  currency: 'ETH'
  network: WalletNetwork

  items: QuoteItem[]

  couponCode: string | null

  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string

  issues: QuoteIssue[]

  createdAt: string
  expiresAt: string
}


export type QuoteValidationResponse =
  | {
      valid: true
      quote: QuoteResponse
    }
  | {
      valid: false
      code: 'QUOTE_STALE' | 'QUOTE_REQUIRES_REVIEW'
      message: string
    }

