import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getMovimientos } from '../services/inventario-service'
import type { MovimientosFilters } from '../types/inventario'

/**
 * Movimientos del ledger, paginados en el servidor. El filtro `modulo`
 * decide si son de stock, de saldo o ambos.
 */
export const useMovimientos = (filters?: MovimientosFilters) => {
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: queryKeys.inventario.movimientos(filters as Record<string, unknown> | undefined),
    queryFn: () => getMovimientos(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  })

  return {
    movimientos: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError,
    isPlaceholderData,
  }
}
