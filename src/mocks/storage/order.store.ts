
import type { Order } from '@/contracts/order'

export type PaymentScenario =
  | 'confirm'
  | 'decline'
  | 'timeout'

export interface StoredOrder {
  order: Order

  // Identifica o conteúdo original da tentativa.
  fingerprint: string

  // Resultado que será processado depois.
  outcome: 'confirm' | 'decline'

  // Instante em que o pedido poderá ser concluído.
  settleAt: number
}

export interface OrderDatabase {
  orders: Record<string, StoredOrder>

  // Relaciona usuário + chave ao pedido.
  idempotencyIndex: Record<string, string>

  // Cenário da próxima tentativa de pagamento.
  scenarios: Record<string, PaymentScenario>
}

const STORAGE_KEY = 'jungle.orders.db.v1'

function emptyDatabase(): OrderDatabase {
  return {
    orders: {},
    idempotencyIndex: {},
    scenarios: {},
  }
}

export function getOrderDatabase(): OrderDatabase {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return emptyDatabase()
  }

  try {
    const parsed: unknown = JSON.parse(saved)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return emptyDatabase()
    }

    const db = parsed as Partial<OrderDatabase>

    if (
      !db.orders ||
      typeof db.orders !== 'object' ||
      !db.idempotencyIndex ||
      typeof db.idempotencyIndex !== 'object'
    ) {
      return emptyDatabase()
    }

    return {
      orders: db.orders,
      idempotencyIndex: db.idempotencyIndex,
      scenarios: db.scenarios ?? {},
    }
  } catch {
    return emptyDatabase()
  }
}

export function saveOrderDatabase(
  database: OrderDatabase
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(database)
  )
}

export function getIdempotencyIndex(
  userId: string,
  key: string
): string {
  return JSON.stringify([userId, key])
}

export function findOrder(
  userId: string,
  orderId: string
): StoredOrder | null {
  const stored = getOrderDatabase().orders[orderId]

  if (!stored || stored.order.userId !== userId) {
    return null
  }

  return structuredClone(stored)
}

export function findOrderByKey(
  userId: string,
  key: string
): StoredOrder | null {
  const db = getOrderDatabase()

  const index = getIdempotencyIndex(userId, key)
  const orderId = db.idempotencyIndex[index]

  if (!orderId) {
    return null
  }

  const stored = db.orders[orderId]

  if (!stored || stored.order.userId !== userId) {
    return null
  }

  return structuredClone(stored)
}

export function listUserOrders(userId: string): Order[] {
  const db = getOrderDatabase()

  return Object.values(db.orders)
    .filter(stored => stored.order.userId === userId)
    .map(stored => structuredClone(stored.order))
    .sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
}

export function resetOrderDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}
