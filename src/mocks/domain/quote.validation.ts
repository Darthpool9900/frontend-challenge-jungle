
import Decimal from 'decimal.js'

import type {
  QuoteResponse,
  QuoteValidationResponse,
} from '@/contracts/quote'

import {
  calculateQuote,
  QuoteValidationError,
} from './quote.domain'

function invalid(
  code: 'QUOTE_STALE' | 'QUOTE_REQUIRES_REVIEW',
  message: string
): QuoteValidationResponse {
  return {
    valid: false,
    code,
    message,
  }
}

export function revalidateQuote(
  owner: string,
  original: QuoteResponse
): QuoteValidationResponse {
  // Não permitir pagamento de cotação que
  // já apresentava problemas.
  if (original.status !== 'ready') {
    return invalid(
      'QUOTE_REQUIRES_REVIEW',
      'A cotação precisa ser revisada.'
    )
  }

  let current: QuoteResponse

  try {
    current = calculateQuote(owner, {
      network: original.network,
      couponCode: original.couponCode ?? undefined,
    })
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return invalid(
        'QUOTE_STALE',
        error.message
      )
    }

    throw error
  }

  // Verificar estoque, disponibilidade e preços
  // registrados no carrinho.
  if (current.status !== 'ready') {
    return invalid(
      'QUOTE_STALE',
      'O carrinho foi alterado e precisa de uma nova cotação.'
    )
  }

  // Verificar alterações na quantidade de itens.
  if (original.items.length !== current.items.length) {
    return invalid(
      'QUOTE_STALE',
      'Os itens do carrinho foram alterados.'
    )
  }

  // Comparar as edições e suas versões.
  const originalItems = new Map(
    original.items.map(item => [
      `${item.nftId}:${item.editionId}`,
      item,
    ])
  )

  for (const item of current.items) {
    const key = `${item.nftId}:${item.editionId}`
    const previous = originalItems.get(key)

    if (
      !previous ||
      previous.quantity !== item.quantity ||
      previous.editionVersion !== item.editionVersion ||
      !new Decimal(previous.unitPriceEth).eq(item.unitPriceEth)
    ) {
      return invalid(
        'QUOTE_STALE',
        'Quantidade, preço ou versão do NFT foi alterada.'
      )
    }
  }

  // Comparar valores financeiros.
  const amountChanged = (
    originalAmount: string,
    currentAmount: string
  ) => !new Decimal(originalAmount).eq(currentAmount)

  if (
    original.network !== current.network ||
    original.couponCode !== current.couponCode ||
    amountChanged(original.subtotalEth, current.subtotalEth) ||
    amountChanged(original.discountEth, current.discountEth) ||
    amountChanged(original.networkFeeEth, current.networkFeeEth) ||
    amountChanged(original.totalEth, current.totalEth)
  ) {
    return invalid(
      'QUOTE_STALE',
      'Os valores da compra foram alterados.'
    )
  }

  return {
    valid: true,
    quote: original,
  }
}
