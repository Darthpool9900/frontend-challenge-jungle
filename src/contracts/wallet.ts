
import { z } from 'zod'

export const walletNetworkSchema = z.enum([
  'ethereum',
  'polygon',
  'base',
  'arbitrum',
])

export const walletKindSchema = z.enum([
  'primary',
  'secondary',
])

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Endereço de carteira inválido.'
  )

export const createWalletSchema = z.object({
  label: z.string()
    .trim()
    .min(2, 'Nome muito curto.')
    .max(60, 'Nome muito longo.'),

  address: walletAddressSchema,

  network: walletNetworkSchema,

  kind: walletKindSchema,
})

export const updateWalletSchema = createWalletSchema
  .partial()
  .refine(
    data => Object.keys(data).length > 0,
    'Informe pelo menos um campo.'
  )

export type WalletNetwork = z.infer<
  typeof walletNetworkSchema
>

export type WalletKind = z.infer<
  typeof walletKindSchema
>

export type CreateWalletInput = z.infer<
  typeof createWalletSchema
>

export type UpdateWalletInput = z.infer<
  typeof updateWalletSchema
>

export interface Wallet {
  id: string
  label: string
  address: string
  network: WalletNetwork
  kind: WalletKind
  createdAt: string
  updatedAt: string
}

export interface WalletListResponse {
  wallets: Wallet[]
}

export interface WalletMutationResponse {
  wallet: Wallet
}
