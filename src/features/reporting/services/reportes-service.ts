import { api } from '@/lib/api'
import type { ReporteVentas, ReporteVentasFilters, ReporteDeudores } from '../types/reportes'

export const getReporteVentas = async (filters?: ReporteVentasFilters): Promise<ReporteVentas['data']> => {
  const { data } = await api.get<ReporteVentas>('/reportes/ventas', {
    params: filters,
  })
  return data.data
}

async function downloadPdf(url: string, filename: string, filters?: Record<string, unknown>) {
  const response = await api.get(url, {
    params: { ...filters, output: 'pdf' },
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
  await downloadPdf('/reportes/ventas', `reporte_ventas_${new Date().toISOString().slice(0, 10)}.pdf`, filters as Record<string, unknown> | undefined)
}

export const downloadReporteDeudoresPdf = async () => {
  await downloadPdf('/reportes/deudores', `reporte_deudores_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const getReporteDeudores = async (): Promise<ReporteDeudores['data']> => {
  const { data } = await api.get<ReporteDeudores>('/reportes/deudores')
  return data.data
}
