import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { NftDetailResponse, NftListResponse } from '@/contracts/nft'
import type { OrderResponse, OrdersResponse } from '@/contracts/order'
import { nftKeys } from '@/features/nfts/nft.queries'
import { orderKeys } from '@/features/orders/order.queries'
import { cartKeys } from '@/features/cart/cart.queries'
import { quoteKeys } from '@/features/checkout/quote.queries'
import { nftUpdatedSchema, orderUpdatedSchema } from './socket.contracts'

export function createSync(client: QueryClient, userId: string | null) {
  const owner = userId ? `user:${userId}` : 'guest'
  const versions = new Map<string, number>()
  const seen = new Set<string>()
  let active = true
  const refresh = async (keys: QueryKey[]) => {
    // Cancel even an initial fetch (invalidateQueries alone does not cancel it).
    await Promise.all(keys.map(queryKey => client.cancelQueries({ queryKey })))
    if (!active) return
    await Promise.all(keys.map(queryKey => client.invalidateQueries({ queryKey })))
  }
  const accept = (id: string, eventId: string, version: number, cached: number) => {
    if (!active || seen.has(eventId) || version <= Math.max(versions.get(id) ?? 0, cached)) return false
    versions.set(id, version)
    seen.add(eventId)
    if (seen.size > 1000) seen.delete(seen.values().next().value!)
    return true
  }
  const commerce = [cartKeys.byOwner(owner), quoteKeys.byOwner(owner)]
  return {
    dispose() { active = false },
    async nft(value: unknown) {
      const parsed = nftUpdatedSchema.safeParse(value)
      if (!parsed.success) return
      const event = parsed.data
      let cached = client.getQueryData<NftDetailResponse>(nftKeys.detail(event.nftId))?.nft.version ?? 0
      for (const [, data] of client.getQueriesData<NftListResponse>({ queryKey: nftKeys.lists() })) {
        cached = Math.max(cached, data?.items.find(item => item.id === event.nftId)?.version ?? 0)
      }
      // Equal REST version may already be visible in one cache but not cart/quote.
      if (!accept(`nft:${event.nftId}`, event.eventId, event.version, cached > event.version ? cached : 0)) return
      await refresh([nftKeys.lists(), nftKeys.detail(event.nftId), ...commerce])
    },
    async order(value: unknown) {
      const parsed = orderUpdatedSchema.safeParse(value)
      if (!parsed.success || parsed.data.userId !== userId) return
      const event = parsed.data
      const cachedOrders = client.getQueriesData<OrderResponse | OrdersResponse>({ queryKey: orderKeys.byUser(event.userId) })
        .flatMap(([, data]) => data ? ('order' in data ? [data.order] : data.orders) : [])
        .filter(order => order.id === event.orderId)
      if (event.status === 'pending' && cachedOrders.some(order => order.status !== 'pending')) return
      const version = Math.max(0, ...cachedOrders.map(order => order.version))
      if (!accept(`order:${event.orderId}`, event.eventId, event.version, version > event.version ? version : 0)) return
      await refresh([orderKeys.byUser(event.userId), ...commerce,
      ...(event.status === 'confirmed' ? [nftKeys.all] : [])])
    },
    reconnect: () => refresh([nftKeys.all, ...commerce, ...(userId ? [orderKeys.byUser(userId)] : [])]),
  }
}
