import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { socketConfig } from '@/realtime/socket.client'
import { requireAuth } from '../domain/auth.guard'
import { subscribe, socketScenarios } from './socket.publisher'

const config = socketConfig()
const url = new URL(config.path, config.url)
url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

// MSW 2 normalizes an incoming Engine.IO /socket.io/ request to the
// origin root before matching WebSocket handlers (WebSocketHandler.parse).
// Registering /socket.io/* here silently misses every client connection.
// Custom Socket.IO paths remain unchanged by that MSW normalization.
const normalizedPath = url.pathname.replace(/^\/socket\.io\//, '/')
const handlerUrl = `${url.origin}${normalizedPath}`

export const socketHandlers = [ws.link(handlerUrl).addEventListener('connection', connection => {
    if (socketScenarios.rejectConnections) {
      connection.client.close(1013, 'Scenario unavailable')
      return
    }
    const io = toSocketIo(connection)
    let closed = false
    let unsubscribe = () => {}
    let expiry: ReturnType<typeof setTimeout> | undefined
    // Binding 0.2 supplies the Engine.IO open/namespace packets, but no heartbeat,
    // authentication, rooms or broadcast. Those are explicitly implemented here.
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    io.client.on('session.subscribe', async (_event, value: unknown) => {
      unsubscribe()
      clearTimeout(expiry)
      let userId: string | null = null
      if (value !== null) {
        if (typeof value !== 'string') return
      const auth = await requireAuth(new Request(window.location.origin, {
            headers: { Authorization: `Bearer ${value}` },
      }))
        if (closed) return
      if (!auth.authorized) { io.client.emit('session.error'); return }
        userId = auth.userId
      expiry = setTimeout(() => {
            unsubscribe()
            io.client.emit('session.error')
      }, Math.max(0, Date.parse(auth.expiresAt) - Date.now()))
      }
      if (closed) return
      unsubscribe = subscribe({
        send(event) {
        if (event.name === 'order.updated' && event.data.userId !== userId) return
          io.client.emit(event.name, event.data)
        },
        close: () => connection.client.close(1012, 'Scenario disconnect'),
      })
      io.client.emit('session.ready')
    })
    connection.client.addEventListener('close', () => {
      closed = true
      unsubscribe()
      clearInterval(heartbeat)
      clearTimeout(expiry)
    })
})]
