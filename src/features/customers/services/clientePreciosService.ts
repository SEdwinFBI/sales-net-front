import { api } from '@/lib/api'
import type { ApiResponse } from '../types/clientes'
import type { ClienteVariantePrecioResponse, UpsertPrecioClienteItem } from '../types/customer-prices'

/**
 * Obtiene todas las variantes activas del catálogo con el precio efectivo del cliente.
 * Aquellas con precio especial devuelven tiene_config=true y precio_cliente;
 * las demás devuelven tiene_config=false y su precio_base.
 */
export const getPreciosCliente = async (
  clienteId: number,
  sucursalId?: number
): Promise<ClienteVariantePrecioResponse[]> => {
  const { data } = await api.get<ApiResponse<ClienteVariantePrecioResponse[]>>(
    `/admin/precios_cliente/${clienteId}/`,
    {
      params: sucursalId ? { id_sucursal: sucursalId } : undefined,
    }
  )
  return data.data
}

/**
 * Modifica o asigna precios pactados a una o varias variantes para un cliente.
 * Solo disponible para administradores.
 */
export const upsertPreciosCliente = async (
  clienteId: number,
  items: UpsertPrecioClienteItem[],
  sucursalId?: number
): Promise<ClienteVariantePrecioResponse[]> => {
  const { data } = await api.put<ApiResponse<ClienteVariantePrecioResponse[]>>(
    `/admin/precios_cliente/${clienteId}/`,
    { items, ...(sucursalId ? { id_sucursal: sucursalId } : {}) },
    {
      params: sucursalId ? { id_sucursal: sucursalId } : undefined,
    }
  )
  return data.data
}

/**
 * Guarda los precios pactados tras una venta para un cliente (POS o Admin).
 */
export const savePreciosPostVenta = async (
  clienteId: number,
  items: UpsertPrecioClienteItem[],
  sucursalId?: number
): Promise<ClienteVariantePrecioResponse[]> => {
  const { data } = await api.post<ApiResponse<ClienteVariantePrecioResponse[]>>(
    `/admin/precios_cliente/${clienteId}/`,
    { items, ...(sucursalId ? { id_sucursal: sucursalId } : {}) },
    {
      params: sucursalId ? { id_sucursal: sucursalId } : undefined,
    }
  )
  return data.data
}

/**
 * Elimina el precio especial de una variante para un cliente;
 * la variante vuelve a heredar su precio base de catálogo.
 * Solo disponible para administradores.
 */
export const deletePrecioCliente = async (
  clienteId: number,
  idVariante: number
): Promise<string> => {
  const { data } = await api.delete<ApiResponse<string>>(
    `/admin/precios_cliente/${clienteId}/${idVariante}/`
  )
  return data.message || 'Precio pactado eliminado'
}
