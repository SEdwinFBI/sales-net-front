import currency from 'currency.js'
import type {
  DiscountType,
  EffectivePricingConfig,
  IndividualTier,
  MayoreoTier,
  UserVariantPricing,
} from '@/features/catalog/types/pricing-types'
import type { CartItem } from '../types/sales'

/**
 * Motor de cálculo del POS. Réplica en cliente de la decisión por línea del
 * backend (Administracion/services/pricing.py) para dar feedback inmediato:
 *   1. INDIVIDUAL si la cantidad de la línea entra en algún tier individual
 *      de su variante (primer match, siempre prevalece).
 *   2. MAYORISTA si el total de unidades del carrito activa un tier del
 *      usuario (derivado del primer tier individual o monto del artículo).
 *   3. NINGUNO en cualquier otro caso.
 * El servidor es la autoridad final: recalcula todo al registrar la venta.
 */

export type LineDiscount = {
  tipo: DiscountType
  descuentoUnitario: number
  /** Precio efectivo por unidad (override del usuario o precio base). */
  precioUnitario: number
}

export type NextTierHint = {
  unitsMissing: number
  tier: MayoreoTier
}

export type CartPricingResult = {
  lines: Record<string, LineDiscount>
  totalUnits: number
  activeTier: MayoreoTier | null
  nextTierHint: NextTierHint | null
}

const EMPTY_RESULT: CartPricingResult = {
  lines: {},
  totalUnits: 0,
  activeTier: null,
  nextTierHint: null,
}

export function computeCartPricing(
  items: CartItem[],
  config: EffectivePricingConfig | null
): CartPricingResult {
  if (items.length === 0) return EMPTY_RESULT

  const totalUnits = items.reduce((sum, item) => sum + item.qty, 0)

  if (!config) {
    // Sin config (cargando o con error): precios del catálogo, sin descuentos.
    const lines: Record<string, LineDiscount> = {}
    for (const item of items) {
      lines[item.id] = { tipo: 'NINGUNO', descuentoUnitario: 0, precioUnitario: item.price }
    }
    return { lines, totalUnits, activeTier: null, nextTierHint: null }
  }

  const variantConfig = new Map<number, UserVariantPricing>(
    config.variantes.map((variant) => [variant.id_variante, variant])
  )
  const activeTier = findActiveTier(config.tiers, totalUnits)

  const lines: Record<string, LineDiscount> = {}
  for (const item of items) {
    lines[item.id] = resolveLine(item, variantConfig.get(item.variantId), activeTier)
  }

  return {
    lines,
    totalUnits,
    activeTier,
    nextTierHint: findNextTierHint(items, variantConfig, config.tiers, totalUnits),
  }
}

function findActiveTier(tiers: MayoreoTier[], totalUnits: number): MayoreoTier | null {
  let active: MayoreoTier | null = null
  for (const tier of tiers) {
    const coversTotal =
      tier.unidades_min <= totalUnits &&
      (tier.unidades_max === null || totalUnits <= tier.unidades_max)
    if (coversTotal && (!active || tier.unidades_min > active.unidades_min)) {
      active = tier
    }
  }
  return active
}

/** Primer tier individual que cubre la cantidad, o null. */
function firstMatchingIndividualTier(
  tiers: IndividualTier[],
  qty: number
): IndividualTier | null {
  for (const tier of tiers) {
    const inRange =
      tier.unidades_min <= qty &&
      (tier.unidades_max === null || qty <= tier.unidades_max)
    if (inRange && tier.descuento > 0) return tier
    if (inRange) break // cubre pero descuento 0 -> no aplica
  }
  return null
}

/** Descuento del primer tier individual (para mayoreo derivado). */
function firstTierDescuento(tiers: IndividualTier[]): number {
  return tiers.length > 0 ? tiers[0].descuento : 0
}

function resolveLine(
  item: CartItem,
  config: UserVariantPricing | undefined,
  activeTier: MayoreoTier | null
): LineDiscount {
  const precioUnitario = config?.precio_efectivo ?? item.price

  if (!config) {
    return { tipo: 'NINGUNO', descuentoUnitario: 0, precioUnitario }
  }

  let tipo: DiscountType = 'NINGUNO'
  let descuento = 0

  // 1. Individual: primer tier que cubre la cantidad
  const matchingTier = firstMatchingIndividualTier(config.individual_tiers, item.qty)
  if (matchingTier) {
    tipo = 'INDIVIDUAL'
    descuento = matchingTier.descuento
  } else if (activeTier) {
    // 2. Mayorista
    descuento = tierDiscount(config, activeTier)
    if (descuento > 0) tipo = 'MAYORISTA'
  }

  // Clamp: nunca precio negativo
  descuento = Math.min(descuento, precioUnitario)
  if (descuento <= 0) {
    return { tipo: 'NINGUNO', descuentoUnitario: 0, precioUnitario }
  }

  return { tipo, descuentoUnitario: descuento, precioUnitario }
}

function tierDiscount(config: UserVariantPricing, tier: MayoreoTier): number {
  if (tier.usar_descuento_articulo) {
    return config.descuento_mayorista ?? 0
  }
  return currency(firstTierDescuento(config.individual_tiers))
    .multiply(Number(tier.factor_individual))
    .value
}

/**
 * Primer tier por encima del total actual que mejoraría el descuento de al
 * menos una línea del carrito ("Agrega N unidades más y activas…").
 */
function findNextTierHint(
  items: CartItem[],
  variantConfig: Map<number, UserVariantPricing>,
  tiers: MayoreoTier[],
  totalUnits: number
): NextTierHint | null {
  const upcoming = [...tiers]
    .filter((tier) => tier.unidades_min > totalUnits)
    .sort((a, b) => a.unidades_min - b.unidades_min)

  for (const tier of upcoming) {
    const someLineImproves = items.some((item) => {
      const config = variantConfig.get(item.variantId)
      if (!config) return false
      const current = resolveLine(item, config, findActiveTier(tiers, totalUnits))
      if (current.tipo === 'INDIVIDUAL') return false
      const hypothetical = Math.min(tierDiscount(config, tier), current.precioUnitario)
      return hypothetical > current.descuentoUnitario
    })
    if (someLineImproves) {
      return { unitsMissing: tier.unidades_min - totalUnits, tier }
    }
  }

  return null
}
