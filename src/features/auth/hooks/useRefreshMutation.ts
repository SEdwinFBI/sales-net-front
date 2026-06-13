import { useMutation } from '@tanstack/react-query'
import { refreshService } from '@/features/auth/services/auth-service'
import { useAuthStore } from '@/features/core/store/auth-store'
import type { AuthSession } from '@/features/auth/types/auth'

export function useRefreshMutation() {
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: async (): Promise<AuthSession> => {
      if (!refreshToken) throw new Error('No refresh token available')
      return refreshService(refreshToken)
    },
    onSuccess: (session) => login(session),
    retry: false,
  })
}
