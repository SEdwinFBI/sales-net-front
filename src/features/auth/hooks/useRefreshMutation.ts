import { useMutation } from '@tanstack/react-query'
import { refreshService } from '@/features/auth/services/auth-service'
import { useAuthStore } from '@/features/core/store/auth-store'

export function useRefreshMutation() {
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) throw new Error('No refresh token available')
      const { access } = await refreshService(refreshToken)
      return access
    },
    onSuccess: (access) => setAccessToken(access),
    retry: false,
  })
}
