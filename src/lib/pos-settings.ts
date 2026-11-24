import { api } from '@/lib/api'
import type { AppRole } from '@/features/auth/types/auth'

export interface PosSettings {
  mostrar_barras_stock_vendedores: boolean
}
const endpoint = '/admin/configuracion_pos/'

export async function getPosSettings(): Promise<PosSettings> {
  const { data } = await api.get<PosSettings>(endpoint)
  return data
}

export async function updatePosSettings(enabled: boolean): Promise<PosSettings> {
  const { data } = await api.patch<PosSettings>(endpoint, { mostrar_barras_stock_vendedores: enabled })
  return data
}

export function canShowStockMeter(role: AppRole | undefined, enabled: boolean) {
  return role === 'admin' || (role === 'vendedor' && enabled)
}
