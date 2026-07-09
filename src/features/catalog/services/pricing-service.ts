import { api } from '@/lib/api'
import type {
  CotizacionResponse,
  EffectivePricingConfig,
  MayoreoTiersResponse,
  SaveMayoreoTiersPayload,
  SaveUserPricingPayload,
  UserVariantPricing,
} from '../types/pricing-types'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

export const getUserPricing = async (userId: number): Promise<UserVariantPricing[]> => {
  const { data } = await api.get<ApiResponse<UserVariantPricing[]>>(
    `/admin/precios_usuario/${userId}/`
  )
  return data.data
}

export const saveUserPricing = async ({
  userId,
  items,
}: SaveUserPricingPayload): Promise<UserVariantPricing[]> => {
  const { data } = await api.put<ApiResponse<UserVariantPricing[]>>(
    `/admin/precios_usuario/${userId}/`,
    { items }
  )
  return data.data
}

export const deleteUserVariantPricing = async (
  userId: number,
  variantId: number
): Promise<void> => {
  await api.delete(`/admin/precios_usuario/${userId}/${variantId}/`)
}

export const getMayoreoTiers = async (userId: number): Promise<MayoreoTiersResponse> => {
  const { data } = await api.get<ApiResponse<MayoreoTiersResponse>>(
    `/admin/config_mayoreo/${userId}/`
  )
  return data.data
}

export const saveMayoreoTiers = async ({
  userId,
  tiers,
}: SaveMayoreoTiersPayload): Promise<MayoreoTiersResponse> => {
  const { data } = await api.put<ApiResponse<MayoreoTiersResponse>>(
    `/admin/config_mayoreo/${userId}/`,
    { tiers }
  )
  return data.data
}

/** Config efectiva del usuario autenticado, para el cálculo preview del POS. */
export const getEffectivePricing = async (): Promise<EffectivePricingConfig> => {
  const { data } = await api.get<ApiResponse<EffectivePricingConfig>>(
    '/admin/pos/config_precios/'
  )
  return data.data
}

/** Cotiza el carrito en el servidor (mismo motor que la venta, sin tocar stock). */
export const cotizarCarrito = async (
  detalles: { id_variante: number; cantidad: number }[]
): Promise<CotizacionResponse> => {
  const { data } = await api.post<ApiResponse<CotizacionResponse>>(
    '/admin/pos/cotizar/',
    { detalles }
  )
  return data.data
}
