import { useMutation } from '@tanstack/react-query'
import { loginService } from '@/features/auth/services/auth-service'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'


export function useLoginMutation() {
  return useMutation<AuthSession, Error, AuthCredentials>({
    mutationFn: async (credentials: AuthCredentials) => {
      const session = await loginService(credentials)
      return session;
    },
    retry: false,
  })
}
