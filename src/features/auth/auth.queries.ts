
import { queryOptions } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'

export const authKeys = {
  session: ['auth', 'session'] as const,
}

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session,
  queryFn: () => authService.getSession(),
  staleTime: 0,
  retry: false,
})
