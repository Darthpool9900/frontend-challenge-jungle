
import { http, HttpResponse } from 'msw'

import { createOrderSchema } from '@/contracts/order'

import type {
  Order,
  OrderResponse,
  OrdersResponse,
} from '@/contracts/order'

import { requireAuth } from '../domain/auth.guard'
import { revalidateQuote } from '../domain/quote.validation'

import { findQuote } from '../storage/quote.store'
import { getWalletConnection } from '../storage/wallet-connection.store'
import { getWallets } from '../storage/wallet.store'

import {
  getOrderDatabase,
  saveOrderDatabase,
  getIdempotencyIndex,
  findOrderByKey,
} from '../storage/order.store'

import {
  settleOrder,
  settleUserOrders,
} from '../domain/order.settlement'

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

function apiError(
  status: number,
  code: string,
  message: string
): Response {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  )
}

// ==========================================
// HANDLERS REST DOS PEDIDOS
// ==========================================

export const orderHandlers = [

  // ========================================
  // POST /api/orders
  // CRIAR PEDIDO
  // ========================================

  http.post('/api/orders', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    // ======================================
    // VALIDAR CHAVE DE IDEMPOTÊNCIA
    // ======================================

    const key = request.headers
      .get('Idempotency-Key')
      ?.trim()

    if (
      !key ||
      key.length < 8 ||
      key.length > 128
    ) {
      return apiError(
        422,
        'INVALID_IDEMPOTENCY_KEY',
        'Informe uma chave de idempotência válida.'
      )
    }

    // ======================================
    // VALIDAR DADOS DO PEDIDO
    // ======================================

    const body = await request.json()
      .catch(() => null)

    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(
        422,
        'VALIDATION_ERROR',
        'Dados do pedido inválidos.'
      )
    }

    const input = parsed.data
    const fingerprint = JSON.stringify(input)

    const database = getOrderDatabase()

    const index = getIdempotencyIndex(
      auth.userId,
      key
    )

    // ======================================
    // VERIFICAR IDEMPOTÊNCIA
    // ======================================

    const existingId = database.idempotencyIndex[index]

    if (existingId) {
      const existing = database.orders[existingId]

      if (!existing) {
        return apiError(
          409,
          'IDEMPOTENCY_STATE_CONFLICT',
          'Estado da tentativa inconsistente.'
        )
      }

      // Não permitir reutilizar uma chave
      // com dados de compra diferentes.
      if (existing.fingerprint !== fingerprint) {
        return apiError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Esta chave já foi utilizada com outros dados.'
        )
      }

      // Processar o pedido caso o prazo
      // de liquidação já tenha terminado.
      const currentOrder = settleOrder(
        auth.userId,
        existingId
      )

      if (!currentOrder) {
        return apiError(
          404,
          'ORDER_NOT_FOUND',
          'Pedido não encontrado.'
        )
      }

      const response: OrderResponse = {
        order: currentOrder,
      }

      // Pedido pendente: 202
      // Pedido finalizado: 200
      return HttpResponse.json(response, {
        status: currentOrder.status === 'pending'
          ? 202
          : 200,
      })
    }

    // ======================================
    // VALIDAR COTAÇÃO
    // ======================================

    const owner = `user:${auth.userId}`

    const quote = findQuote(
      owner,
      input.quoteId
    )

    if (!quote) {
      return apiError(
        404,
        'QUOTE_NOT_FOUND',
        'Cotação não encontrada.'
      )
    }

    const expiration = Date.parse(quote.expiresAt)

    if (
      !Number.isFinite(expiration) ||
      expiration <= Date.now()
    ) {
      return apiError(
        410,
        'QUOTE_EXPIRED',
        'A cotação expirou.'
      )
    }

    // Revalidar preço, estoque,
    // quantidade e versões dos NFTs.
    const validation = revalidateQuote(
      owner,
      quote
    )

    if (!validation.valid) {
      return apiError(
        409,
        validation.code,
        validation.message
      )
    }

    // ======================================
    // VALIDAR CARTEIRA
    // ======================================

    const wallet = getWallets(auth.userId).find(
      item => item.id === input.walletId
    )

    if (!wallet) {
      return apiError(
        404,
        'WALLET_NOT_FOUND',
        'Carteira não encontrada.'
      )
    }

    // ======================================
    // VALIDAR CONEXÃO
    // ======================================

    const connection = getWalletConnection(
      auth.userId
    )

    if (
      connection.status !== 'connected' ||
      connection.walletId !== wallet.id
    ) {
      return apiError(
        409,
        'WALLET_DISCONNECTED',
        'A carteira selecionada não está conectada.'
      )
    }

    // ======================================
    // VALIDAR REDE
    // ======================================

    if (
      connection.network !== quote.network ||
      wallet.network !== quote.network
    ) {
      return apiError(
        409,
        'NETWORK_MISMATCH',
        'A rede da carteira não corresponde à cotação.'
      )
    }

    // ======================================
    // CRIAR PEDIDO PENDENTE
    // ======================================

    const now = Date.now()
    const createdAt = new Date(now).toISOString()

    const order: Order = {
      id: crypto.randomUUID(),

      userId: auth.userId,
      quoteId: quote.quoteId,
      walletId: wallet.id,

      idempotencyKey: key,

      status: 'pending',
      version: 1,

      collector: structuredClone(input.collector),

      network: quote.network,
      currency: 'ETH',

      // Snapshot dos NFTs e valores
      items: structuredClone(quote.items),

      couponCode: quote.couponCode,

      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,

      // Preenchidos durante o processamento
      transactionReference: null,
      failureCode: null,

      createdAt,
      updatedAt: createdAt,
      settledAt: null,
    }

    // ======================================
    // DETERMINAR CENÁRIO DE PAGAMENTO
    // ======================================

    const scenario =
      database.scenarios[auth.userId] ?? 'confirm'

    database.orders[order.id] = {
      order,
      fingerprint,

      outcome: scenario === 'decline'
        ? 'decline'
        : 'confirm',

      // Simular processamento de 1,2 segundos.
      settleAt: now + 1200,
    }

    // Associar chave de idempotência ao pedido.
    database.idempotencyIndex[index] = order.id

    // Consumir o cenário atual.
    database.scenarios[auth.userId] = 'confirm'

    // Persistir antes de retornar a resposta.
    saveOrderDatabase(database)

    // ======================================
    // SIMULAR TIMEOUT DE REDE
    // ======================================

    if (scenario === 'timeout') {
      // O pedido já foi persistido.
      // O cliente poderá recuperá-lo
      // utilizando a chave de idempotência.
      return HttpResponse.error()
    }

    const response: OrderResponse = {
      order,
    }

    return HttpResponse.json(response, {
      status: 202,
    })
  }),

  // ========================================
  // GET /api/orders
  // LISTAR PEDIDOS DO USUÁRIO
  // ========================================

  http.get('/api/orders', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    // Processar pedidos pendentes cujo
    // tempo de liquidação já terminou.
    const orders = settleUserOrders(
      auth.userId
    )

    const response: OrdersResponse = {
      orders,
    }

    return HttpResponse.json(response)
  }),

  // ========================================
  // GET /api/orders/by-key/:key
  // RECUPERAR PEDIDO PELA CHAVE
  // ========================================

  http.get(
    '/api/orders/by-key/:key',
    async ({ request, params }) => {
      const auth = await requireAuth(request)

      if (!auth.authorized) {
        return auth.response
      }

      const stored = findOrderByKey(
        auth.userId,
        String(params.key)
      )

      if (!stored) {
        return apiError(
          404,
          'ORDER_NOT_FOUND',
          'Pedido não encontrado.'
        )
      }

      // Finalizar se o prazo já passou.
      const currentOrder = settleOrder(
        auth.userId,
        stored.order.id
      )

      if (!currentOrder) {
        return apiError(
          404,
          'ORDER_NOT_FOUND',
          'Pedido não encontrado.'
        )
      }

      const response: OrderResponse = {
        order: currentOrder,
      }

      return HttpResponse.json(response)
    }
  ),

  // ========================================
  // GET /api/orders/:orderId
  // CONSULTAR PEDIDO INDIVIDUAL
  // ========================================

  http.get(
    '/api/orders/:orderId',
    async ({ request, params }) => {
      const auth = await requireAuth(request)

      if (!auth.authorized) {
        return auth.response
      }

      // A função valida o proprietário,
      // verifica o prazo de processamento
      // e retorna o estado atualizado.
      const currentOrder = settleOrder(
        auth.userId,
        String(params.orderId)
      )

      if (!currentOrder) {
        return apiError(
          404,
          'ORDER_NOT_FOUND',
          'Pedido não encontrado.'
        )
      }

      const response: OrderResponse = {
        order: currentOrder,
      }

      return HttpResponse.json(response)
    }
  ),
]
