
import { z } from 'zod'

export const addCartItemSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1).max(1000),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(1000),
})

export type AddCartItemInput = z.infer<
  typeof addCartItemSchema
>

export type UpdateCartItemInput = z.infer<
  typeof updateCartItemSchema
>

export interface StoredCartItem {
  nftId: string
  editionId: string
  quantity: number
  unitPriceAtAddEth?: string
}

export interface CartLine {
  nftId: string
  editionId: string
  nftName: string
  editionName: string
  imageUrl: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
  availableQuantity: number
  version: number
  status: 'available' | 'insufficient_stock' | 'unavailable'
  originalUnitPriceEth: string | null
  priceChanged: boolean
}

export interface CartResponse {
  items: CartLine[]
  itemCount: number
  subtotalEth: string
}



export interface CartMergeResponse extends CartResponse {
  mergedGuestLines: number
}
