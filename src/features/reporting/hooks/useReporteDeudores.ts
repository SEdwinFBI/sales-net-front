import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteDeudores } from '../services/reportes-service'
import type { ReporteDeudoresFilters } from '../types/reportes'

export const useReporteDeudores = (filters?: ReporteDeudoresFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.deudores(filters as Record<string, unknown> | undefined),
    queryFn: () => getReporteDeudores(filters),
    staleTime: 1000 * 60 * 5,
  })

  return {
    clientes: data?.clientes ?? [],
    resumen: data?.resumen,
    isLoading,
    isError,
  }
}
