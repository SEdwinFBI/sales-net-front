import { api } from '@/lib/api'
import { previewReport } from '@/lib/report-pdf'
import type { ApiResponse } from '@/features/sales/types/sales'
import type {
  MovimientosFilters,
  MovimientosResponse,
  ResumenExistencias,
  ResumenFilters,
} from '../types/inventario'
import { getToday } from '@/lib/dates'

/** Descarta vacíos para que el backend no reciba filtros fantasma. */
function limpiar(filters?: Record<string, unknown>): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params[key] = value
  })
  return params
}

/**
 * Único listado del ledger. `modulo=STOCK` trae los movimientos de
 * existencias y `modulo=SALDO` los de saldo de cliente; sin el parámetro,
 * ambos.
 */
export const getMovimientos = async (filters?: MovimientosFilters): Promise<MovimientosResponse> => {
  const { data } = await api.get<MovimientosResponse>('/movimientos', {
    params: limpiar(filters),
  })
  return data
}

/**
 * PDF del listado de movimientos. Manda los MISMOS filtros que la pantalla,
 * pero sin paginar: el documento trae todo lo que cumple el filtro, no sólo
 * la página visible.
 */
export const downloadMovimientosPdf = async (
  filters?: MovimientosFilters,
  agruparPorVendedor = false,
) => {
  // Se quita la paginación a propósito: el PDF exporta todo lo filtrado.
  const sinPaginar = { ...(filters ?? {}) }
  delete sinPaginar.page
  delete sinPaginar.page_size

  const sufijo = agruparPorVendedor ? '_por_vendedor' : ''
  await previewReport('/movimientos', `movimientos_stock${sufijo}_${getToday()}.pdf`, {
    params: {
      ...limpiar(sinPaginar),
      output: 'pdf',
      ...(agruparPorVendedor ? { agrupar: 'vendedor' } : {}),
    },
  })
}

/** Resumen por variante: había, entradas, salidas, vendido y hay. */
export const getResumenExistencias = async (filters?: ResumenFilters): Promise<ResumenExistencias> => {
  const { data } = await api.get<ApiResponse<ResumenExistencias>>('/stock/movimientos/resumen', {
    params: limpiar(filters),
  })
  return data.data
}

/** PDF del resumen de existencias, con los mismos filtros que la pantalla. */
export const downloadResumenPdf = async (filters?: ResumenFilters, incluirDetalle = false) => {
  await previewReport('/stock/movimientos/resumen', `movimientos_stock_${getToday()}.pdf`, {
    params: { ...limpiar(filters), output: 'pdf', ...(incluirDetalle ? { incluir_detalle: 1 } : {}) },
  })
}
