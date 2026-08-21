import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { getResumenExistencias } from '../services/inventario-service'
import type { ResumenFilters } from '../types/inventario'

/** Resumen de existencias por variante (había, entradas, salidas, vendido, hay). */
export const useResumenExistencias = (filters?: ResumenFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.inventario.resumen(filters as Record<string, unknown> | undefined),
    queryFn: () => getResumenExistencias(filters),
    staleTime: 1000 * 60 * 5,
  })

  return {
    resumen: data?.resumen ?? [],
    totales: data?.totales,
    isLoading,
    isError,
  }
}
