
import { http, HttpResponse } from 'msw'
import type { ZodIssue } from 'zod'

import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '@/contracts/auth'

import {
  createSalt,
  getAuthDatabase,
  hashPassword,
  saveAuthDatabase,
  toPublicUser,
} from '../storage/auth.store'

import { requireAuth } from '../domain/auth.guard'
import { disconnectWallet } from '../storage/wallet-connection.store'

const SESSION_DURATION = 60 * 60 * 1000

function apiError(
  status: number,
  code: string,
  message: string
) {
  return HttpResponse.json(
    { error: { code, message } },
    { status }
  )
}

function validationError(issues: ZodIssue[]) {
  const fieldErrors: Record<string, string> = {}

  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form')

    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Verifique os campos informados.',
        fieldErrors,
      },
    },
    { status: 422 }
  )
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice(7)
}

function createSession(userId: string) {
  return {
    accessToken: crypto.randomUUID(),
    userId,
    expiresAt: new Date(
      Date.now() + SESSION_DURATION
    ).toISOString(),
  }
}

export const authHandlers = [
  // POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json().catch(() => null)
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues)
    }

    const db = await getAuthDatabase()
    const email = result.data.email.trim().toLowerCase()

    const exists = db.users.some(
      (user) => user.email.toLowerCase() === email
    )

    if (exists) {
      return apiError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Este e-mail já está cadastrado.'
      )
    }

    const salt = createSalt()

    const user = {
      id: crypto.randomUUID(),
      name: result.data.name.trim(),
      email,
      avatarUrl: null,
      salt,
      passwordHash: await hashPassword(
        result.data.password,
        salt
      ),
    }

    db.users.push(user)

    const session = createSession(user.id)
    db.sessions.push(session)

    saveAuthDatabase(db)

    return HttpResponse.json(
      {
        user: toPublicUser(user),
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
      },
      { status: 201 }
    )
  }),

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => null)
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues)
    }

    const db = await getAuthDatabase()

    const email = result.data.email.trim().toLowerCase()

    const user = db.users.find(
      (item) => item.email.toLowerCase() === email
    )

    if (!user) {
      return apiError(
        401,
        'INVALID_CREDENTIALS',
        'E-mail ou senha incorretos.'
      )
    }

    const passwordHash = await hashPassword(
      result.data.password,
      user.salt
    )

    if (passwordHash !== user.passwordHash) {
      return apiError(
        401,
        'INVALID_CREDENTIALS',
        'E-mail ou senha incorretos.'
      )
    }

    const session = createSession(user.id)

    db.sessions.push(session)
    saveAuthDatabase(db)

    return HttpResponse.json({
      user: toPublicUser(user),
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    })
  }),

  // GET /api/auth/session

  http.get('/api/auth/session', async ({ request }) => {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.response
    }

    return HttpResponse.json({
      user: auth.user,
      expiresAt: auth.expiresAt,
    })
  }),


  // POST /api/auth/logout

  http.post('/api/auth/logout', async ({ request }) => {
    const token = getBearerToken(request)

    const db = await getAuthDatabase()

    const session = db.sessions.find(
      item => item.accessToken === token
    )

    if (session) {
      disconnectWallet(session.userId)
    }

    db.sessions = db.sessions.filter(
      item => item.accessToken !== token
    )

    saveAuthDatabase(db)

    return new HttpResponse(null, { status: 204 })
  }),

  // PATCH /api/auth/profile
  http.patch('/api/auth/profile', async ({request}) => {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.response
    const body = await request.json().catch(() => null)
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)
    const db = await getAuthDatabase()
    const current = db.users.find(user=>user.id===auth.userId)
    if (!current) return apiError(404,'USER_NOT_FOUND','Usuário não encontrado.')
    const email = parsed.data.email.toLowerCase()
    if (db.users.some(user=>user.id!==current.id && user.email===email))
      return apiError(409,'EMAIL_ALREADY_EXISTS','E-mail já utilizado por outro usuário.')
    current.name = parsed.data.name
    current.email = email
    if (parsed.data.username !== undefined) current.username = parsed.data.username
    if (parsed.data.gender !== undefined) current.gender = parsed.data.gender
    if (parsed.data.bio !== undefined) current.bio = parsed.data.bio
    if (parsed.data.avatarUrl !== undefined) current.avatarUrl = parsed.data.avatarUrl
    saveAuthDatabase(db)
    return HttpResponse.json({user:toPublicUser(current)})
  }),
  // POST /api/auth/change-password
  http.post('/api/auth/change-password', async ({request}) => {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.response
    const body = await request.json().catch(() => null)
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)
    const db = await getAuthDatabase()
    const user = db.users.find(user=>user.id===auth.userId)
    if (!user) return apiError(404,'USER_NOT_FOUND','Usuário não encontrado.')
    if (await hashPassword(parsed.data.currentPassword,user.salt)!==user.passwordHash)
      return apiError(401,'INVALID_PASSWORD','A senha atual está incorreta.')
    user.salt = createSalt()
    user.passwordHash = await hashPassword(parsed.data.newPassword,user.salt)
    saveAuthDatabase(db)
    return HttpResponse.json({changed:true})
  }),
]
