
import { z } from 'zod'

// Validação de login
export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

// Validação de cadastro
export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),

  email: z.email('E-mail inválido'),

  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa'),
})

// Dados públicos do usuário
export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  username?: string
  gender?: string
  bio?: string
}

// Resposta de login/cadastro
export interface AuthResponse {
  user: AuthUser
  accessToken: string
  expiresAt: string
}

// Resposta da consulta de sessão
export interface SessionResponse {
  user: AuthUser
  expiresAt: string
}

// Erros padronizados da API
export interface AuthApiError {
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string>
  }
}

// Tipos derivados do Zod
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// Edição do perfil do colecionador na demonstração.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  avatarUrl: z.union([z.string().max(1_500_000), z.null()]).optional(),
  username: z.string().trim().min(2).max(60).optional(),
  gender: z.string().max(40).optional(),
  bio: z.string().max(500).optional(),
})
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
