
import {
  createFileRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import axios from 'axios'

import { AUTH_TOKEN_KEY } from '@/api/client'
import { sessionQueryOptions } from '@/features/auth/auth.queries'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      throw redirect({ to: '/login' })
    }

    try {
      const session = await context.queryClient.fetchQuery(
        sessionQueryOptions
      )

      return {
        user: session.user,
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await context.queryClient.cancelQueries()
        context.queryClient.removeQueries()

        throw redirect({ to: '/login' })
      }

      throw error
    }
  },

  component: () => <Outlet />,
})
