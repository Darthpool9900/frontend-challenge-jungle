
import { z } from 'zod'
import type { QuoteItem } from '@/contracts/quote'
import type { WalletNetwork } from '@/contracts/wallet'

export const createOrderSchema = z.object({
  quoteId: z.uuid(),
  walletId: z.uuid(),

  collector: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
  }),
})

export type CreateOrderInput = z.infer<
  typeof createOrderSchema
>

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'

export type OrderFailureCode =
  | 'PAYMENT_DECLINED'
  | 'STOCK_CHANGED'
  | 'QUOTE_STALE'
  | 'WALLET_DISCONNECTED'
  | null

export interface Order {
  id: string
  userId: string
  quoteId: string
  walletId: string
  idempotencyKey: string

  status: OrderStatus
  version: number

  collector: {
    name: string
    email: string
  }

  network: WalletNetwork
  currency: 'ETH'

  // Snapshot imutável da compra.
  items: QuoteItem[]

  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string

  // Preenchidos ao finalizar.
  transactionReference: string | null
  failureCode: OrderFailureCode

  createdAt: string
  updatedAt: string
  settledAt: string | null
}

export interface OrderResponse {
  order: Order
}

export interface OrdersResponse {
  orders: Order[]
}
