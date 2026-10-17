
import { HttpResponse } from 'msw'

import type { AuthUser } from '@/contracts/auth'

import {
  getAuthDatabase,
  saveAuthDatabase,
  toPublicUser,
} from '../storage/auth.store'

type AuthResult =
  | {
      authorized: true
      userId: string
      user: AuthUser
      expiresAt: string
    }
  | {
      authorized: false
      response: Response
    }

function unauthorized(code: string, message: string): AuthResult {
  return {
    authorized: false,
    response: HttpResponse.json(
      {
        error: { code, message },
      },
      { status: 401 }
    ),
  }
}

export async function requireAuth(
  request: Request
): Promise<AuthResult> {
  const header = request.headers.get('Authorization')

  const token = header?.startsWith('Bearer ')
    ? header.slice(7).trim()
    : null

  if (!token) {
    return unauthorized(
      'UNAUTHORIZED',
      'Autenticação necessária.'
    )
  }

  const db = await getAuthDatabase()

  const session = db.sessions.find(
    (item) => item.accessToken === token
  )

  if (!session) {
    return unauthorized(
      'INVALID_SESSION',
      'Sessão inválida.'
    )
  }

  const expiration = Date.parse(session.expiresAt)

  if (
    !Number.isFinite(expiration) ||
    expiration <= Date.now()
  ) {
    db.sessions = db.sessions.filter(
      (item) => item.accessToken !== token
    )

    saveAuthDatabase(db)

    return unauthorized(
      'SESSION_EXPIRED',
      'Sua sessão expirou.'
    )
  }

  const user = db.users.find(
    (item) => item.id === session.userId
  )

  if (!user) {
    return unauthorized(
      'USER_NOT_FOUND',
      'Usuário não encontrado.'
    )
  }

  return {
    authorized: true,
    userId: user.id,
    user: toPublicUser(user),
    expiresAt: session.expiresAt,
  }
}
