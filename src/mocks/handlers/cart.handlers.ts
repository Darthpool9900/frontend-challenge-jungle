
import { http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'

import {
  addCartItemSchema,
  updateCartItemSchema,
} from '@/contracts/cart'

import type {
  CartResponse,
  CartLine,
  StoredCartItem,
} from '@/contracts/cart'

import { requireAuth } from '../domain/auth.guard'
import { getNftById } from '../domain/nft.catalog'

import {
  getCartItems,
  saveCartItems,
  commitCartMerge,
} from '../storage/cart.store'

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

function errorResponse(
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
// IDENTIFICAR PROPRIETÁRIO DO CARRINHO
// ==========================================

async function resolveOwner(request: Request) {
  const authorization = request.headers.get('Authorization')

  // Visitantes possuem carrinho independente.
  if (!authorization) {
    return { owner: 'guest' }
  }

  // Usuários autenticados possuem carrinhos individuais.
  const auth = await requireAuth(request)

  if (!auth.authorized) {
    return { response: auth.response }
  }

  return {
    owner: `user:${auth.userId}`,
  }
}

// ==========================================
// CALCULAR CARRINHO E DETECTAR ALTERAÇÕES
// ==========================================

function buildCart(owner: string): CartResponse {
  const storedItems = getCartItems(owner)

  let subtotal = new Decimal(0)

  const items: CartLine[] = storedItems.map((item) => {
    const nft = getNftById(item.nftId)

    const edition = nft?.editions.find(
      (value) => value.id === item.editionId
    )

    // Preço e estoque atuais do NFT.
    const unitPrice = edition?.priceEth ?? '0'
    const available = edition?.availableQuantity ?? 0

    // Preço registrado quando o item foi adicionado.
    // Carrinhos antigos podem não ter essa informação.
    const originalPrice = item.unitPriceAtAddEth ?? null

    // Detectar alterações no preço.
    const priceChanged =
      edition !== undefined &&
      originalPrice !== null &&
      new Decimal(originalPrice).comparedTo(unitPrice) !== 0

    // Calcular total da linha usando o preço atual.
    const lineTotal = new Decimal(unitPrice)
      .mul(item.quantity)

    if (edition) {
      subtotal = subtotal.plus(lineTotal)
    }

    // Identificar disponibilidade.
    const status: CartLine['status'] =
      !nft || !edition
        ? 'unavailable'
        : available === 0
          ? 'unavailable'
          : item.quantity > available
            ? 'insufficient_stock'
            : 'available'

    return {
      nftId: item.nftId,
      editionId: item.editionId,

      nftName: nft?.name ?? 'NFT indisponível',
      editionName: edition?.name ?? 'Edição indisponível',

      imageUrl: nft?.coverImageUrl ?? '',

      quantity: item.quantity,

      // Preço atual.
      unitPriceEth: unitPrice,

      // Preço original.
      originalUnitPriceEth: originalPrice,

      // Indica se o preço mudou.
      priceChanged,

      // Subtotal da linha.
      lineTotalEth: lineTotal.toString(),

      // Estoque atual.
      availableQuantity: available,

      // Versão atual da edição.
      version: edition?.version ?? 0,

      status,
    }
  })

  return {
    items,

    itemCount: items.reduce(
      (total, item) => total + item.quantity,
      0
    ),

    subtotalEth: subtotal.toString(),
  }
}

// ==========================================
// VALIDAR ESTOQUE
// ==========================================

function validateStock(
  nftId: string,
  editionId: string,
  quantity: number
): Response | null {
  const nft = getNftById(nftId)

  if (!nft) {
    return errorResponse(
      404,
      'NFT_NOT_FOUND',
      'NFT não encontrado.'
    )
  }

  const edition = nft.editions.find(
    (item) => item.id === editionId
  )

  if (!edition) {
    return errorResponse(
      404,
      'EDITION_NOT_FOUND',
      'Edição não encontrada.'
    )
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 1000
  ) {
    return errorResponse(
      422,
      'INVALID_QUANTITY',
      'Quantidade inválida.'
    )
  }

  if (quantity > edition.availableQuantity) {
    return errorResponse(
      409,
      'INSUFFICIENT_STOCK',
      'Quantidade superior ao estoque disponível.'
    )
  }

  return null
}

// ==========================================
// HANDLERS REST DO CARRINHO
// ==========================================

export const cartHandlers = [

  // ========================================
  // GET /api/cart
  // ========================================

  http.get('/api/cart', async ({ request }) => {
    const context = await resolveOwner(request)

    if (context.response) {
      return context.response
    }

    return HttpResponse.json(
      buildCart(context.owner!)
    )
  }),

  // ========================================
  // POST /api/cart/items
  // ========================================

  http.post('/api/cart/items', async ({ request }) => {
    const context = await resolveOwner(request)

    if (context.response) {
      return context.response
    }

    const body = await request.json().catch(() => null)

    const parsed = addCartItemSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        422,
        'VALIDATION_ERROR',
        'Item do carrinho inválido.'
      )
    }

    const owner = context.owner!
    const input = parsed.data

    const items = getCartItems(owner)

    const existing = items.find(
      (item) =>
        item.nftId === input.nftId &&
        item.editionId === input.editionId
    )

    const newQuantity =
      (existing?.quantity ?? 0) + input.quantity

    const stockError = validateStock(
      input.nftId,
      input.editionId,
      newQuantity
    )

    if (stockError) {
      return stockError
    }

    // NFT e edição já foram validados.
    const nft = getNftById(input.nftId)!

    const edition = nft.editions.find(
      (item) => item.id === input.editionId
    )!

    if (existing) {
      // Somar quantidade mantendo o preço original.
      existing.quantity = newQuantity

      // Compatibilidade com carrinhos antigos.
      if (existing.unitPriceAtAddEth === undefined) {
        existing.unitPriceAtAddEth = edition.priceEth
      }
    } else {
      // Salvar preço no momento da inclusão.
      items.push({
        ...input,
        unitPriceAtAddEth: edition.priceEth,
      })
    }

    saveCartItems(owner, items)

    return HttpResponse.json(
      buildCart(owner),
      { status: 201 }
    )
  }),

  // ========================================
  // PATCH /api/cart/items/:nftId/:editionId
  // ========================================

  http.patch(
    '/api/cart/items/:nftId/:editionId',
    async ({ request, params }) => {
      const context = await resolveOwner(request)

      if (context.response) {
        return context.response
      }

      const body = await request.json().catch(() => null)

      const parsed = updateCartItemSchema.safeParse(body)

      if (!parsed.success) {
        return errorResponse(
          422,
          'VALIDATION_ERROR',
          'Quantidade inválida.'
        )
      }

      const owner = context.owner!

      const nftId = String(params.nftId)
      const editionId = String(params.editionId)

      const items = getCartItems(owner)

      const item = items.find(
        (value) =>
          value.nftId === nftId &&
          value.editionId === editionId
      )

      if (!item) {
        return errorResponse(
          404,
          'CART_ITEM_NOT_FOUND',
          'Item não encontrado no carrinho.'
        )
      }

      const stockError = validateStock(
        nftId,
        editionId,
        parsed.data.quantity
      )

      if (stockError) {
        return stockError
      }

      // Atualizar quantidade sem alterar o preço original.
      item.quantity = parsed.data.quantity

      saveCartItems(owner, items)

      return HttpResponse.json(
        buildCart(owner)
      )
    }
  ),

  // ========================================
  // DELETE /api/cart/items/:nftId/:editionId
  // ========================================

  http.delete(
    '/api/cart/items/:nftId/:editionId',
    async ({ request, params }) => {
      const context = await resolveOwner(request)

      if (context.response) {
        return context.response
      }

      const owner = context.owner!

      const items = getCartItems(owner)

      const filtered: StoredCartItem[] = items.filter(
        (item) =>
          !(
            item.nftId === String(params.nftId) &&
            item.editionId === String(params.editionId)
      )
      )

      saveCartItems(owner, filtered)

      return HttpResponse.json(
        buildCart(owner)
      )
    }
  ),

  // ========================================
  // POST /api/cart/merge
  // ========================================

  http.post('/api/cart/merge', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    const owner = `user:${auth.userId}`

    const guestItems = getCartItems('guest')
    const userItems = getCartItems(owner)

    // Trabalhar com uma cópia para preservar
    // os carrinhos em caso de erro.
    const mergedItems = structuredClone(userItems)

    for (const guestItem of guestItems) {
      const existing = mergedItems.find(
        (item) =>
          item.nftId === guestItem.nftId &&
          item.editionId === guestItem.editionId
      )

      const quantity =
        (existing?.quantity ?? 0) + guestItem.quantity

      const stockError = validateStock(
        guestItem.nftId,
        guestItem.editionId,
        quantity
      )

      if (stockError) {
        // Não persistir nenhuma alteração em caso de erro.
        return stockError
      }

      if (existing) {
        // Somar as quantidades sem alterar o preço
        // original do carrinho autenticado.
        existing.quantity = quantity

        if (existing.unitPriceAtAddEth === undefined) {
          existing.unitPriceAtAddEth =
            guestItem.unitPriceAtAddEth
        }
      } else {
        // Preservar o preço registrado pelo visitante.
        mergedItems.push({
          ...guestItem,
        })
      }
    }

    // Persistir carrinho mesclado e limpar o visitante.
    commitCartMerge(owner, mergedItems)

    return HttpResponse.json({
      ...buildCart(owner),
      mergedGuestLines: guestItems.length,
    })
  }),
]
