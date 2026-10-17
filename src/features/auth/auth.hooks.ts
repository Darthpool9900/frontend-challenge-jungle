
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useRouter } from '@tanstack/react-router'

import { authService } from '@/services/auth.service'
import { useAuthToken } from './auth-token.store'

import { sessionQueryOptions } from './auth.queries'

import type { AuthResponse, SessionResponse } from '@/contracts/auth'

// Consulta de sessão
export function useAuthSession() {
  const token = useAuthToken()
  return useQuery({
    ...sessionQueryOptions,
    enabled: Boolean(token),
  })
}

// Limpa dados anteriores e registra a nova sessão
export function useAuthCache() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return async (response: AuthResponse) => {
    await queryClient.cancelQueries()

    // Preserve the observed auth query so RealtimeConnection is notified
    // when the authenticated identity changes. Remove only private data.
    queryClient.removeQueries({
      predicate: query => query.queryKey[0] !== 'auth',
    })

    queryClient.setQueryData(sessionQueryOptions.queryKey, {
      user: response.user,
      expiresAt: response.expiresAt,
    })

    await router.invalidate()
  }
}

// Login
export function useLogin() {
  const updateSession = useAuthCache()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: updateSession,
  })
}

// Cadastro
export function useRegister() {
  const updateSession = useAuthCache()

  return useMutation({
    mutationFn: authService.register,
    onSuccess: updateSession,
  })
}

// Logout
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: authService.logout,

    onSettled: async () => {
      await queryClient.cancelQueries()

      // Remove todos os dados que podem pertencer
      // ao usuário autenticado anteriormente.
      queryClient.removeQueries({
        predicate: query => query.queryKey[0] !== 'auth',
      })
      queryClient.setQueryData<SessionResponse | null>(sessionQueryOptions.queryKey, null)

      await router.invalidate()
    },
  })
}
