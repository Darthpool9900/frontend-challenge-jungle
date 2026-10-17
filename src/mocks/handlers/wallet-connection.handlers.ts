
import { http, HttpResponse } from 'msw'

import {
  connectWalletSchema,
  switchNetworkSchema,
  connectionScenarioSchema,
} from '@/contracts/wallet-connection'

import type {
  WalletConnection,
} from '@/contracts/wallet-connection'

import { requireAuth } from '../domain/auth.guard'
import { getWallets } from '../storage/wallet.store'

import {
  getWalletConnection,
  saveWalletConnection,
  disconnectWallet,
  setConnectionScenario,
  consumeConnectionScenario,
} from '../storage/wallet-connection.store'

function apiError(
  status: number,
  code: string,
  message: string
): Response {
  return HttpResponse.json(
    { error: { code, message } },
    { status }
  )
}

export const walletConnectionHandlers = [

  // GET /api/wallet-connection
  http.get('/api/wallet-connection', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.response

    return HttpResponse.json(
      getWalletConnection(auth.userId)
    )
  }),

  // POST /api/wallet-connection/connect
  http.post(
    '/api/wallet-connection/connect',
    async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.response

    const body = await request.json().catch(() => null)
    const parsed = connectWalletSchema.safeParse(body)

    if (!parsed.success) {
        return apiError(
          422,
          'VALIDATION_ERROR',
          'Dados de conexão inválidos.'
        )
    }

    const { walletId, network } = parsed.data

      const wallet = getWallets(auth.userId).find(
        item => item.id === walletId
      )

    if (!wallet) {
        return apiError(
          404,
          'WALLET_NOT_FOUND',
          'Carteira não encontrada.'
        )
    }

    if (wallet.network !== network) {
      return apiError(
        409,
        'NETWORK_MISMATCH',
          'A rede selecionada não corresponde à carteira.'
      )
    }

    const outcome = consumeConnectionScenario(auth.userId)

    if (outcome === 'reject') {
      return apiError(
        403,
        'CONNECTION_REJECTED',
          'Conexão recusada pelo usuário.'
      )
    }

    const connection: WalletConnection = {
      status: 'connected',
      walletId: wallet.id,
      network,
      connectedAt: new Date().toISOString(),
    }

    saveWalletConnection(auth.userId, connection)

    return HttpResponse.json(connection)
    }
  ),

  // POST /api/wallet-connection/switch-network
  http.post(
    '/api/wallet-connection/switch-network',
    async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.response

    const body = await request.json().catch(() => null)
    const parsed = switchNetworkSchema.safeParse(body)

    if (!parsed.success) {
        return apiError(
          422,
          'INVALID_NETWORK',
          'Rede inválida.'
        )
    }

    const connection = getWalletConnection(auth.userId)

    if (connection.status !== 'connected') {
      return apiError(
        409,
        'WALLET_DISCONNECTED',
          'Conecte uma carteira antes de trocar de rede.'
      )
    }

    const updated: WalletConnection = {
      ...connection,
      network: parsed.data.network,
    }

    saveWalletConnection(auth.userId, updated)

    return HttpResponse.json(updated)
    }
  ),

  // POST /api/wallet-connection/disconnect
  http.post(
    '/api/wallet-connection/disconnect',
    async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.response

      return HttpResponse.json(
        disconnectWallet(auth.userId)
      )
    }
  ),

  // Cenário de teste: próxima conexão aprovada ou recusada.
  // Disponível somente com os mocks habilitados.
  http.post(
    '/api/__test/wallet-connection/scenario',
    async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.response

    const body = await request.json().catch(() => null)
    const parsed = connectionScenarioSchema.safeParse(body)

    if (!parsed.success) {
        return apiError(
          422,
          'VALIDATION_ERROR',
          'Cenário inválido.'
        )
    }

      setConnectionScenario(
        auth.userId,
        parsed.data.nextConnect
      )

    return HttpResponse.json({
      nextConnect: parsed.data.nextConnect,
    })
    }
  ),
]
