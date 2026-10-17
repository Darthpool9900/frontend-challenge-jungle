import { belongsToSession, shareOrder } from './order.cache'

import { useEffect, useRef } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  CreateOrderInput,
  Order,
} from '@/contracts/order'

import { useAuthSession } from '@/features/auth/auth.hooks'

import { orderService } from '@/services/order.service'

import {
  orderKeys,
  ordersQueryOptions,
  orderQueryOptions,
  orderByKeyQueryOptions,
} from './order.queries'

// ========================================
// INVALIDAR DADOS APÓS FINALIZAR PEDIDO
// ========================================

function useSyncSettledOrder(
  order: Order | undefined
) {
  const queryClient = useQueryClient()

  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!order || order.status === 'pending') {
      return
    }

    const signature = `${order.id}:${order.version}`

    if (handled.current === signature) {
      return
    }

    handled.current = signature

    // A confirmação pode ter alterado o
    // carrinho e o estoque dos NFTs.
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: orderKeys.list(order.userId),
      }),

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
  }, [order, queryClient])
}

// ========================================
// LISTAR PEDIDOS
// ========================================

export function useOrders() {
  const session = useAuthSession()
  const userId = session.data?.user.id

  return useQuery({
    ...ordersQueryOptions(userId ?? 'pending'),

    enabled: Boolean(userId),

    // Continuar consultando enquanto houver
    // algum pagamento pendente.
    refetchInterval: query => {
      const orders = query.state.data?.orders

      return orders?.some(
        order => order.status === 'pending'
      )
        ? 1500
        : false
    },
  })
}

// ========================================
// CONSULTAR PEDIDO POR ID
// ========================================

export function useOrder(
  orderId: string | null
) {
  const session = useAuthSession()
  const userId = session.data?.user.id

  const query = useQuery({
    ...orderQueryOptions(
      userId ?? 'pending',
      orderId ?? 'pending'
    ),

    enabled: Boolean(userId && orderId),

    refetchInterval: query => {
      return query.state.data?.order.status === 'pending'
        ? 1500
        : false
    },
  })

  useSyncSettledOrder(query.data?.order)

  return query
}

// ========================================
// RECUPERAR PEDIDO PELA CHAVE
// ========================================

export function useOrderByKey(
  idempotencyKey: string | null
) {
  const session = useAuthSession()
  const userId = session.data?.user.id

  const query = useQuery({
    ...orderByKeyQueryOptions(
      userId ?? 'pending',
      idempotencyKey ?? 'pending'
    ),

    enabled: Boolean(userId && idempotencyKey),

    refetchInterval: query => {
      return query.state.data?.order.status === 'pending'
        ? 1500
        : false
    },
  })

  useSyncSettledOrder(query.data?.order)

  return query
}

// ========================================
// CRIAR PEDIDO
// ========================================

interface CreateOrderMutationInput {
  input: CreateOrderInput
  idempotencyKey: string
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: CreateOrderMutationInput) =>
      orderService.create(input, idempotencyKey),

    onSuccess: async response => {
      if (!belongsToSession(queryClient, response)) return
      const order = response.order

      // Armazenar pedido no cache por ID.
      queryClient.setQueryData(
        orderKeys.detail(order.userId, order.id),
        (old: import('@/contracts/order').OrderResponse | undefined) => shareOrder(old, response)
      )

      // Armazenar também pela chave original.
      queryClient.setQueryData(
        orderKeys.byKey(
          order.userId,
          order.idempotencyKey
        ),
        (old: import('@/contracts/order').OrderResponse | undefined) => shareOrder(old, response)
      )

      // Atualizar o histórico.
      await queryClient.invalidateQueries({
        queryKey: orderKeys.list(order.userId),
      })
    },
  })
}

// ========================================
// INVALIDAÇÃO MANUAL
// ========================================

export function useInvalidateOrders() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: orderKeys.all,
    })
}
