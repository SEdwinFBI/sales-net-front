import { useMutation } from '@tanstack/react-query'
import { loginPatternService } from '../services/auth-service'

export function usePatternLoginMutation() {
  return useMutation({ mutationFn: loginPatternService, retry: false, gcTime: 0 })
}
