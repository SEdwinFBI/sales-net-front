import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { saveMayoreoTiers } from '../services/pricing-service'
import type { SaveMayoreoTiersPayload } from '../types/pricing-types'

export const useSaveMayoreoTiers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveMayoreoTiersPayload) => saveMayoreoTiers(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.tiers(payload.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.effective(payload.userId) })
    },
  })
}
