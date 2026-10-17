import { belongsToSession, shareOrder } from './order.cache'

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import type {
  CreateOrderInput,
  OrderResponse,
} from '@/contracts/order'

import { useAuthSession } from '@/features/auth/auth.hooks'
import { orderRecoveryService } from '@/services/order-recovery.service'

import { orderKeys } from './order.queries'

// ========================================
// SINCRONIZAR RESULTADO COM REACT QUERY
// ========================================

async function syncResult(
  queryClient: QueryClient,
  response: OrderResponse | null
): Promise<void> {
  if (!response || !belongsToSession(queryClient, response)) return

  const { order } = response

  queryClient.setQueryData(
    orderKeys.detail(order.userId, order.id),
    (old: OrderResponse | undefined) => shareOrder(old, response)
  )

  queryClient.setQueryData(
    orderKeys.byKey(
      order.userId,
      order.idempotencyKey
    ),
    (old: OrderResponse | undefined) => shareOrder(old, response)
  )

  await queryClient.invalidateQueries({
    queryKey: orderKeys.list(order.userId),
  })

  if (order.status !== 'pending') {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['cart'],
      }),

      queryClient.invalidateQueries({
        queryKey: ['nfts'],
      }),

      queryClient.invalidateQueries({
        queryKey: ['quotes'],
      }),
    ])
  }
}

// ========================================
// CRIAR OU RETOMAR PAGAMENTO
// ========================================

export function useCheckoutOrder() {
  const session = useAuthSession()
  const queryClient = useQueryClient()

  const userId = session.data?.user.id

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!userId) {
        throw new Error(
          'É necessário estar autenticado.'
        )
      }

      return orderRecoveryService.start(
        userId,
        input
      )
    },

    onSuccess: async result => {
      await syncResult(queryClient, result)
    },
  })
}

// ========================================
// RECUPERAR PAGAMENTO APÓS REFRESH
// ========================================

export function useRecoverCheckout() {
  const session = useAuthSession()
  const queryClient = useQueryClient()

  const userId = session.data?.user.id

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error(
          'É necessário estar autenticado.'
        )
      }

      return orderRecoveryService.recover(userId)
    },

    onSuccess: async result => {
      await syncResult(queryClient, result)
    },
  })
}
