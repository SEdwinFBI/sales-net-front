/**
 * Precios y descuentos por usuario (sucursal).
 *
 * Los descuentos siempre son montos en quetzales por unidad, nunca porcentaje.
 * - Regla individual: primer tier que cubra la cantidad de la linea aplica
 *   (multiples rangos configurables por variante).
 * - Regla mayorista: se activa por el total de unidades del carrito (tiers
 *   por usuario); cada tier deriva el monto del primer descuento individual
 *   o usa el descuento mayorista configurado en la variante.
 */

/** Un tier de descuento individual para una variante. */
export type IndividualTier = {
  unidades_min: number
  unidades_max: number | null
  descuento: number
}

/** Config efectiva de una variante para un usuario (respuesta del backend). */
export type UserVariantPricing = {
  id_variante: number
  id_articulo: number
  articulo: string
  id_talla: number
  talla: string
  precio_base: number
  precio_override: number | null
  precio_efectivo: number
  individual_tiers: IndividualTier[]
  descuento_mayorista: number | null
  tiene_config: boolean
  es_default: boolean
}

export type SaveUserPricingItem = {
  id_variante: number
  precio?: number | null
  individual_tiers?: IndividualTier[]
  descuento_mayorista?: number | null
  activo?: boolean
}

export type SaveUserPricingPayload = {
  userId: number
  items: SaveUserPricingItem[]
}

/** Tier de mayoreo: rango sobre el total de unidades del carrito. */
export type MayoreoTier = {
  unidades_min: number
  unidades_max: number | null
  /** Factor sobre el descuento individual (ej. "0.5"). Solo lo usa el backend
   *  para derivar el monto; la UI únicamente muestra el Q resultante. */
  factor_individual: string
  /** true => usa el descuento mayorista en Q configurado en la variante. */
  usar_descuento_articulo: boolean
}

export type MayoreoTiersResponse = {
  tiers: MayoreoTier[]
  es_default: boolean
}

export type SaveMayoreoTiersPayload = {
  userId: number
  tiers: MayoreoTier[]
}

/** Config efectiva del usuario autenticado para el POS. */
export type EffectivePricingConfig = {
  variantes: UserVariantPricing[]
  tiers: MayoreoTier[]
  es_default_tiers: boolean
}

export type CotizacionLinea = {
  id_variante: number
  cantidad: number
  precio_bruto: number
  descuento_unitario: number
  tipo_descuento: DiscountType
  monto: number
}

export type CotizacionResponse = {
  lineas: CotizacionLinea[]
  total: number
}

export type DiscountType = 'INDIVIDUAL' | 'MAYORISTA' | 'NINGUNO'
