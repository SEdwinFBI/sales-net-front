import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteVentas } from '../services/reportes-service'
import type { ReporteVentasFilters, VentaEnVariante } from '../types/reportes'

export const useReporteVentas = (filters?: ReporteVentasFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.ventas(filters as Record<string, unknown> | undefined),
    queryFn: () => getReporteVentas(filters),
  })

  const detalleVentas = useMemo<VentaEnVariante[]>(
    () => data?.por_variante?.flatMap((v) => v.ventas) ?? [],
    [data?.por_variante],
  )

  return {
    resumen: data?.resumen,
    porVariante: data?.por_variante ?? [],
    porVendedor: data?.por_vendedor ?? [],
    detalleVentas,
    isLoading,
    isError,
  }
}
