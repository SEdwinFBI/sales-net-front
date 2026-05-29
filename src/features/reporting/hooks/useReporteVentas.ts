import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteVentas } from '../services/reportes-service'
import type { ReporteVentasFilters } from '../types/reportes'

export const useReporteVentas = (filters?: ReporteVentasFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.ventas(filters as Record<string, unknown> | undefined),
    queryFn: () => getReporteVentas(filters),
    staleTime: 1000 * 60 * 5,
  })

  return {
    resumen: data?.resumen,
    porVariante: data?.por_variante ?? [],
    porVendedor: data?.por_vendedor ?? [],
    detalleVentas: data?.detalle_ventas ?? [],
    isLoading,
    isError,
  }
}
