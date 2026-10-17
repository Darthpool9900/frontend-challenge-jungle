import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { socketScenarios } from './socket.publisher'
import { resetAuthDatabase } from '../storage/auth.store'
import { resetNftDatabase } from '../storage/nft.store'
import { resetOrderDatabase } from '../storage/order.store'
import { resetCartDatabase } from '../storage/cart.store'
import { resetQuoteDatabase } from '../storage/quote.store'
import { resetWalletDatabase } from '../storage/wallet.store'
import { resetConnectionDatabase } from '../storage/wallet-connection.store'
import { resetFavorites } from '../storage/favorites.store'

const scenario = z.object({
  action: z.enum(['disconnect', 'duplicate', 'stale', 'reset', 'reject', 'resume']),
  event: z.enum(['nft.updated', 'order.updated']).default('nft.updated'),
})
export const socketScenarioHandlers = [
  http.post('/api/__test/reset', () => {
    socketScenarios.disconnect()
    socketScenarios.reset()
    socketScenarios.rejectConnections = false
    resetAuthDatabase()
    resetOrderDatabase()
    resetCartDatabase()
    resetQuoteDatabase()
    resetWalletDatabase()
    resetConnectionDatabase()
    resetFavorites()
    resetNftDatabase()
    localStorage.removeItem('jungle.checkout.pending.v1')
    return HttpResponse.json({ reset: true, reloadRequired: true })
  }),
  http.get('/api/__test/realtime', () => HttpResponse.json({ connections: socketScenarios.connections() })),
  http.post('/api/__test/realtime', async ({ request }) => {
    const parsed = scenario.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ error: 'Invalid scenario' }, { status: 422 })
    const { action, event } = parsed.data
    if (action === 'disconnect') socketScenarios.disconnect()
    if (action === 'reject') { socketScenarios.rejectConnections = true; socketScenarios.disconnect() }
    if (action === 'resume') socketScenarios.rejectConnections = false
    if (action === 'reset') socketScenarios.reset()
    const replayed = action === 'duplicate' || action === 'stale'
      ? socketScenarios.replay(event, action === 'stale') : false
    return HttpResponse.json({ replayed })
  }),
]
