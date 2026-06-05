import { api } from '@/lib/api'
import type {
  Articulo, CreateArticuloPayload, UpdateArticuloPayload,
  Talla, CreateTallaPayload, UpdateTallaPayload,
  Variante, CreateVariantePayload,
  StockItem, CreateStockPayload, UpdateStockPayload,
  ReglaPrecio, CreateReglaPrecioPayload, UpdateReglaPrecioPayload,
  FormaPago, CreateFormaPagoPayload, UpdateFormaPagoPayload,
} from '../types/admin-catalog-types'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

interface PaginatedData<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const normalizeList = <T>(payload: T[] | PaginatedData<T>) =>
  Array.isArray(payload) ? payload : payload.results

const getAllPages = async <T>(url: string): Promise<T[]> => {
  const firstPage = await api.get<ApiResponse<T[] | PaginatedData<T>>>(url)
  const firstData = firstPage.data.data

  if (Array.isArray(firstData)) return firstData
  if (firstData.results.length === 0) return []

  const totalPages = Math.ceil(firstData.count / firstData.results.length)
  const restPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
      api.get<ApiResponse<T[] | PaginatedData<T>>>(url, {
        params: { page: index + 2 },
      })
    )
  )

  return [
    ...firstData.results,
    ...restPages.flatMap((response) => normalizeList(response.data.data)),
  ]
}

// Artículos
export const getArticulos = async (): Promise<Articulo[]> => {
  const firstPage = await api.get<ApiResponse<Articulo[] | PaginatedData<Articulo>>>('/admin/articles/')
  const firstData = firstPage.data.data

  if (Array.isArray(firstData)) return firstData

  const totalPages = Math.ceil(firstData.count / Math.max(firstData.results.length, 1))
  const restPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
      api.get<ApiResponse<PaginatedData<Articulo>>>('/admin/articles/', {
        params: { page: index + 2 },
      })
    )
  )

  return [
    ...firstData.results,
    ...restPages.flatMap((response) => normalizeList(response.data.data)),
  ]
}

export const getArticuloById = async (id: number): Promise<Articulo> => {
  const { data } = await api.get<ApiResponse<Articulo>>(`/admin/articles/${id}/`)
  return data.data
}

export const createArticulo = async (payload: CreateArticuloPayload): Promise<Articulo> => {
  const formData = new FormData()
  formData.append('titulo', payload.titulo)
  if (payload.imagen) formData.append('imagen_url', payload.imagen)
  const { data } = await api.post<ApiResponse<Articulo>>('/admin/articles/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export const updateArticulo = async (id: number, payload: UpdateArticuloPayload): Promise<Articulo> => {
  const formData = new FormData()
  if (payload.titulo) formData.append('titulo', payload.titulo)
  if (payload.imagen) formData.append('imagen_url', payload.imagen)
  const { data } = await api.put<ApiResponse<Articulo>>(`/admin/articles/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export const deleteArticulo = async (id: number): Promise<void> => {
  await api.delete(`/admin/articles/${id}/`)
}

// Tallas
export const getTallas = async (): Promise<Talla[]> => {
  return getAllPages<Talla>('/admin/tallas/')
}

export const createTalla = async (payload: CreateTallaPayload): Promise<Talla> => {
  const { data } = await api.post<ApiResponse<Talla>>('/admin/tallas/', payload)
  return data.data
}

export const updateTalla = async (id: number, payload: UpdateTallaPayload): Promise<Talla> => {
  const { data } = await api.put<ApiResponse<Talla>>(`/admin/tallas/${id}/`, payload)
  return data.data
}

export const deleteTalla = async (id: number): Promise<void> => {
  await api.delete(`/admin/tallas/${id}/`)
}

// Variantes
export const getVariantes = async (): Promise<Variante[]> => {
  return getAllPages<Variante>('/admin/variantes/')
}

export const createVariante = async (payload: CreateVariantePayload): Promise<Variante> => {
  const { data } = await api.post<ApiResponse<Variante>>('/admin/variantes/', payload)
  return data.data
}

export const updateVariante = async (id: number, payload: Partial<CreateVariantePayload>): Promise<Variante> => {
  const { data } = await api.put<ApiResponse<Variante>>(`/admin/variantes/${id}/`, payload)
  return data.data
}

export const deleteVariante = async (id: number): Promise<void> => {
  await api.delete(`/admin/variantes/${id}/`)
}

// Stock
export const getStock = async (): Promise<StockItem[]> => {
  return getAllPages<StockItem>('/admin/stock/')
}

export const createStock = async (payload: CreateStockPayload): Promise<StockItem> => {
  const { data } = await api.post<ApiResponse<StockItem>>('/admin/stock/', payload)
  return data.data
}

export const updateStock = async (id: number, payload: UpdateStockPayload): Promise<StockItem> => {
  const { data } = await api.put<ApiResponse<StockItem>>(`/admin/stock/${id}/`, payload)
  return data.data
}

// Reglas Precio
export const getReglasPrecio = async (): Promise<ReglaPrecio[]> => {
  return getAllPages<ReglaPrecio>('/admin/reglas_precio/')
}

export const createReglaPrecio = async (payload: CreateReglaPrecioPayload): Promise<ReglaPrecio> => {
  const { data } = await api.post<ApiResponse<ReglaPrecio>>('/admin/reglas_precio/', payload)
  return data.data
}

export const updateReglaPrecio = async (id: number, payload: UpdateReglaPrecioPayload): Promise<ReglaPrecio> => {
  const { data } = await api.put<ApiResponse<ReglaPrecio>>(`/admin/reglas_precio/${id}/`, payload)
  return data.data
}

// Formas de Pago
export const getFormasPago = async (): Promise<FormaPago[]> => {
  return getAllPages<FormaPago>('/admin/forma_pago/')
}

export const createFormaPago = async (payload: CreateFormaPagoPayload): Promise<FormaPago> => {
  const { data } = await api.post<ApiResponse<FormaPago>>('/admin/forma_pago/', payload)
  return data.data
}

export const updateFormaPago = async (id: number, payload: UpdateFormaPagoPayload): Promise<FormaPago> => {
  const { data } = await api.put<ApiResponse<FormaPago>>(`/admin/forma_pago/${id}/`, payload)
  return data.data
}

export const deleteFormaPago = async (id: number): Promise<void> => {
  await api.delete(`/admin/forma_pago/${id}/`)
}
