import { useMutation } from '@tanstack/react-query'
import { loginService } from '@/features/auth/services/auth-service'
import type { AuthCredentials, LoginResult } from '@/features/auth/types/auth'


export function useLoginMutation() {
  return useMutation<LoginResult, Error, AuthCredentials>({
    mutationFn: async (credentials: AuthCredentials) => {
      const result = await loginService(credentials)
      return result;
    },
    retry: false,
  })
}
