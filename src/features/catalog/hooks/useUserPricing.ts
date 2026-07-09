import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getUserPricing } from '../services/pricing-service'
import type { UserVariantPricing } from '../types/pricing-types'

export const useUserPricing = (userId?: number) => {
  const { data, isError, isLoading } = useQuery<UserVariantPricing[]>({
    queryKey: queryKeys.pricing.user(userId as number),
    queryFn: () => getUserPricing(userId as number),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isError,
    isLoading,
  }
}
