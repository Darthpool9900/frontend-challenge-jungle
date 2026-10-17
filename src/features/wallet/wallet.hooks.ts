
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { walletService } from '@/services/wallet.service'

import { useAuthSession } from '@/features/auth/auth.hooks'

import type {
  CreateWalletInput,
  UpdateWalletInput,
} from '@/contracts/wallet'

import {
  walletKeys,
  walletQueryOptions,
} from './wallet.queries'

interface UpdateWalletParams {
  walletId: string
  input: UpdateWalletInput
}

// ========================================
// CONSULTAR CARTEIRAS
// ========================================

export function useWallets() {
  const session = useAuthSession()

  const userId = session.data?.user.id

  return useQuery({
    ...walletQueryOptions(userId ?? 'pending'),

    // Só consultar após validar a sessão.
    enabled: Boolean(userId),
  })
}

// ========================================
// CONSULTAR CARTEIRA PRINCIPAL
// ========================================

export function usePrimaryWallet() {
  const session = useAuthSession()

  const userId = session.data?.user.id

  return useQuery({
    ...walletQueryOptions(userId ?? 'pending'),

    enabled: Boolean(userId),

    select: wallets =>
      wallets.find(
        wallet => wallet.kind === 'primary'
      ) ?? null,
  })
}

// ========================================
// CONSULTAR CARTEIRA SECUNDÁRIA
// ========================================

export function useSecondaryWallet() {
  const session = useAuthSession()

  const userId = session.data?.user.id

  return useQuery({
    ...walletQueryOptions(userId ?? 'pending'),

    enabled: Boolean(userId),

    select: wallets =>
      wallets.find(
        wallet => wallet.kind === 'secondary'
      ) ?? null,
  })
}

// ========================================
// CRIAR CARTEIRA
// ========================================

export function useCreateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWalletInput) =>
      walletService.create(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletKeys.all,
      })
    },
  })
}

// ========================================
// ATUALIZAR CARTEIRA
// ========================================

export function useUpdateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      walletId,
      input,
    }: UpdateWalletParams) =>
      walletService.update(walletId, input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletKeys.all,
      })
    },
  })
}

// ========================================
// DEFINIR CARTEIRA PRINCIPAL
// ========================================

export function useSetPrimaryWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (walletId: string) =>
      walletService.setPrimary(walletId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: walletKeys.all,
      })
    },
  })
}

// ========================================
// ATUALIZAR CACHE MANUALMENTE
// ========================================

export function useInvalidateWallets() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: walletKeys.all,
    })
}
