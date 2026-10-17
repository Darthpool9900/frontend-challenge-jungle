import { RealtimeConnection } from './realtime/realtime.hooks'
import { initializeRealtime } from './realtime/socket.lifecycle'

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import {
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Connect to the same realtime transport after React has painted the first frame.
// The MSW worker is already active by the time this component is mounted.
// eslint-disable-next-line react-refresh/only-export-components
function RealtimeBootstrap() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void initializeRealtime().then(() => {
      if (active) setReady(true)
    }).catch((error: unknown) => {
      console.error('Não foi possível iniciar o transporte realtime:', error)
    })

    return () => {
      active = false
    }
  }, [])

  return ready ? <RealtimeConnection /> : null
}

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }

  if (import.meta.env.VITE_ENABLE_TEST_HARNESS === 'true' && import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { installHarness } = await import('./mocks/realtime/test-harness')
    installHarness(queryClient)
  }

  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Elemento root não encontrado')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RealtimeBootstrap />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
