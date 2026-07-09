import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { deleteUserVariantPricing } from '../services/pricing-service'

export const useDeleteUserPricing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, variantId }: { userId: number; variantId: number }) =>
      deleteUserVariantPricing(userId, variantId),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.user(payload.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.effective(payload.userId) })
    },
  })
}
