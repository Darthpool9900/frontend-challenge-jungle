
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { cartService } from '@/services/cart.service'
import { useAuthSession } from '@/features/auth/auth.hooks'
import { AUTH_TOKEN_KEY } from '@/api/client'
import type { AddCartItemInput } from '@/contracts/cart'

import {
  cartKeys,
  cartQueryOptions,
} from './cart.queries'

interface CartItemIdentifier {
  nftId: string
  editionId: string
}

interface UpdateCartItemInput extends CartItemIdentifier {
  quantity: number
}

// Consultar carrinho
export function useCart() {
  const session = useAuthSession()

  const hasToken = Boolean(
    localStorage.getItem(AUTH_TOKEN_KEY)
  )

  // Aguarda a validação da sessão antes de
  // buscar o carrinho de um usuário autenticado.
  const owner = !hasToken
    ? 'guest'
    : session.data?.user.id
      ? `user:${session.data.user.id}`
      : 'pending'

  return useQuery({
    ...cartQueryOptions(owner),
    enabled: owner !== 'pending',
  })
}

// Adicionar item
export function useAddCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddCartItemInput) =>
      cartService.add(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      })
    },
  })
}

// Atualizar quantidade
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCartItemInput) =>
      cartService.update(
        input.nftId,
        input.editionId,
        input.quantity
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      })
    },
  })
}

// Remover item
export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CartItemIdentifier) =>
      cartService.remove(
        input.nftId,
        input.editionId
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cartKeys.all,
      })
    },
  })
}

// Atualização manual do carrinho
export function useInvalidateCart() {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({
      queryKey: cartKeys.all,
    })
}
