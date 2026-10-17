import { stopRealtime } from '@/realtime/socket.lifecycle'
import { publishAuthTokenChange } from '@/features/auth/auth-token.store'

import axios from 'axios'

import { api, AUTH_TOKEN_KEY } from '@/api/client'

import { cartService } from '@/services/cart.service'

import type {
  LoginInput,
  RegisterInput,
  AuthResponse,
  SessionResponse,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@/contracts/auth'

// Salvar token da sessão
function saveToken(token: string): void {
  stopRealtime()
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  publishAuthTokenChange()
}

// Remover token da sessão
function clearToken(): void {
  stopRealtime()
  localStorage.removeItem(AUTH_TOKEN_KEY)
  publishAuthTokenChange()
}

// Finalizar autenticação e mesclar carrinho visitante
async function completeAuthentication(
  response: AuthResponse
): Promise<void> {
  // Salvar o token antes de acessar endpoints protegidos
  saveToken(response.accessToken)

  try {
    // Transferir os itens do visitante para o usuário
    await cartService.mergeGuest()
  } catch (error) {
    // O login continua válido mesmo se a mesclagem falhar.
    // O carrinho visitante será preservado.
    console.warn(
      'Autenticação realizada, mas não foi possível mesclar o carrinho:',
      error
    )
  }
}

export const authService = {
  async updateProfile(input: UpdateProfileInput) {
    const {data} = await api.patch<{user: import('@/contracts/auth').AuthUser}>('/auth/profile',input)
    return data.user
  },
  async changePassword(input: ChangePasswordInput) {
    await api.post('/auth/change-password', input)
  },

  // Cadastro de novo usuário
  async register(
    input: RegisterInput
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/register',
      input
    )

    // Salvar sessão e mesclar carrinho visitante
    await completeAuthentication(data)

    return data
  },

  // Login de usuário existente
  async login(
    input: LoginInput
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/login',
      input
    )

    // Salvar sessão e mesclar carrinho visitante
    await completeAuthentication(data)

    return data
  },

  // Recuperar sessão autenticada
  async getSession(): Promise<SessionResponse> {
    try {
      const { data } = await api.get<SessionResponse>(
        '/auth/session'
      )

      return data
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        // Sessão inválida ou expirada
        clearToken()
      }

      throw error
    }
  },

  // Encerrar sessão
  async logout(): Promise<void> {
    stopRealtime()
    try {
      await api.post('/auth/logout')
    } finally {
      // Remove o token mesmo se a requisição falhar
      clearToken()
    }
  },
}
