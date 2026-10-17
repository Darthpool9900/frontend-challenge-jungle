
import type { AuthUser } from '@/contracts/auth'

export interface StoredUser extends AuthUser {
  passwordHash: string
  salt: string
}

export interface StoredSession {
  accessToken: string
  userId: string
  expiresAt: string
}

export interface AuthDatabase {
  users: StoredUser[]
  sessions: StoredSession[]
}

const STORAGE_KEY = 'jungle.auth.db.v1'

let databasePromise: Promise<AuthDatabase> | null = null

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}


function fromHex(hex: string): ArrayBuffer {
  const buffer = new ArrayBuffer(hex.length / 2)
  const bytes = new Uint8Array(buffer)

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return buffer
}


export function createSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return toHex(bytes)
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromHex(salt),
      iterations: 100_000,
    },
    key,
    256
  )

  return toHex(new Uint8Array(hash))
}

export function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    username: user.username,
    gender: user.gender,
    bio: user.bio,
  }
}

async function createInitialDatabase(): Promise<AuthDatabase> {
  const fixtures = [
    {
      id: 'user-001',
      name: 'Ana Silva',
      email: 'ana@jungle.test',
    },
    {
      id: 'user-002',
      name: 'Lucas Costa',
      email: 'lucas@jungle.test',
    },
  ]

  const users: StoredUser[] = await Promise.all(
    fixtures.map(async (fixture) => {
      const salt = createSalt()

      return {
        ...fixture,
        avatarUrl: null,
        salt,
        passwordHash: await hashPassword('Demo@12345', salt),
      }
    })
  )

  return { users, sessions: [] }
}

export async function getAuthDatabase(): Promise<AuthDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        try {
          const parsed: AuthDatabase = JSON.parse(saved)

          if (
            Array.isArray(parsed.users) &&
            Array.isArray(parsed.sessions)
          ) {
            return parsed
          }
        } catch {
          // Dados inválidos: recriar cenário inicial.
        }
      }

      const database = await createInitialDatabase()
      saveAuthDatabase(database)
      return database
    })()
  }

  return databasePromise
}

export function saveAuthDatabase(database: AuthDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
}

export function resetAuthDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('jungle.auth.token')
  databasePromise = null
}
