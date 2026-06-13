import { api } from '@/lib/api'
import type { SalesArticlesResponse, ApiResponse, Venta, SalesHistoryFilters, SubmitSalePayload, SubmitSaleResponse, CreateVentaPayload, CreateVentaResponse, AdminVentaFilters, VentaListResponse } from '../types/sales'

export const getArticles = async (page = 1, pageSize = 10, search?: string): Promise<SalesArticlesResponse> => {
  const { data } = await api.get<SalesArticlesResponse>('/sales/articles', {
    params: { page, page_size: pageSize, ...(search ? { search } : {}) },
  })
  return data
}

export const getSalesHistory = async (filters?: SalesHistoryFilters): Promise<ApiResponse<Venta[]>> => {
  const { data } = await api.get<ApiResponse<Venta[]>>('/ventas/historial', {
    params: filters,
  })
  return data
}

export const submitSale = async (payload: SubmitSalePayload): Promise<SubmitSaleResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  if (payload.paymentMethod === 'credito' && !payload.customerId) {
    throw new Error('Venta a crédito requiere un cliente')
  }
  return {
    success: true,
    saleId: `VEN-${Date.now()}`,
    message: `Venta por Q${payload.total.toFixed(2)} registrada exitosamente`,
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
