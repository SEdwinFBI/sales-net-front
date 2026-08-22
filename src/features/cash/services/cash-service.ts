import { api } from '@/lib/api'
import type { Caja, CajaFilters, TipoMovimientoCaja } from '../types/cash'

type ApiResponse<T> = { status: string; data: T }

export async function getMiCaja() {
  const { data } = await api.get<ApiResponse<Caja>>('/cajas/mia')
  return data.data
}

export async function createMovimientoCaja(payload: { tipo: TipoMovimientoCaja; monto: number; observacion: string }) {
  const { data } = await api.post<ApiResponse<Caja>>('/cajas/mia', payload)
  return data.data
}

export async function getCajas(filters: CajaFilters) {
  const { data } = await api.get<ApiResponse<Caja[]>>('/cajas', { params: filters })
  return data.data
}

export async function getCaja(id: number) {
  const { data } = await api.get<ApiResponse<Caja>>(`/cajas/${id}`)
  return data.data
}
