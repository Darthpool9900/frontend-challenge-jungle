import { useSyncExternalStore } from 'react'
import { AUTH_TOKEN_KEY } from '@/api/client'

// localStorage changes in the same tab do not fire the native storage event.
// Auth services explicitly publish this event after login/logout.
const EVENT = 'jungle:auth-token-changed'

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function snapshot(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function publishAuthTokenChange(): void {
  window.dispatchEvent(new Event(EVENT))
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}
