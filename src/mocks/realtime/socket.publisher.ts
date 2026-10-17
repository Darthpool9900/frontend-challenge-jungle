import type { NftDetail, NftEdition } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/realtime/socket.contracts'

export type PublishedEvent =
  | { name: 'nft.updated'; data: NftUpdatedEvent }
  | { name: 'order.updated'; data: OrderUpdatedEvent }
type Subscriber = { send: (event: PublishedEvent) => void; close: () => void }
const subscribers = new Set<Subscriber>()
const history: PublishedEvent[] = []
export function subscribe(subscriber: Subscriber) {
  subscribers.add(subscriber)
  return () => { subscribers.delete(subscriber) }
  }
export function publish(event: PublishedEvent, remember = true) {
  if (remember) {
    history.push(structuredClone(event))
    if (history.length > 100) history.shift()
  }
  for (const subscriber of subscribers) subscriber.send(event)
}
export function publishNft(nft: NftDetail, edition: NftEdition) {
  publish({ name: 'nft.updated', data: {
      eventId: crypto.randomUUID(), nftId: nft.id, editionId: edition.id,
      version: nft.version, priceEth: edition.priceEth,
      availableQuantity: edition.availableQuantity, occurredAt: new Date().toISOString(),
    } })
}
export function publishOrder(order: Order) {
  publish({ name: 'order.updated', data: {
      eventId: crypto.randomUUID(), orderId: order.id, userId: order.userId,
      version: order.version, status: order.status, occurredAt: order.updatedAt,
    } })
}
export const socketScenarios = {
  rejectConnections: false,
  connections: () => subscribers.size,
  disconnect: () => { for (const subscriber of subscribers) subscriber.close() },
  reset: () => { history.length = 0 },
  replay(name: PublishedEvent['name'], stale: boolean) {
    const last = history.findLast(event => event.name === name)
    if (!last) return false
    const event = structuredClone(last)
    if (stale) {
      event.data.eventId = crypto.randomUUID()
      event.data.version = Math.max(1, event.data.version - 1)
      if (event.name === 'order.updated') event.data.status = 'pending'
    }
    publish(event, false)
    return true
  },
}
