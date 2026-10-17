import { useEffect, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthSession } from '@/features/auth/auth.hooks'
import { useAuthToken } from '@/features/auth/auth-token.store'
import { retainRealtime, realtimeState } from './socket.lifecycle'

export function useRealtimeStatus() {
  return useSyncExternalStore(realtimeState.subscribe, realtimeState.getSnapshot)
}
export function RealtimeConnection() {
  const client = useQueryClient()
  const session = useAuthSession()
  const token = useAuthToken()
  const userId = token ? session.data?.user.id ?? null : null
  useEffect(() => retainRealtime(client, userId), [client, userId, token])
  return null
}
