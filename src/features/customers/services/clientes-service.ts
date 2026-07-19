import { api } from '@/lib/api'
import type { ApiResponse, Cliente, CreateClientePayload, UpdateClientePayload, Abono, AbonarPayload, AbonarResponse, ComprasData, ComprasFilters, MovimientosData, MovimientosFilters, VentaEncabezadoRequest, VentaEncabezadoResponse } from '../types/clientes'

export const getClientes = async (page = 1): Promise<{ count: number; results: Cliente[] }> => {
  const { data } = await api.get<ApiResponse<Cliente[] | { count: number; results: Cliente[] }>>('/admin/clientes/', {
    params: { page },
  })
  if (Array.isArray(data.data)) return { count: data.data.length, results: data.data }
  return data.data
}

export const getClienteById = async (id: number): Promise<Cliente> => {
  const { data } = await api.get<ApiResponse<Cliente>>(`/admin/clientes/${id}/`)
  return data.data
}

export const createCliente = async (payload: CreateClientePayload): Promise<ApiResponse<Cliente>> => {
  const { data } = await api.post<ApiResponse<Cliente>>('/admin/clientes/', payload)
  return data
}

export const updateCliente = async (id: number, payload: UpdateClientePayload): Promise<ApiResponse<Cliente>> => {
  const { data } = await api.put<ApiResponse<Cliente>>(`/admin/clientes/${id}/`, payload)
  return data
}

export const deleteCliente = async (id: number): Promise<ApiResponse<string>> => {
  const { data } = await api.delete<ApiResponse<string>>(`/admin/clientes/${id}/`)
  return data
}

export const getAbonosHistorial = async (idCliente: number): Promise<Abono[]> => {
  const { data } = await api.get<ApiResponse<Abono[]>>(`/abonos/${idCliente}/historial`)
  return data.data
}

export const abonarVenta = async (idVenta: number, idCliente: number, payload: AbonarPayload): Promise<AbonarResponse> => {
  const { data } = await api.post<AbonarResponse>(`/abonos/${idVenta}/${idCliente}/abonar`, payload)
  return data
}

export const getComprasCliente = async (idCliente: number, filters?: ComprasFilters): Promise<ComprasData> => {
  const { data } = await api.get<ApiResponse<ComprasData>>(`/abonos/${idCliente}/compras`, { params: filters })
  return data.data
}

export const getMovimientosCliente = async (idCliente: number, filters?: MovimientosFilters): Promise<MovimientosData> => {
  const { data } = await api.get<ApiResponse<MovimientosData>>(`/clientes/${idCliente}/movimientos`, { params: filters })
  return data.data
}

export const createVentaEncabezado = async (payload: VentaEncabezadoRequest): Promise<VentaEncabezadoResponse> => {
  const { data } = await api.post<VentaEncabezadoResponse>('/admin/venta/creacionEncabezado/', payload)
  return data
}
