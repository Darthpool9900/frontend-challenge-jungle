
import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { requireAuth } from '../domain/auth.guard'

import {
  getOrderDatabase,
  saveOrderDatabase,
} from '../storage/order.store'

const scenarioSchema = z.object({
  outcome: z.enum([
    'confirm',
    'decline',
    'timeout',
  ]),
})

export const orderScenarioHandlers = import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? [
    http.post(
      '/api/__test/orders/scenario',
      async ({ request }) => {
          const auth = await requireAuth(request)

          if (!auth.authorized) {
            return auth.response
          }

        const body = await request.json()
          .catch(() => null)

          const parsed = scenarioSchema.safeParse(body)

          if (!parsed.success) {
            return HttpResponse.json(
              {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Cenário inválido.',
                },
              },
            { status: 422 }
            )
          }

          const database = getOrderDatabase()

        database.scenarios[auth.userId] =
          parsed.data.outcome

          saveOrderDatabase(database)

          return HttpResponse.json({
            outcome: parsed.data.outcome,
          })
      }
    ),
      ]
    : []
