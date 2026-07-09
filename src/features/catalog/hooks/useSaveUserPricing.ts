import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { saveUserPricing } from '../services/pricing-service'
import type { SaveUserPricingPayload } from '../types/pricing-types'

export const useSaveUserPricing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveUserPricingPayload) => saveUserPricing(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.user(payload.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.effective(payload.userId) })
    },
  })
}
