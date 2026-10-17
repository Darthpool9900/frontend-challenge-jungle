
import { http, HttpResponse } from 'msw'

import { quoteRequestSchema } from '@/contracts/quote'

import {
  calculateQuote,
  QuoteValidationError,
} from '../domain/quote.domain'

import {
  saveQuote,
  findQuote,
} from '../storage/quote.store'

import { requireAuth } from '../domain/auth.guard'
import { revalidateQuote } from '../domain/quote.validation'

// Visitante ou usuário autenticado.
async function resolveOwner(request: Request) {
  const header = request.headers.get('Authorization')

  if (!header) {
    return { owner: 'guest' }
  }

  const auth = await requireAuth(request)

  if (!auth.authorized) {
    return { response: auth.response }
  }

  return { owner: `user:${auth.userId}` }
}

export const quoteHandlers = [
  // POST /api/quotes
  http.post('/api/quotes', async ({ request }) => {
    const context = await resolveOwner(request)

    if (context.response) {
      return context.response
    }

    const body = await request.json().catch(() => null)
    const parsed = quoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados da cotação inválidos.',
          },
        },
        { status: 422 }
      )
    }

    try {
      const quote = calculateQuote(
        context.owner!,
        parsed.data
      )

      saveQuote(context.owner!, quote)

      return HttpResponse.json(
        quote,
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof QuoteValidationError) {
        return HttpResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
            },
          },
          { status: 422 }
        )
      }

      throw error
    }
  }),

  // GET /api/quotes/:quoteId
  http.get(
    '/api/quotes/:quoteId',
    async ({ request, params }) => {
    const context = await resolveOwner(request)

    if (context.response) {
      return context.response
    }

      const quote = findQuote(
        context.owner!,
        String(params.quoteId)
      )

    if (!quote) {
      return HttpResponse.json(
        {
          error: {
            code: 'QUOTE_NOT_FOUND',
            message: 'Cotação não encontrada.',
          },
        },
          { status: 404 }
      )
    }

    if (Date.parse(quote.expiresAt) <= Date.now()) {
      return HttpResponse.json(
        {
          error: {
            code: 'QUOTE_EXPIRED',
            message: 'A cotação expirou.',
          },
        },
          { status: 410 }
      )
    }

    const validation = revalidateQuote(context.owner!, quote)
      return HttpResponse.json(validation.valid ? quote : {
        ...quote, status: 'requires_review',
        issues: [...quote.issues, { code: 'PRICE_CHANGED', message: validation.message }],
      })
    }
  ),


  // POST /api/quotes/:quoteId/validate
  http.post(
    '/api/quotes/:quoteId/validate',
    async ({ request, params }) => {
    const context = await resolveOwner(request)

    if (context.response) {
      return context.response
    }

    const owner = context.owner!
    const quoteId = String(params.quoteId)

    // Buscar cotação pertencente ao usuário.
    const quote = findQuote(owner, quoteId)

    if (!quote) {
      return HttpResponse.json(
        {
          error: {
            code: 'QUOTE_NOT_FOUND',
            message: 'Cotação não encontrada.',
          },
        },
          { status: 404 }
      )
    }

    // Verificar validade temporal.
    const expiration = Date.parse(quote.expiresAt)

      if (
        !Number.isFinite(expiration) ||
        expiration <= Date.now()
      ) {
      return HttpResponse.json(
        {
          error: {
            code: 'QUOTE_EXPIRED',
            message: 'A cotação expirou.',
          },
        },
          { status: 410 }
      )
    }

    // Recalcular tudo a partir dos dados atuais.
    const result = revalidateQuote(owner, quote)

    if (!result.valid) {
        return HttpResponse.json(
          result,
          { status: 409 }
        )
    }

    return HttpResponse.json(result)
    }
  ),

]
