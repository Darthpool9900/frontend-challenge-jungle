
import { http, HttpResponse } from 'msw'

import {
  createWalletSchema,
  updateWalletSchema,
} from '@/contracts/wallet'

import type {
  Wallet,
  WalletListResponse,
  WalletMutationResponse,
} from '@/contracts/wallet'

import { requireAuth } from '../domain/auth.guard'

import {
  getWallets,
  saveWallets,
} from '../storage/wallet.store'

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

export const walletHandlers = [

  // ========================================
  // GET /api/wallets
  // ========================================

  http.get('/api/wallets', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    const response: WalletListResponse = {
      wallets: getWallets(auth.userId),
    }

    return HttpResponse.json(response)
  }),

  // ========================================
  // POST /api/wallets
  // ========================================

  http.post('/api/wallets', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json().catch(() => null)
    const parsed = createWalletSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        422,
        'VALIDATION_ERROR',
        'Dados da carteira inválidos.'
      )
    }

    const input = parsed.data
    const wallets = getWallets(auth.userId)

    // Uma carteira por tipo.
    const occupied = wallets.some(
      wallet => wallet.kind === input.kind
    )

    if (occupied) {
      return errorResponse(
        409,
        'WALLET_SLOT_OCCUPIED',
        'Já existe uma carteira desse tipo.'
      )
    }

    // Evitar cadastrar a mesma carteira
    // duas vezes na mesma rede.
    const duplicated = wallets.some(
      wallet =>
        wallet.address.toLowerCase() ===
          input.address.toLowerCase() &&
        wallet.network === input.network
    )

    if (duplicated) {
      return errorResponse(
        409,
        'WALLET_ALREADY_EXISTS',
        'Esta carteira já está cadastrada.'
      )
    }

    const now = new Date().toISOString()

    const wallet: Wallet = {
      id: crypto.randomUUID(),
      label: input.label,
      address: input.address,
      network: input.network,
      kind: input.kind,
      createdAt: now,
      updatedAt: now,
    }

    wallets.push(wallet)
    saveWallets(auth.userId, wallets)

    const response: WalletMutationResponse = {
      wallet,
    }

    return HttpResponse.json(
      response,
      { status: 201 }
    )
  }),

  // ========================================
  // PATCH /api/wallets/:walletId
  // ========================================

  http.patch(
    '/api/wallets/:walletId',
    async ({ request, params }) => {
      const auth = await requireAuth(request)

      if (!auth.authorized) {
        return auth.response
      }

      const body = await request.json().catch(() => null)
      const parsed = updateWalletSchema.safeParse(body)

      if (!parsed.success) {
        return errorResponse(
          422,
          'VALIDATION_ERROR',
          'Dados de atualização inválidos.'
        )
      }

      const wallets = getWallets(auth.userId)

      const wallet = wallets.find(
        item => item.id === String(params.walletId)
      )

      if (!wallet) {
        return errorResponse(
          404,
          'WALLET_NOT_FOUND',
          'Carteira não encontrada.'
        )
      }

      const input = parsed.data

      const nextAddress = input.address ?? wallet.address
      const nextNetwork = input.network ?? wallet.network

      // Não permitir duplicação de endereço
      // na mesma rede.
      const duplicated = wallets.some(
        item =>
          item.id !== wallet.id &&
          item.address.toLowerCase() ===
            nextAddress.toLowerCase() &&
          item.network === nextNetwork
      )

      if (duplicated) {
        return errorResponse(
          409,
          'WALLET_ALREADY_EXISTS',
          'Esta carteira já está cadastrada.'
        )
      }

      const now = new Date().toISOString()

      // Se trocar principal por secundária
      // ou vice-versa, trocar os papéis.
      if (input.kind && input.kind !== wallet.kind) {
        const previousKind = wallet.kind

        const occupied = wallets.find(
          item =>
            item.id !== wallet.id &&
            item.kind === input.kind
        )

        if (occupied) {
          occupied.kind = previousKind
          occupied.updatedAt = now
        }
      }

      Object.assign(wallet, input)
      wallet.updatedAt = now

      saveWallets(auth.userId, wallets)

      const response: WalletMutationResponse = {
        wallet,
      }

      return HttpResponse.json(response)
    }
  ),
]
