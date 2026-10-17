
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { AUTH_TOKEN_KEY } from '@/api/client'

import { useAuthSession } from '@/features/auth/auth.hooks'

import { quoteService } from '@/services/quote.service'

import type {
  QuoteRequest,
  QuoteResponse,
} from '@/contracts/quote'

import type {
  WalletNetwork,
} from '@/contracts/wallet'

import {
  quoteKeys,
  quoteQueryOptions,
} from './quote.queries'

// ========================================
// IDENTIFICAR PROPRIETÁRIO DO CACHE
// ========================================

function useQuoteOwner() {
  const session = useAuthSession()

  const hasToken = Boolean(
    localStorage.getItem(AUTH_TOKEN_KEY)
  )

  if (!hasToken) {
    return 'guest'
  }

  if (!session.data?.user.id) {
    return 'pending'
  }

  return `user:${session.data.user.id}`
}

// ========================================
// CONSULTAR COTAÇÃO EXISTENTE
// ========================================

export function useQuote(
  quoteId: string | null
) {
  const owner = useQuoteOwner()

  return useQuery({
    ...quoteQueryOptions(owner, quoteId ?? ''),

    enabled:
      owner !== 'pending' &&
      Boolean(quoteId),
  })
}

// ========================================
// CRIAR COTAÇÃO
// ========================================

export function useCreateQuote() {
  const queryClient = useQueryClient()
  const owner = useQuoteOwner()

  return useMutation({
    mutationFn: (input: QuoteRequest) =>
      quoteService.create(input),

    onSuccess: (quote: QuoteResponse) => {
      if (owner === 'pending') return

      queryClient.setQueryData(
        quoteKeys.detail(owner, quote.quoteId),
        quote
      )
    },
  })
}

// ========================================
// APLICAR CUPOM
// ========================================

interface ApplyCouponInput {
  couponCode: string
  network: WalletNetwork
}

export function useApplyQuoteCoupon() {
  const queryClient = useQueryClient()
  const owner = useQuoteOwner()

  return useMutation({
    mutationFn: ({
      couponCode,
      network,
    }: ApplyCouponInput) =>
      quoteService.applyCoupon(couponCode, network),

    onSuccess: (quote: QuoteResponse) => {
      if (owner === 'pending') return

      queryClient.setQueryData(
        quoteKeys.detail(owner, quote.quoteId),
        quote
      )
    },
  })
}

// ========================================
// ATUALIZAR CACHE DE COTAÇÕES
// ========================================

export function useInvalidateQuotes() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: quoteKeys.all,
    })
}
