import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteVentas } from '../services/reportes-service'
import type { ReporteVentasFilters, VentaEnVariante } from '../types/reportes'

/** Ventas por variante y por vendedor, con el resumen agregado del rango filtrado. */
export const useReporteVentas = (filters?: ReporteVentasFilters) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.ventas(filters as Record<string, unknown> | undefined),
    queryFn: () => getReporteVentas(filters),
  })

  // Aplana las ventas de todas las variantes en una sola lista, para la
  // tabla de detalle que no distingue por variante.
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
