import type { QueryClient } from '@tanstack/react-query'
import { AUTH_TOKEN_KEY } from '@/api/client'
import { ordersQueryOptions, orderKeys, orderByKeyQueryOptions } from '@/features/orders/order.queries'
import { orderRecoveryService } from '@/services/order-recovery.service'
import { createSocket, initializeSocketTransport } from './socket.client'
import { createSync } from './socket.sync'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'offline' | 'error'
export const realtimeDiagnostics = { connectionsCreated: 0, nftReceived: 0, orderReceived: 0 }
let status: RealtimeStatus = 'idle'
const listeners = new Set<() => void>()
function setStatus(next: RealtimeStatus) {
  status = next
  for (const listener of listeners) listener()
}
export const realtimeState = {
  getSnapshot: () => status,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
}
let ready = false
let current: { identity: string; client: QueryClient; refs: number; stop: () => void } | null = null
export async function initializeRealtime() { await initializeSocketTransport(); ready = true }
export function stopRealtime() {
  current?.stop()
  current = null
  setStatus('idle')
}
export function retainRealtime(client: QueryClient, userId: string | null) {
  if (!ready) return () => {}
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token && !userId) return () => {}
  const identity = `${userId ?? 'guest'}:${token ?? ''}`
  if (current && (current.identity !== identity || current.client !== client)) stopRealtime()
  if (!current) {
    const socket = createSocket()
    realtimeDiagnostics.connectionsCreated++
    const sync = createSync(client, userId)
    let active = true
    let polling = false
    const valid = () => active && localStorage.getItem(AUTH_TOKEN_KEY) === token
    // REST drives the existing lazy settlement, including when the socket is down.
    const poll = async (initial = false) => {
      if (!valid() || !userId || polling || !navigator.onLine) return
      const pending = orderRecoveryService.getPendingAttempt(userId)
      const hasPending = client.getQueriesData<import('@/contracts/order').OrderResponse | import('@/contracts/order').OrdersResponse>({ queryKey: orderKeys.byUser(userId) })
        .some(([, data]) => data && ('order' in data ? data.order.status === 'pending' : data.orders.some(order => order.status === 'pending')))
      if (!initial && !pending && !hasPending) return
      polling = true
      try {
        await client.fetchQuery(ordersQueryOptions(userId))
        if (!valid()) return
        if (pending) {
          const result = await client.fetchQuery(orderByKeyQueryOptions(userId, pending.key))
          if (valid()) {
            client.setQueryData(orderKeys.detail(userId, result.order.id), result)
            if (result.order.status !== 'pending') await orderRecoveryService.recover(userId)
          }
        }
      } catch { /* Query retains the error; the same key can be retried. */ }
      finally { polling = false }
    }
    const reconcile = () => {
      if (!valid()) return
      setStatus('connected')
      void sync.reconnect().then(() => { if (valid()) void poll(true) })
    }
    socket.on('connect', () => {
      if (!valid()) return
      if (import.meta.env.VITE_ENABLE_MOCKS === 'true') socket.emit('session.subscribe', token)
      else reconcile()
    })
    socket.auth = { token }
    socket.on('session.ready', reconcile)
    socket.on('session.error', () => {
      socket.disconnect()
      setStatus('error')
      void client.invalidateQueries({ queryKey: ['auth', 'session'] })
    })
    socket.on('nft.updated', event => { if (valid()) { realtimeDiagnostics.nftReceived++; void sync.nft(event) } })
    socket.on('order.updated', event => { if (valid()) { realtimeDiagnostics.orderReceived++; void sync.order(event) } })
    socket.on('connect_error', () => setStatus('error'))
    socket.on('disconnect', () => setStatus(navigator.onLine ? 'disconnected' : 'offline'))
    const online = () => { if (valid()) { setStatus('connecting'); socket.connect(); void poll(true) } }
    const offline = () => { socket.disconnect(); setStatus('offline') }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    const timer = setInterval(() => { void poll() }, 1500)
    current = { identity, client, refs: 0, stop() {
      active = false
      sync.dispose()
      socket.removeAllListeners()
      socket.disconnect()
      clearInterval(timer)
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      if (userId) {
        void client.cancelQueries({ queryKey: orderKeys.byUser(userId) })
        client.removeQueries({ queryKey: orderKeys.byUser(userId) })
      }
    } }
    if (navigator.onLine) online()
    else setStatus('offline')
  }
  const retained = current
  retained.refs++
  return () => {
    retained.refs--
    // StrictMode remount retains the same connection before this microtask.
    queueMicrotask(() => { if (current === retained && retained.refs === 0) stopRealtime() })
  }
}
