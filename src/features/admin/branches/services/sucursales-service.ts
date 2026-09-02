import { api } from '@/lib/api'
import type {
  CreateSucursalPayload,
  Sucursal,
  SucursalConUsuarios,
  UpdateSucursalPayload,
} from '../types/sucursal-types'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

export const getSucursales = async (): Promise<Sucursal[]> => {
  const { data } = await api.get<ApiResponse<Sucursal[]>>('/admin/sucursales/')
  return data.data
}

export const getSucursalById = async (id: number): Promise<SucursalConUsuarios> => {
  const { data } = await api.get<ApiResponse<SucursalConUsuarios>>(`/admin/sucursales/${id}/`)
  return data.data
}

export const createSucursal = async (payload: CreateSucursalPayload): Promise<Sucursal> => {
  const { data } = await api.post<ApiResponse<Sucursal>>('/admin/sucursales/', payload)
  return data.data
}

export const updateSucursal = async (payload: UpdateSucursalPayload): Promise<Sucursal> => {
  const { id, ...body } = payload
  const { data } = await api.put<ApiResponse<Sucursal>>(`/admin/sucursales/${id}/`, body)
  return data.data
}

export const deleteSucursal = async (id: number): Promise<void> => {
  await api.delete(`/admin/sucursales/${id}/`)
}

export const setAccesoUsuarioSucursal = async (
  idSucursal: number,
  idUsuario: number,
  activo: boolean,
): Promise<void> => {
  await api.patch(`/admin/sucursales/${idSucursal}/usuarios/${idUsuario}/`, { activo })
}
