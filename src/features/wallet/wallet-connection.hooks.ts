
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useAuthSession } from '@/features/auth/auth.hooks'

import { walletConnectionService } from '@/services/wallet-connection.service'

import type {
  ConnectWalletInput,
} from '@/contracts/wallet-connection'

import type {
  WalletNetwork,
} from '@/contracts/wallet'

import {
  walletConnectionKeys,
  walletConnectionQueryOptions,
} from './wallet-connection.queries'

// ========================================
// CONSULTAR CONEXÃO ATUAL
// ========================================

export function useWalletConnection() {
  const session = useAuthSession()
  const userId = session.data?.user.id

  return useQuery({
    ...walletConnectionQueryOptions(userId ?? 'pending'),
    enabled: Boolean(userId),
  })
}

// ========================================
// CONECTAR CARTEIRA
// ========================================

export function useConnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ConnectWalletInput) =>
      walletConnectionService.connect(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletConnectionKeys.all,
      })
    },
  })
}

// ========================================
// TROCAR REDE
// ========================================

export function useSwitchWalletNetwork() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (network: WalletNetwork) =>
      walletConnectionService.switchNetwork(network),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletConnectionKeys.all,
      })
    },
  })
}

// ========================================
// DESCONECTAR CARTEIRA
// ========================================

export function useDisconnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      walletConnectionService.disconnect(),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletConnectionKeys.all,
      })
    },
  })
}

// ========================================
// INVALIDAR CACHE MANUALMENTE
// ========================================

export function useInvalidateWalletConnection() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: walletConnectionKeys.all,
    })
}
