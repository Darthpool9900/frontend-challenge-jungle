
import type { StoredCartItem } from '@/contracts/cart'

type CartDatabase = Record<string, StoredCartItem[]>

const STORAGE_KEY = 'jungle.cart.db.v1'

function readDatabase(): CartDatabase {
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

    const result: CartDatabase = {}

    for (const [owner, items] of Object.entries(parsed)) {
      if (!Array.isArray(items)) continue

      result[owner] = items.filter(
        (item): item is StoredCartItem =>
          item !== null &&
          typeof item === 'object' &&
          typeof item.nftId === 'string' &&
          typeof item.editionId === 'string' &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0
      )
    }

    return result
  } catch {
    return {}
  }
}

export function getCartItems(
  owner: string
): StoredCartItem[] {
  return structuredClone(readDatabase()[owner] ?? [])
}

export function saveCartItems(
  owner: string,
  items: StoredCartItem[]
): void {
  const database = readDatabase()

  database[owner] = structuredClone(items)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(database)
  )
}

export function resetCartDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}


export function commitCartMerge(
  owner: string,
  items: StoredCartItem[]
): void {
  if (owner === 'guest') {
    throw new Error(
      'O destino da mesclagem deve ser autenticado.'
    )
  }

  const database = readDatabase()

  // Atualiza o carrinho autenticado.
  database[owner] = structuredClone(items)

  // Limpa os itens do visitante somente
  // quando a mesclagem estiver pronta.
  database.guest = []

  // Uma única operação de persistência.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(database)
  )
}

