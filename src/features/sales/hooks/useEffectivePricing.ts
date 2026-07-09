import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/features/core/store/auth-store'
import { getEffectivePricing } from '@/features/catalog/services/pricing-service'
import type { EffectivePricingConfig } from '@/features/catalog/types/pricing-types'

/**
 * Config efectiva de precios/descuentos del usuario autenticado para el POS.
 * Es solo para el cálculo preview en el cliente: el servidor recalcula al
 * registrar la venta.
 */
export const useEffectivePricing = () => {
  const user = useAuthStore((state) => state.user)

  const { data, isError, isLoading } = useQuery<EffectivePricingConfig>({
    queryKey: queryKeys.pricing.effective(user?.id ?? 0),
    queryFn: getEffectivePricing,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  })

  return {
    config: data ?? null,
    isError,
    isLoading,
  }
}
