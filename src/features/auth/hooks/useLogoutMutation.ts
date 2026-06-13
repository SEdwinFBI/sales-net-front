import { useMutation } from '@tanstack/react-query'
import { logoutService } from '@/features/auth/services/auth-service'
import { useAuthStore } from '@/features/core/store/auth-store'

export function useLogoutMutation() {
  const logout = useAuthStore((state) => state.logout)
  const refreshToken = useAuthStore((state) => state.refreshToken)

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) await logoutService(refreshToken)
    },
    onSettled: () => logout(),
    retry: false,
  })
}
