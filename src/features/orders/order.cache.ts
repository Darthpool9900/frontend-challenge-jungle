import type { QueryClient } from '@tanstack/react-query'
import type { OrderResponse, OrdersResponse } from '@/contracts/order'
import type { SessionResponse } from '@/contracts/auth'

export function shareOrder(previous: unknown, incoming: OrderResponse): OrderResponse {
  const old = previous as OrderResponse | undefined
  if (old?.order.id === incoming.order.id &&
    (old.order.version > incoming.order.version ||
      (old.order.status !== 'pending' && incoming.order.status === 'pending'))) return old
  return incoming
}
export function shareOrders(previous: unknown, incoming: OrdersResponse): OrdersResponse {
  const old = previous as OrdersResponse | undefined
  return { orders: incoming.orders.map(order => shareOrder(
    old?.orders.find(item => item.id === order.id) ? { order: old.orders.find(item => item.id === order.id)! } : undefined,
    { order },
  ).order) }
}
export function belongsToSession(client: QueryClient, response: OrderResponse) {
  return client.getQueryData<SessionResponse>(['auth', 'session'])?.user.id === response.order.userId
}
