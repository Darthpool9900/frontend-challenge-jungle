import type { OrderResponse, OrdersResponse } from '@/contracts/order'
import { shareOrder, shareOrders } from './order.cache'

import { queryOptions } from '@tanstack/react-query'

import { orderService } from '@/services/order.service'

export const orderKeys = {
  all: ['orders'] as const,

  byUser: (userId: string) =>
    [...orderKeys.all, userId] as const,

  list: (userId: string) =>
    [...orderKeys.byUser(userId), 'list'] as const,

  detail: (userId: string, orderId: string) =>
    [
      ...orderKeys.byUser(userId),
      'detail',
      orderId,
    ] as const,

  byKey: (
    userId: string,
    idempotencyKey: string
  ) =>
    [
      ...orderKeys.byUser(userId),
      'idempotency',
      idempotencyKey,
    ] as const,
}

// ========================================
// LISTAR PEDIDOS
// ========================================

export function ordersQueryOptions(
  userId: string
) {
  return queryOptions({
    queryKey: orderKeys.list(userId),
    structuralSharing: (old, next) => shareOrders(old, next as OrdersResponse),
    queryFn: ({ signal }) => orderService.list(signal),
    staleTime: 0,
    retry: false,
  })
}

// ========================================
// CONSULTAR PEDIDO
// ========================================

export function orderQueryOptions(
  userId: string,
  orderId: string
) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    structuralSharing: (old, next) => shareOrder(old, next as OrderResponse),
    queryFn: ({ signal }) => orderService.getById(orderId, signal),
    staleTime: 0,
    retry: false,
  })
}

// ========================================
// RECUPERAR PEDIDO POR CHAVE
// ========================================

export function orderByKeyQueryOptions(
  userId: string,
  idempotencyKey: string
) {
  return queryOptions({
    queryKey: orderKeys.byKey(
      userId,
      idempotencyKey
    ),

    structuralSharing: (old, next) => shareOrder(old, next as OrderResponse),
    queryFn: ({ signal }) =>
      orderService.getByKey(idempotencyKey, signal),

    staleTime: 0,
    retry: false,
  })
}
