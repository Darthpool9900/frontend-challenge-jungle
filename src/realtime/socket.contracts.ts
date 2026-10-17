import { z } from 'zod'
import { ethAmountSchema } from '@/contracts/nft'

const base = z.object({
  eventId: z.string().min(1),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
})
export const nftUpdatedSchema = base.extend({
  nftId: z.string().min(1), editionId: z.string().min(1),
  priceEth: ethAmountSchema, availableQuantity: z.number().int().nonnegative(),
})
export const orderUpdatedSchema = base.extend({
  orderId: z.string().min(1), userId: z.string().min(1),
  status: z.enum(['pending', 'confirmed', 'declined']),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedSchema>
export interface ServerEvents {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
  'session.ready': () => void
  'session.error': () => void
}
export interface ClientEvents {
  'session.subscribe': (token: string | null) => void
}
