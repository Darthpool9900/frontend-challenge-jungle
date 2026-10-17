
import type {
  WalletConnection,
} from '@/contracts/wallet-connection'

type ConnectOutcome = 'approve' | 'reject'

interface ConnectionDatabase {
  connections: Record<string, WalletConnection>
  scenarios: Record<string, ConnectOutcome>
}

const STORAGE_KEY = 'jungle.wallet.connection.v1'

export function disconnectedState(): WalletConnection {
  return {
    status: 'disconnected',
    walletId: null,
    network: null,
    connectedAt: null,
  }
}

function readDatabase(): ConnectionDatabase {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return { connections: {}, scenarios: {} }
  }

  try {
    const parsed: unknown = JSON.parse(saved)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error('Invalid storage')
    }

    const db = parsed as Partial<ConnectionDatabase>

    return {
      connections: db.connections ?? {},
      scenarios: db.scenarios ?? {},
    }
  } catch {
    return { connections: {}, scenarios: {} }
  }
}

function saveDatabase(db: ConnectionDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function getWalletConnection(
  userId: string
): WalletConnection {
  const db = readDatabase()

  return structuredClone(
    db.connections[userId] ?? disconnectedState()
  )
}

export function saveWalletConnection(
  userId: string,
  connection: WalletConnection
): void {
  const db = readDatabase()

  db.connections[userId] = structuredClone(connection)

  saveDatabase(db)
}

export function disconnectWallet(
  userId: string
): WalletConnection {
  const state = disconnectedState()

  saveWalletConnection(userId, state)

  return state
}

export function setConnectionScenario(
  userId: string,
  outcome: ConnectOutcome
): void {
  const db = readDatabase()

  db.scenarios[userId] = outcome

  saveDatabase(db)
}

export function consumeConnectionScenario(
  userId: string
): ConnectOutcome {
  const db = readDatabase()

  const outcome = db.scenarios[userId] ?? 'approve'

  // A configuração vale somente para a próxima tentativa.
  db.scenarios[userId] = 'approve'

  saveDatabase(db)

  return outcome
}

export function resetConnectionDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}
