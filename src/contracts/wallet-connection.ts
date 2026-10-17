
import { z } from 'zod'

import {
  walletNetworkSchema,
  type WalletNetwork,
} from '@/contracts/wallet'

export const connectWalletSchema = z.object({
  walletId: z.string().min(1),
  network: walletNetworkSchema,
})

export const switchNetworkSchema = z.object({
  network: walletNetworkSchema,
})

export const connectionScenarioSchema = z.object({
  nextConnect: z.enum(['approve', 'reject']),
})

export type ConnectWalletInput = z.infer<
  typeof connectWalletSchema
>

export type ConnectionScenarioInput = z.infer<
  typeof connectionScenarioSchema
>

export interface WalletConnection {
  status: 'connected' | 'disconnected'
  walletId: string | null
  network: WalletNetwork | null
  connectedAt: string | null
}
