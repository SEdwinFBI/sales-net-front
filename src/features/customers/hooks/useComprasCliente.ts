import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getComprasCliente } from '../services/clientes-service'
import type { ComprasData, ComprasFilters } from '../types/clientes'

export const useComprasCliente = (idCliente: number, filters?: ComprasFilters) => {
  const { data, isLoading, isError } = useQuery<ComprasData>({
    queryKey: queryKeys.customers.compras(idCliente, filters as Record<string, unknown> | undefined),
    queryFn: () => getComprasCliente(idCliente, filters),
    enabled: !!idCliente,
  })

  return {
    ventas: data?.ventas ?? [],
    resumen: data?.resumen,
    isLoading,
    isError,
  }
}
