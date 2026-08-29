import { api } from '@/lib/api'
import { formatCurrency } from '@/helpers/money'
import { triggerBlobDownload } from '@/lib/download-blob'
import type { SalesArticlesResponse, ApiResponse, Venta, SalesHistoryFilters, SubmitSalePayload, SubmitSaleResponse, CreateVentaPayload, CreateVentaResponse, AdminVentaFilters, VentaListResponse, BranchAvailability } from '../types/sales'

/**
 * Lista los artículos del POS. El orden lo resuelve el servidor ANTES de
 * paginar (`orden=stock` = mayores existencias primero), así que no debe
 * reordenarse en el cliente: solo tendría efecto dentro de la página actual.
 */
export const getArticles = async (page = 1, pageSize = 10, search?: string): Promise<SalesArticlesResponse> => {
  const { data } = await api.get<SalesArticlesResponse>('/sales/articles', {
    params: { page, page_size: pageSize, orden: 'stock', ...(search ? { search } : {}) },
  })
  return data
}

export const getArticleAvailability = async (articleId: number): Promise<ApiResponse<BranchAvailability>> => {
  const { data } = await api.get<ApiResponse<BranchAvailability>>(`/sales/articles/${articleId}/existencias`)
  return data
}

export const getSalesHistory = async (filters?: SalesHistoryFilters): Promise<ApiResponse<Venta[]>> => {
  const { data } = await api.get<ApiResponse<Venta[]>>('/ventas/historial', {
    params: filters,
  })
  return data
}

/** Resumen legible de los filtros aplicados, para imprimirlo en el encabezado del PDF. */
export interface HistorialPdfFiltros {
  fecha_desde?: string
  fecha_hasta?: string
  estado?: string
  forma_pago?: string
  busqueda?: string
}

/**
 * Descarga el PDF del historial. Envía los IDs de las ventas visibles (ya
 * filtradas en pantalla) para que el documento refleje exactamente lo mostrado.
 */
export const downloadHistorialVentasPdf = async (ids: number[], filtros: HistorialPdfFiltros) => {
  const response = await api.post('/ventas/historial/pdf', { ids, filtros }, {
    responseType: 'blob',
  })
  triggerBlobDownload(response.data, `historial_ventas_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const submitSale = async (payload: SubmitSalePayload): Promise<SubmitSaleResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  if (payload.paymentMethod === 'credito' && !payload.customerId) {
    throw new Error('Venta a crédito requiere un cliente')
  }
  return {
    success: true,
    saleId: `VEN-${Date.now()}`,
    message: `Venta por ${formatCurrency(payload.total)} registrada exitosamente`,
  }
}

export const createAdminVenta = async (payload: CreateVentaPayload): Promise<CreateVentaResponse> => {
  const { data } = await api.post<CreateVentaResponse>('/admin/venta/', payload)
  return data
}

export const getAdminVentas = async (filters?: AdminVentaFilters): Promise<VentaListResponse['data']> => {
  const { data } = await api.get<VentaListResponse>('/admin/venta/', {
    params: filters,
  })
  return data.data
}

export const getAdminVentaById = async (id: number): Promise<Venta> => {
  const { data } = await api.get<ApiResponse<Venta>>(`/admin/venta/${id}/`)
  return data.data
}

export const patchEstadoVenta = async (id: number, estado: string): Promise<void> => {
  await api.patch(`/admin/venta/cambio_estado_venta/${id}/`, null, {
    params: { estado },
  })
}
