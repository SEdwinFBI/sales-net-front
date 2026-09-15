import { useMutation } from '@tanstack/react-query'
import { createPatternService } from '../services/auth-service'

export function useCreatePatternMutation() {
  return useMutation({
    mutationFn: createPatternService,
    retry: false,
    gcTime: 0,
  })
}
