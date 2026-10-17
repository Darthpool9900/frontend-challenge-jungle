
import { api } from '@/api/client'

import type {
  CreateOrderInput,
  OrderResponse,
  OrdersResponse,
} from '@/contracts/order'

export const orderService = {

  // ========================================
  // CRIAR PEDIDO
  // POST /api/orders
  // ========================================

  async create(
    input: CreateOrderInput,
    idempotencyKey: string
  ): Promise<OrderResponse> {
    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128
    ) {
      throw new Error(
        'Chave de idempotência inválida.'
      )
    }

    const { data } = await api.post<OrderResponse>(
      '/orders',
      input,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    )

    return data
  },

  // ========================================
  // LISTAR PEDIDOS
  // GET /api/orders
  // ========================================

  async list(signal?: AbortSignal): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>(
      '/orders', { signal }
    )

    return data
  },

  // ========================================
  // CONSULTAR PEDIDO POR ID
  // GET /api/orders/:orderId
  // ========================================

  async getById(
    orderId: string,
    signal?: AbortSignal
  ): Promise<OrderResponse> {
    const { data } = await api.get<OrderResponse>(
      `/orders/${encodeURIComponent(orderId)}`, { signal }
    )

    return data
  },

  // ========================================
  // RECUPERAR PEDIDO POR CHAVE
  // GET /api/orders/by-key/:key
  // ========================================

  async getByKey(
    idempotencyKey: string,
    signal?: AbortSignal
  ): Promise<OrderResponse> {
    const { data } = await api.get<OrderResponse>(
      `/orders/by-key/${encodeURIComponent(idempotencyKey)}`, { signal }
    )

    return data
  },
}
