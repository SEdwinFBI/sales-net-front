import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getAdminVentas } from '../services/products-service'
import type { AdminVentaFilters, Venta } from '../types/sales'

export const useAdminVentas = (filters?: AdminVentaFilters) => {
  const { data, isLoading, isError } = useQuery<Venta[]>({
    queryKey: queryKeys.adminVentas.list(filters as Record<string, unknown> | undefined),
    queryFn: () => getAdminVentas(filters).then((res) => res.results),
  })

  return { ventas: data ?? [], isLoading, isError }
}
