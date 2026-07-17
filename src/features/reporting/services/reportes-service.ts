import { api } from '@/lib/api'
import type { DashboardData, ReporteVentas, ReporteVentasFilters, ReporteDeudores, ReporteDeudoresFilters } from '../types/reportes'


function setParam(params: Record<string, unknown>, key: string, value: unknown) {
  if (value !== undefined && value !== null && value !== '') params[key] = value
}

function cleanReporteVentasParams(filters?: ReporteVentasFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  setParam(params, 'fecha_desde', filters?.fecha_desde)
  setParam(params, 'fecha_hasta', filters?.fecha_hasta)
  setParam(params, 'id_variante', filters?.id_variante)
  setParam(params, 'id_vendedor', filters?.id_vendedor)
  setParam(params, 'id_articulo', filters?.id_articulo)
  setParam(params, 'id_talla', filters?.id_talla)
  return params
}

function cleanReporteDeudoresParams(filters?: ReporteDeudoresFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  setParam(params, 'fecha_desde', filters?.fecha_desde)
  setParam(params, 'fecha_hasta', filters?.fecha_hasta)
  setParam(params, 'nombre', filters?.nombre)
  setParam(params, 'lugar', filters?.lugar)
  setParam(params, 'search', filters?.nombre)
  return params
}

export const getReporteVentas = async (filters?: ReporteVentasFilters): Promise<ReporteVentas['data']> => {
  const { data } = await api.get<ReporteVentas>('/reportes/ventas', {
    params: cleanReporteVentasParams(filters),
  })
  return data.data
}

async function downloadPdf(url: string, filename: string, params?: Record<string, unknown>) {
  const response = await api.get(url, {
    params: { ...params, output: 'pdf' },
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export const downloadReporteVentasPdf = async (filters?: ReporteVentasFilters) => {
  await downloadPdf('/reportes/ventas', `reporte_ventas_${new Date().toISOString().slice(0, 10)}.pdf`, cleanReporteVentasParams(filters))
}

export const downloadReporteDeudoresPdf = async (filters?: ReporteDeudoresFilters) => {
  await downloadPdf('/reportes/deudores', `reporte_deudores_${new Date().toISOString().slice(0, 10)}.pdf`, cleanReporteDeudoresParams(filters))
}

export const getReporteDeudores = async (filters?: ReporteDeudoresFilters): Promise<ReporteDeudores['data']> => {
  const { data } = await api.get<ReporteDeudores>('/reportes/deudores', {
    params: cleanReporteDeudoresParams(filters),
  })
  return data.data
}

export interface DashboardFilters {
  fecha_desde?: string
  fecha_hasta?: string
  id_vendedor?: number
  id_articulo?: number
  id_talla?: number
}

export const getDashboardData = async (filters?: DashboardFilters): Promise<DashboardData> => {
  const params: Record<string, unknown> = {}
  if (filters?.fecha_desde) params.fecha_desde = filters.fecha_desde
  if (filters?.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
  if (filters?.id_vendedor) params.id_vendedor = filters.id_vendedor
  if (filters?.id_articulo) params.id_articulo = filters.id_articulo
  if (filters?.id_talla) params.id_talla = filters.id_talla
  const { data } = await api.get<{ status: string; data: DashboardData }>('/reportes/dashboard', { params })
  return data.data
}

