import type { Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents } from './socket.contracts'

let io: typeof import('socket.io-client').io
export async function initializeSocketTransport() {
  // Engine.IO captures the WebSocket constructor at module evaluation time.
  // Import only AFTER MSW has installed its WebSocket interceptor.
  io = (await import('socket.io-client')).io
}

export function socketConfig() {
  return {
    url: import.meta.env.VITE_SOCKET_URL || window.location.origin,
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io/',
  }
}
export function createSocket(): Socket<ServerEvents, ClientEvents> {
  const { url, path } = socketConfig()
  return io(url, {
    path, autoConnect: false, forceNew: true,
    // MSW intercepts WebSocket; polling would escape to the static host.
    transports: ['websocket'], reconnection: true,
    reconnectionDelay: 500, reconnectionDelayMax: 5000,
    randomizationFactor: 0, timeout: 5000,
  })
}
