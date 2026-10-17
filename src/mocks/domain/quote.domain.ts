
import Decimal from 'decimal.js'

import type {
  QuoteResponse,
  QuoteItem,
  QuoteIssue,
  NormalizedQuoteRequest,
} from '@/contracts/quote'

import { getCartItems } from '../storage/cart.store'
import { getNftById } from './nft.catalog'

import {
  coupons,
  networkFeesEth,
} from '../data/quote.fixtures'

const QUOTE_TTL_MS = 5 * 60 * 1000

export class QuoteValidationError extends Error {
  public readonly code: string
  constructor(
    code: string,
    message: string
  ) {
    super(message)
    this.code = code
    this.name = 'QuoteValidationError'
  }
}

export function calculateQuote(
  owner: string,
  input: NormalizedQuoteRequest
): QuoteResponse {
  const storedItems = getCartItems(owner)

  const issues: QuoteIssue[] = []
  const items: QuoteItem[] = []

  let subtotal = new Decimal(0)

  if (storedItems.length === 0) {
    issues.push({
      code: 'EMPTY_CART',
      message: 'O carrinho está vazio.',
    })
  }

  for (const stored of storedItems) {
    const nft = getNftById(stored.nftId)

    const edition = nft?.editions.find(
      item => item.id === stored.editionId
    )

    if (!nft || !edition) {
      issues.push({
        code: 'NFT_UNAVAILABLE',
        message: 'NFT ou edição indisponível.',
        nftId: stored.nftId,
        editionId: stored.editionId,
      })

      continue
    }

    if (stored.quantity > edition.availableQuantity) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        message: 'Estoque insuficiente.',
        nftId: nft.id,
        editionId: edition.id,
      })
    }

    const originalPrice = stored.unitPriceAtAddEth

    if (
      originalPrice !== undefined &&
      !new Decimal(originalPrice).eq(edition.priceEth)
    ) {
      issues.push({
        code: 'PRICE_CHANGED',
        message: 'O preço do NFT foi alterado.',
        nftId: nft.id,
        editionId: edition.id,
      })
    }

    const lineTotal = new Decimal(edition.priceEth)
      .mul(stored.quantity)

    subtotal = subtotal.plus(lineTotal)

    items.push({
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      quantity: stored.quantity,
      unitPriceEth: edition.priceEth,
      totalEth: lineTotal.toString(),
      editionVersion: edition.version,
    })
  }

  // ========================================
  // CUPONS
  // ========================================

  let discount = new Decimal(0)
  let couponCode: string | null = null

  if (input.couponCode) {
    const code = input.couponCode.toUpperCase()

    const coupon = coupons.find(
      item => item.code === code
    )

    if (!coupon) {
      throw new QuoteValidationError(
        'INVALID_COUPON',
        'Cupom inválido.'
      )
    }

    if (Date.parse(coupon.expiresAt) <= Date.now()) {
      throw new QuoteValidationError(
        'EXPIRED_COUPON',
        'Este cupom expirou.'
      )
    }

    couponCode = coupon.code

    if (coupon.type === 'percentage') {
      discount = subtotal
        .mul(coupon.value)
        .div(100)
    } else {
      discount = new Decimal(coupon.value)
    }

    // O desconto nunca pode superar o subtotal.
    discount = Decimal.min(discount, subtotal)
  }

  // ========================================
  // TAXAS E TOTAL
  // ========================================

  const networkFee = storedItems.length > 0
    ? new Decimal(networkFeesEth[input.network])
    : new Decimal(0)

  const total = subtotal
    .minus(discount)
    .plus(networkFee)

  const now = Date.now()

  return {
    quoteId: crypto.randomUUID(),

    status: issues.length === 0
      ? 'ready'
      : 'requires_review',

    currency: 'ETH',
    network: input.network,

    items,
    couponCode,

    subtotalEth: subtotal.toString(),
    discountEth: discount.toString(),
    networkFeeEth: networkFee.toString(),
    totalEth: total.toString(),

    issues,

    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(
      now + QUOTE_TTL_MS
    ).toISOString(),
  }
}
