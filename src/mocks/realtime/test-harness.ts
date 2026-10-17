// Explicit opt-in browser integration harness. No alternate business implementation.
import { QueryObserver, type QueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { authService } from '@/services/auth.service'
import { nftService } from '@/services/nft.service'
import { cartService } from '@/services/cart.service'
import { quoteService } from '@/services/quote.service'
import { walletService } from '@/services/wallet.service'
import { walletConnectionService } from '@/services/wallet-connection.service'
import { orderService } from '@/services/order.service'
import { orderRecoveryService } from '@/services/order-recovery.service'
import { sessionQueryOptions } from '@/features/auth/auth.queries'
import { nftDetailQueryOptions, nftListQueryOptions } from '@/features/nfts/nft.queries'
import { cartQueryOptions } from '@/features/cart/cart.queries'
import { quoteQueryOptions } from '@/features/checkout/quote.queries'
import { orderQueryOptions, orderKeys } from '@/features/orders/order.queries'
import { realtimeState, realtimeDiagnostics, retainRealtime } from '@/realtime/socket.lifecycle'
import type { SessionResponse } from '@/contracts/auth'
import { worker } from '../browser'
import { http, HttpResponse } from 'msw'

export function installHarness(client: QueryClient) {
  const subscriptions: (() => void)[] = []
  const user = () => client.getQueryData<SessionResponse>(sessionQueryOptions.queryKey)?.user.id ?? null
  const owner = () => user() ? `user:${user()}` : 'guest'
  const harness = {
    status: realtimeState.getSnapshot,
    diagnostics: () => ({ ...realtimeDiagnostics }),
    async login(email = 'ana@jungle.test') {
      const response = await authService.login({ email, password: 'Demo@12345' })
      await client.cancelQueries()
      client.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' })
      client.setQueryData(sessionQueryOptions.queryKey, { user: response.user, expiresAt: response.expiresAt })
      return response.user.id
    },
    async logout() {
      await authService.logout()
      await client.cancelQueries()
      client.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' })
      client.setQueryData<SessionResponse | null>(sessionQueryOptions.queryKey, null)
    },
    async observe() {
      const list = await nftService.list()
      const { nft } = await nftService.getById(list.items.find(item => item.availableQuantity > 0)!.id)
      const detail = nftDetailQueryOptions(nft.id)
      subscriptions.push(new QueryObserver(client, detail).subscribe(() => {}))
      subscriptions.push(new QueryObserver(client, nftListQueryOptions()).subscribe(() => {}))
      subscriptions.push(new QueryObserver(client, cartQueryOptions(owner())).subscribe(() => {}))
      await client.fetchQuery(detail)
      return nft
    },
    nft: (id: string) => client.getQueryData(nftDetailQueryOptions(id).queryKey),
    restNft: nftService.getById,
    cart: () => client.getQueryData(cartQueryOptions(owner()).queryKey),
    async patch(nftId: string, editionId: string, changes: { priceEth?: string; availableQuantity?: number }) {
      return (await api.patch(`/__test/nfts/${nftId}/editions/${editionId}`, changes)).data
    },
    async scenario(action: string, event = 'nft.updated') {
      return (await api.post('/__test/realtime', { action, event })).data
    },
    async connections() { return (await api.get<{ connections: number }>('/__test/realtime')).data.connections },
    async quote(nftId: string, editionId: string) {
      await cartService.add({ nftId, editionId, quantity: 1 })
      const quote = await quoteService.create()
      const options = quoteQueryOptions(owner(), quote.quoteId)
      subscriptions.push(new QueryObserver(client, options).subscribe(() => {}))
      await client.fetchQuery(options)
      return quote
    },
    cachedQuote: (id: string) => client.getQueryData(quoteQueryOptions(owner(), id).queryKey),
    async buy(nftId: string, editionId: string, outcome: 'confirm' | 'decline' | 'timeout') {
      const quote = await harness.quote(nftId, editionId)
      const wallet = await walletService.create({
        label: 'Test wallet', address: `0x${'1'.repeat(40)}`, network: 'ethereum', kind: 'primary',
      })
      await walletConnectionService.connect({ walletId: wallet.id, network: 'ethereum' })
      await api.post('/__test/orders/scenario', { outcome })
      const result = await orderRecoveryService.start(user()!, {
        quoteId: quote.quoteId, walletId: wallet.id,
        collector: { name: 'Test Collector', email: 'test@example.com' },
      })
      client.setQueryData(orderKeys.detail(user()!, result.order.id), result)
      subscriptions.push(new QueryObserver(client, orderQueryOptions(user()!, result.order.id)).subscribe(() => {}))
      return result.order
    },
    order: (id: string) => client.getQueryData(orderQueryOptions(user()!, id).queryKey),
    orders: orderService.list,
    pending: () => user() ? orderRecoveryService.getPendingAttempt(user()!) : null,
    async observeOrder(id: string) {
      const options = orderQueryOptions(user()!, id)
      subscriptions.push(new QueryObserver(client, options).subscribe(() => {}))
      return client.fetchQuery(options)
    },
    remount() {
      const first = retainRealtime(client, user())
      first()
      const second = retainRealtime(client, user())
      second()
    },
    offline: () => window.dispatchEvent(new Event('offline')),
    online: () => window.dispatchEvent(new Event('online')),
    // Hold a real MSW REST response until released to test cancellation races.
    async holdNft(id: string) {
      const snapshot = await nftService.getById(id)
      let release = () => {}
      const gate = new Promise<void>(resolve => { release = resolve })
      let started = false
      worker.use(http.get(`/api/nfts/${id}`, async () => {
            started = true
            await gate
            return HttpResponse.json(snapshot)
      }, { once: true }))
      void client.refetchQueries({ queryKey: nftDetailQueryOptions(id).queryKey })
      harness.releaseHeld = release
      harness.heldStarted = () => started
    },
    heldStarted: () => false,
    releaseHeld: () => {},
  }
  window.realtimeTest = harness
  return harness
}
declare global {
  interface Window { realtimeTest: ReturnType<typeof installHarness> }
  }
