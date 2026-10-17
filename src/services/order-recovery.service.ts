
import { isAxiosError } from 'axios'

import {
  createOrderSchema,
  type CreateOrderInput,
  type OrderResponse,
} from '@/contracts/order'

import { orderService } from './order.service'

interface PendingAttempt {
  key: string
  input: CreateOrderInput
  createdAt: string
}

const STORAGE_KEY = 'jungle.checkout.pending.v1'

// ========================================
// ARMAZENAMENTO DAS TENTATIVAS
// ========================================

function readDatabase(): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}'
    )

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value as Record<string, unknown>
    }
  } catch {
    // Banco ausente ou inválido.
  }

  return {}
}

function saveAttempt(
  userId: string,
  attempt: PendingAttempt
): void {
  const db = readDatabase()

  db[userId] = attempt

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  )
}

function getPendingAttempt(
  userId: string
): PendingAttempt | null {
  const value = readDatabase()[userId]

  if (!value || typeof value !== 'object') {
    return null
  }

  const attempt = value as Partial<PendingAttempt>
  const parsed = createOrderSchema.safeParse(attempt.input)

  if (
    typeof attempt.key !== 'string' ||
    attempt.key.length < 8 ||
    attempt.key.length > 128 ||
    typeof attempt.createdAt !== 'string' ||
    !parsed.success
  ) {
    return null
  }

  return {
    key: attempt.key,
    input: parsed.data,
    createdAt: attempt.createdAt,
  }
}

function clearPendingAttempt(
  userId: string,
  expectedKey?: string
): void {
  const db = readDatabase()
  const current = getPendingAttempt(userId)

  // Não apagar uma tentativa mais recente
  // por engano.
  if (
    expectedKey &&
    current?.key !== expectedKey
  ) {
    return
  }

  delete db[userId]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  )
}

function handleResult(
  userId: string,
  attempt: PendingAttempt,
  result: OrderResponse
): OrderResponse {
  // Enquanto estiver pendente, manter a chave
  // disponível para recuperação após refresh.
  if (result.order.status === 'pending') {
    saveAttempt(userId, attempt)
  } else {
    clearPendingAttempt(userId, attempt.key)
  }

  return result
}

// ========================================
// SERVIÇO DE RECUPERAÇÃO
// ========================================

export const orderRecoveryService = {

  getPendingAttempt,

  // ======================================
  // RECUPERAR TENTATIVA ANTERIOR
  // ======================================

  async recover(
    userId: string
  ): Promise<OrderResponse | null> {
    const attempt = getPendingAttempt(userId)

    if (!attempt) {
      return null
    }

    try {
      const result = await orderService.getByKey(
        attempt.key
      )

      return handleResult(userId, attempt, result)
    } catch (error) {
      // Não foi encontrado um pedido persistido.
      // Manter a chave para repetir a mesma tentativa.
      if (
        isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return null
      }

      throw error
    }
  },

  // ======================================
  // CRIAR OU RETOMAR UM CHECKOUT
  // ======================================

  async start(
    userId: string,
    input: CreateOrderInput
  ): Promise<OrderResponse> {
    const normalized = createOrderSchema.parse(input)

    const previous = getPendingAttempt(userId)

    // Impedir uma segunda compra diferente
    // enquanto há uma tentativa não resolvida.
    if (
      previous &&
      JSON.stringify(previous.input) !==
        JSON.stringify(normalized)
    ) {
      throw new Error(
        'Há um pagamento pendente. Recupere ou resolva a tentativa anterior antes de iniciar outra compra.'
      )
    }

    // Reutilizar a chave existente ou criar
    // uma única chave para a nova tentativa.
    const attempt: PendingAttempt = previous ?? {
      key: crypto.randomUUID(),
      input: normalized,
      createdAt: new Date().toISOString(),
    }

    // Persistir ANTES de enviar a requisição.
    saveAttempt(userId, attempt)

    try {
      const result = await orderService.create(
        attempt.input,
        attempt.key
      )

      return handleResult(userId, attempt, result)
    } catch (error) {

      // Erros definitivos de validação não devem
      // provocar novas tentativas automáticas.
      if (
        isAxiosError(error) &&
        error.response &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        clearPendingAttempt(userId, attempt.key)
        throw error
      }

      // O servidor pode ter criado o pedido
      // antes da conexão falhar.
      try {
        const recovered = await this.recover(userId)

        if (recovered) {
          return recovered
        }
      } catch {
        // Se a recuperação falhar, preservar
        // a mesma chave para uma nova tentativa.
      }

      throw new Error(
        'Não foi possível confirmar o resultado do pagamento. A tentativa foi preservada para recuperação.',
        { cause: error }
      )
    }
  },
}
