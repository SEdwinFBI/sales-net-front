import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteCobros } from '../services/reportes-service'
import type { ReporteCobrosFilters } from '../types/reportes'

export const useReporteCobros = (filters?: ReporteCobrosFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.cobros(filters as Record<string, unknown> | undefined),
    queryFn: () => getReporteCobros(filters),
    staleTime: 1000 * 60 * 5,
  })

  return {
    resumen: data?.resumen,
    porUsuario: data?.por_usuario ?? [],
    isLoading,
    isError,
  }
}
