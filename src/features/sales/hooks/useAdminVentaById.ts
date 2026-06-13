import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getAdminVentaById } from '../services/products-service'
import type { Venta } from '../types/sales'

export const useAdminVentaById = (id: number) => {
  const { data, isLoading, isError } = useQuery<Venta>({
    queryKey: queryKeys.adminVentas.detail(id),
    queryFn: () => getAdminVentaById(id),
    enabled: !!id,
  })

  return { venta: data, isLoading, isError }
}
