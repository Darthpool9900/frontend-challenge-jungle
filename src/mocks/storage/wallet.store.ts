
import type { Wallet } from '@/contracts/wallet'

type WalletDatabase = Record<string, Wallet[]>

const STORAGE_KEY = 'jungle.wallets.db.v1'

function readDatabase(): WalletDatabase {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) return {}

  try {
    const parsed: unknown = JSON.parse(saved)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {}
    }

    const result: WalletDatabase = {}

    for (const [userId, wallets] of Object.entries(parsed)) {
      if (!Array.isArray(wallets)) continue

      result[userId] = wallets.filter(
        (wallet): wallet is Wallet =>
          wallet !== null &&
          typeof wallet === 'object' &&
          typeof wallet.id === 'string' &&
          typeof wallet.address === 'string' &&
          typeof wallet.label === 'string' &&
          typeof wallet.network === 'string' &&
          (
            wallet.kind === 'primary' ||
            wallet.kind === 'secondary'
      )
      )
    }

    return result
  } catch {
    return {}
  }
}

export function getWallets(userId: string): Wallet[] {
  const db = readDatabase()

  return structuredClone(db[userId] ?? [])
}

export function saveWallets(
  userId: string,
  wallets: Wallet[]
): void {
  const db = readDatabase()

  db[userId] = structuredClone(wallets)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  )
}

export function findWallet(
  userId: string,
  walletId: string
): Wallet | undefined {
  return getWallets(userId).find(
    wallet => wallet.id === walletId
  )
}

export function resetWalletDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}
