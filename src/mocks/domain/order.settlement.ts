import { publishNft, publishOrder } from '../realtime/socket.publisher'

import type {
  Order,
  OrderFailureCode,
} from '@/contracts/order'

import type {
  StoredCartItem,
} from '@/contracts/cart'

import {
  getOrderDatabase,
  saveOrderDatabase,
  listUserOrders,
} from '../storage/order.store'

import {
  getNftDatabase,
  saveNftDatabase,
  type NftDatabase,
} from '../storage/nft.store'

import {
  getCartItems,
  saveCartItems,
} from '../storage/cart.store'

import { findQuote } from '../storage/quote.store'
import { getWallets } from '../storage/wallet.store'

import {
  getWalletConnection,
} from '../storage/wallet-connection.store'

import { revalidateQuote } from './quote.validation'

type PurchasePlan =
  | {
      ok: true
      nfts: NftDatabase
      cart: StoredCartItem[]
    }
  | {
      ok: false
      failureCode: 'STOCK_CHANGED' | 'QUOTE_STALE'
    }

// ==========================================
// PREPARAR COMPRA SEM MODIFICAR O BANCO
// ==========================================

function preparePurchase(
  order: Order
): PurchasePlan {
  const nfts = structuredClone(getNftDatabase())
  const owner = `user:${order.userId}`

  const cart = getCartItems(owner)

  const required = new Map<
    string,
    {
      nftId: string
      editionId: string
      quantity: number
    }
  >()

  // Agrupar quantidades por edição.
  for (const item of order.items) {
    const key = JSON.stringify([
      item.nftId,
      item.editionId,
    ])

    const previous = required.get(key)

    required.set(key, {
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: (previous?.quantity ?? 0) + item.quantity,
    })
  }

  // Validar tudo antes de descontar estoque.
  for (const item of required.values()) {
    const nft = nfts.nfts.find(
      value => value.id === item.nftId
    )

    const edition = nft?.editions.find(
      value => value.id === item.editionId
    )

    if (
      !edition ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      edition.availableQuantity < item.quantity
    ) {
      return {
        ok: false,
        failureCode: 'STOCK_CHANGED',
      }
    }

    const cartItem = cart.find(
      value =>
        value.nftId === item.nftId &&
        value.editionId === item.editionId
    )

    if (
      !cartItem ||
      cartItem.quantity < item.quantity
    ) {
      return {
        ok: false,
        failureCode: 'QUOTE_STALE',
      }
    }
  }

  // ========================================
  // APLICAR ALTERAÇÕES SOMENTE NAS CÓPIAS
  // ========================================

  for (const item of required.values()) {
    const nft = nfts.nfts.find(
      value => value.id === item.nftId
    )!

    const edition = nft.editions.find(
      value => value.id === item.editionId
    )!

    edition.availableQuantity -= item.quantity
    edition.version += 1

    nft.version += 1

    nft.availableQuantity = nft.editions.reduce(
      (total, value) =>
        total + value.availableQuantity,
      0
    )

    const cartItem = cart.find(
      value =>
        value.nftId === item.nftId &&
        value.editionId === item.editionId
    )!

    // Descontar somente a quantidade comprada.
    cartItem.quantity -= item.quantity
  }

  return {
    ok: true,
    nfts,
    cart: cart.filter(item => item.quantity > 0),
  }
}

// ==========================================
// FINALIZAR UM PEDIDO
// ==========================================

export function settleOrder(
  userId: string,
  orderId: string
): Order | null {
  const database = getOrderDatabase()
  const stored = database.orders[orderId]

  if (!stored || stored.order.userId !== userId) {
    return null
  }

  const order = stored.order

  // Nunca processar novamente pedidos finalizados.
  if (order.status !== 'pending') {
    return structuredClone(order)
  }

  // Ainda está dentro do tempo de processamento.
  if (Date.now() < stored.settleAt) {
    return structuredClone(order)
  }

  let failure: OrderFailureCode = null
  let purchase: PurchasePlan | null = null

  // ========================================
  // SIMULAR RECUSA
  // ========================================

  if (stored.outcome === 'decline') {
    failure = 'PAYMENT_DECLINED'
  }

  // ========================================
  // VALIDAR CARTEIRA
  // ========================================

  if (!failure) {
    const connection = getWalletConnection(userId)

    const wallet = getWallets(userId).find(
      item => item.id === order.walletId
    )

    if (
      !wallet ||
      connection.status !== 'connected' ||
      connection.walletId !== wallet.id ||
      connection.network !== order.network ||
      wallet.network !== order.network
    ) {
      failure = 'WALLET_DISCONNECTED'
    }
  }

  // ========================================
  // REVALIDAR COTAÇÃO
  // ========================================

  if (!failure) {
    const owner = `user:${userId}`

    const quote = findQuote(owner, order.quoteId)

    if (
      !quote ||
      !Number.isFinite(Date.parse(quote.expiresAt)) ||
      Date.parse(quote.expiresAt) <= Date.now()
    ) {
      failure = 'QUOTE_STALE'
    } else {
      purchase = preparePurchase(order)

      if (!purchase.ok) {
        failure = purchase.failureCode
      } else {
        const validation = revalidateQuote(
          owner,
          quote
        )

        if (!validation.valid) {
          failure = 'QUOTE_STALE'
        }
      }
    }
  }

  // ========================================
  // CONFIRMAR OU RECUSAR
  // ========================================

  const now = new Date().toISOString()

  order.status = failure ? 'declined' : 'confirmed'
  order.failureCode = failure

  order.version += 1
  order.updatedAt = now
  order.settledAt = now

  order.transactionReference = failure
    ? null
    : `SIM-${crypto.randomUUID().toUpperCase()}`

  if (!failure && purchase?.ok) {
    // Persistir estoque e carrinho atualizados.
    saveNftDatabase(purchase.nfts)

    saveCartItems(
      `user:${userId}`,
      purchase.cart
    )
  }

  // Persistir estado final do pedido.
  saveOrderDatabase(database)
  if (!failure && purchase?.ok) {
    for (const nftId of new Set(order.items.map(item => item.nftId))) {
      const nft = purchase.nfts.nfts.find(item => item.id === nftId)!
      const edition = nft.editions.find(item => order.items.some(line => line.nftId === nftId && line.editionId === item.id))!
      publishNft(nft, edition)
    }
  }
  publishOrder(order)

  return structuredClone(order)
}

// ==========================================
// PROCESSAR PEDIDOS PENDENTES DO USUÁRIO
// ==========================================

export function settleUserOrders(
  userId: string
): Order[] {
  const orders = listUserOrders(userId)

  for (const order of orders) {
    if (order.status === 'pending') {
      settleOrder(userId, order.id)
    }
  }

  return listUserOrders(userId)
}
