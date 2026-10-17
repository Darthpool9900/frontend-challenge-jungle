
import { api } from '@/api/client'

import type {
  QuoteRequest,
  QuoteResponse,
  QuoteValidationResponse
} from '@/contracts/quote'

export const quoteService = {

  // ========================================
  // POST /api/quotes
  // Criar uma cotação
  // ========================================

  async create(
    input: QuoteRequest = {}
  ): Promise<QuoteResponse> {
    const { data } = await api.post<QuoteResponse>(
      '/quotes',
      input
    )

    return data
  },

  // ========================================
  // GET /api/quotes/:quoteId
  // Recuperar uma cotação existente
  // ========================================

  async getById(
    quoteId: string,
    signal?: AbortSignal
  ): Promise<QuoteResponse> {
    const { data } = await api.get<QuoteResponse>(
      `/quotes/${encodeURIComponent(quoteId)}`, { signal }
    )

    return data
  },


  // Revalidar cotação antes do checkout
  async validate(
    quoteId: string
  ): Promise<QuoteValidationResponse> {
    const { data } =
      await api.post<QuoteValidationResponse>(
        `/quotes/${encodeURIComponent(quoteId)}/validate`
    )

    return data
  },


  // ========================================
  // Criar cotação sem cupom
  // ========================================

  async createWithoutCoupon(
    network: QuoteRequest['network'] = 'ethereum'
  ): Promise<QuoteResponse> {
    return this.create({ network })
  },

  // ========================================
  // Criar cotação aplicando cupom
  // ========================================

  async applyCoupon(
    couponCode: string,
    network: QuoteRequest['network'] = 'ethereum'
  ): Promise<QuoteResponse> {
    return this.create({
      network,
      couponCode,
    })
  },
}
