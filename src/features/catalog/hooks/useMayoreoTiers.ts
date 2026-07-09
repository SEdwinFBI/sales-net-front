import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getMayoreoTiers } from '../services/pricing-service'
import type { MayoreoTiersResponse } from '../types/pricing-types'

export const useMayoreoTiers = (userId?: number) => {
  const { data, isError, isLoading } = useQuery<MayoreoTiersResponse>({
    queryKey: queryKeys.pricing.tiers(userId as number),
    queryFn: () => getMayoreoTiers(userId as number),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    tiers: data?.tiers ?? [],
    esDefault: data?.es_default ?? true,
    isError,
    isLoading,
  }
}
