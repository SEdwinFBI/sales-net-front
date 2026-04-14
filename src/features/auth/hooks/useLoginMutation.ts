import { useMutation } from '@tanstack/react-query'
import { loginService } from '@/features/auth/services/auth-service'
import type { AuthCredentials } from '@/features/auth/types/auth'
import { parseAuthSession } from '@/features/auth/types/auth'

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const session = await loginService(credentials)
      return parseAuthSession(session)
    },
    retry: false,
  })
}
