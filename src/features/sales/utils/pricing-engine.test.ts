import { describe, expect, it } from 'vitest'
import type {
  EffectivePricingConfig,
  MayoreoTier,
  UserVariantPricing,
} from '@/features/catalog/types/pricing-types'
import type { CartItem } from '../types/sales'
import { computeCartPricing } from './pricing-engine'

/**
 * Mismos casos que el backend (Administracion/tests_pricing.py), tomados del
 * doc "Regla de aplicación del descuento": variante A Q200 con individual Q30
 * (desde 3 unidades), variante B Q150 con individual Q20.
 */

const DEFAULT_TIERS: MayoreoTier[] = [
  { unidades_min: 2, unidades_max: 2, factor_individual: '0.5', usar_descuento_articulo: false },
  { unidades_min: 3, unidades_max: null, factor_individual: '1.0', usar_descuento_articulo: false },
]

function variantPricing(overrides: Partial<UserVariantPricing>): UserVariantPricing {
  return {
    id_variante: 1,
    id_articulo: 1,
    articulo: 'Camisa Polo',
    id_talla: 1,
    talla: 'M',
    precio_base: 200,
    precio_override: null,
    precio_efectivo: 200,
    individual_tiers: [],
    descuento_mayorista: null,
    tiene_config: false,
    es_default: true,
    ...overrides,
  }
}

const VARIANT_A = variantPricing({
  id_variante: 1,
  individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 30 }],
  tiene_config: true,
})
const VARIANT_B = variantPricing({
  id_variante: 2,
  talla: 'L',
  precio_base: 150,
  precio_efectivo: 150,
  individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 20 }],
  tiene_config: true,
})

function config(
  variantes: UserVariantPricing[] = [VARIANT_A, VARIANT_B],
  tiers: MayoreoTier[] = DEFAULT_TIERS
): EffectivePricingConfig {
  return { variantes, tiers, es_default_tiers: true }
}

function cartItem(overrides: Partial<CartItem>): CartItem {
  return {
    id: '1::1',
    productId: 1,
    name: 'Camisa Polo',
    category: 'Camisas',
    image: null,
    variantId: 1,
    size: 'M',
    price: 200,
    stock: 100,
    qty: 1,
    discount: 0,
    discountType: 'NINGUNO',
    ...overrides,
  }
}

describe('computeCartPricing — ejemplos del doc', () => {
  it('1 unidad en el carrito: sin descuento', () => {
    const result = computeCartPricing([cartItem({ qty: 1 })], config())
    expect(result.lines['1::1']).toMatchObject({ tipo: 'NINGUNO', descuentoUnitario: 0 })
    expect(result.activeTier).toBeNull()
  })

  it('2 unidades de la misma variante: mayorista al 50% del individual', () => {
    const result = computeCartPricing([cartItem({ qty: 2 })], config())
    expect(result.lines['1::1']).toMatchObject({ tipo: 'MAYORISTA', descuentoUnitario: 15 })
    expect(result.totalUnits).toBe(2)
  })

  it('2 variantes distintas: cada una recibe el 50% de SU descuento', () => {
    const items = [
      cartItem({ id: '1::1', variantId: 1, qty: 1 }),
      cartItem({ id: '1::2', variantId: 2, qty: 1, price: 150, size: 'L' }),
    ]
    const result = computeCartPricing(items, config())
    expect(result.lines['1::1'].descuentoUnitario).toBe(15)
    expect(result.lines['1::2'].descuentoUnitario).toBe(10)
    expect(result.lines['1::2'].tipo).toBe('MAYORISTA')
  })

  it('3 unidades de la misma variante: descuento individual completo', () => {
    const result = computeCartPricing([cartItem({ qty: 3 })], config())
    expect(result.lines['1::1']).toMatchObject({ tipo: 'INDIVIDUAL', descuentoUnitario: 30 })
  })

  it('carrito mixto de 3 unidades: mayorista al 100% para líneas sin individual', () => {
    const items = [
      cartItem({ id: '1::1', variantId: 1, qty: 2 }),
      cartItem({ id: '1::2', variantId: 2, qty: 1, price: 150 }),
    ]
    const result = computeCartPricing(items, config())
    expect(result.lines['1::1']).toMatchObject({ tipo: 'MAYORISTA', descuentoUnitario: 30 })
    expect(result.lines['1::2']).toMatchObject({ tipo: 'MAYORISTA', descuentoUnitario: 20 })
  })
})

describe('computeCartPricing — casos borde', () => {
  it('el individual prevalece sobre el mayorista', () => {
    const items = [
      cartItem({ id: '1::1', variantId: 1, qty: 3 }),
      cartItem({ id: '1::2', variantId: 2, qty: 2, price: 150 }),
    ]
    const result = computeCartPricing(items, config())
    expect(result.lines['1::1'].tipo).toBe('INDIVIDUAL')
    expect(result.lines['1::2'].tipo).toBe('MAYORISTA')
  })

  it('individual con tope superado cae a mayorista', () => {
    const variant = variantPricing({
      individual_tiers: [{ unidades_min: 3, unidades_max: 5, descuento: 30 }],
      tiene_config: true,
    })
    const result = computeCartPricing([cartItem({ qty: 6 })], config([variant]))
    expect(result.lines['1::1']).toMatchObject({ tipo: 'MAYORISTA', descuentoUnitario: 30 })
  })

  it('tier con monto del artículo usa el descuento mayorista configurado', () => {
    const variant = variantPricing({
      individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 30 }],
      descuento_mayorista: 12,
      tiene_config: true,
    })
    const tiers: MayoreoTier[] = [
      { unidades_min: 2, unidades_max: null, factor_individual: '0.5', usar_descuento_articulo: true },
    ]
    const result = computeCartPricing([cartItem({ qty: 2 })], config([variant], tiers))
    expect(result.lines['1::1']).toMatchObject({ tipo: 'MAYORISTA', descuentoUnitario: 12 })
  })

  it('tier con monto del artículo sin descuento configurado queda en NINGUNO', () => {
    const variant = variantPricing({
      individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 30 }],
      tiene_config: true,
    })
    const tiers: MayoreoTier[] = [
      { unidades_min: 2, unidades_max: null, factor_individual: '0.5', usar_descuento_articulo: true },
    ]
    const result = computeCartPricing([cartItem({ qty: 2 })], config([variant], tiers))
    expect(result.lines['1::1'].tipo).toBe('NINGUNO')
  })

  it('el descuento se clampa al precio (nunca precio negativo)', () => {
    const variant = variantPricing({
      individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 500 }],
      tiene_config: true,
    })
    const result = computeCartPricing([cartItem({ qty: 3 })], config([variant]))
    expect(result.lines['1::1'].descuentoUnitario).toBe(200)
  })

  it('variante sin config hereda el precio del catálogo sin descuento', () => {
    const result = computeCartPricing(
      [cartItem({ id: '9::9', variantId: 9, qty: 2, price: 80 })],
      config()
    )
    expect(result.lines['9::9']).toMatchObject({
      tipo: 'NINGUNO',
      descuentoUnitario: 0,
      precioUnitario: 80,
    })
  })

  it('usa el precio override del usuario como precio unitario', () => {
    const variant = variantPricing({
      precio_override: 250,
      precio_efectivo: 250,
      individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 30 }],
      tiene_config: true,
    })
    const result = computeCartPricing([cartItem({ qty: 3 })], config([variant]))
    expect(result.lines['1::1'].precioUnitario).toBe(250)
  })

  it('sin config (cargando/error) opera sin descuentos', () => {
    const result = computeCartPricing([cartItem({ qty: 3 })], null)
    expect(result.lines['1::1']).toMatchObject({ tipo: 'NINGUNO', descuentoUnitario: 0 })
  })

  it('hint del siguiente tier: agrega 1 unidad más para activar el mayorista', () => {
    const result = computeCartPricing([cartItem({ qty: 1 })], config())
    expect(result.nextTierHint).not.toBeNull()
    expect(result.nextTierHint?.unitsMissing).toBe(1)
  })

  it('sin hint cuando ninguna línea mejoraría', () => {
    const variant = variantPricing({
      individual_tiers: [{ unidades_min: 3, unidades_max: null, descuento: 0 }],
      tiene_config: true,
    })
    const result = computeCartPricing([cartItem({ qty: 1 })], config([variant]))
    expect(result.nextTierHint).toBeNull()
  })

  it('carrito vacío devuelve resultado vacío', () => {
    const result = computeCartPricing([], config())
    expect(result.totalUnits).toBe(0)
    expect(Object.keys(result.lines)).toHaveLength(0)
  })
})

describe('computeCartPricing — múltiples tiers individuales', () => {
  it('elige el primer tier que cubre la cantidad (3-5->10, 6-10->20, 11+->30)', () => {
    const variant = variantPricing({
      individual_tiers: [
        { unidades_min: 3, unidades_max: 5, descuento: 10 },
        { unidades_min: 6, unidades_max: 10, descuento: 20 },
        { unidades_min: 11, unidades_max: null, descuento: 30 },
      ],
      tiene_config: true,
    })
    expect(computeCartPricing([cartItem({ qty: 4 })], config([variant])).lines['1::1'].descuentoUnitario).toBe(10)
    expect(computeCartPricing([cartItem({ qty: 7 })], config([variant])).lines['1::1'].descuentoUnitario).toBe(20)
    expect(computeCartPricing([cartItem({ qty: 15 })], config([variant])).lines['1::1'].descuentoUnitario).toBe(30)
  })

  it('cantidad entre tiers sin cobertura cae a mayorista', () => {
    const variant = variantPricing({
      individual_tiers: [
        { unidades_min: 3, unidades_max: 5, descuento: 10 },
        { unidades_min: 8, unidades_max: 10, descuento: 20 },
      ],
      tiene_config: true,
    })
    const result = computeCartPricing([cartItem({ qty: 6 })], config([variant]))
    expect(result.lines['1::1'].tipo).toBe('MAYORISTA')
    // Derivado del primer tier (10 * factor 1.0)
    expect(result.lines['1::1'].descuentoUnitario).toBe(10)
  })
})

describe('computeCartPricing — precios pactados por cliente', () => {
  it('aplica precio pactado del cliente a 1 sola unidad ignorando tiers estándar', () => {
    // Variante 1 base 200, precio pactado 165 -> precio efectivo 165
    const customerPrices = { 1: 165 }
    const result = computeCartPricing([cartItem({ qty: 1 })], config(), customerPrices)
    expect(result.lines['1::1']).toMatchObject({
      tipo: 'CLIENTE',
      descuentoUnitario: 0,
      precioUnitario: 165,
    })
  })

  it('el precio pactado prevalece sobre el tier individual y de mayoreo', () => {
    // 5 unidades de la variante 1 normalmente tendrían individual 30, pero el cliente tiene pactado 150
    const customerPrices = { 1: 150 }
    const result = computeCartPricing([cartItem({ qty: 5 })], config(), customerPrices)
    expect(result.lines['1::1']).toMatchObject({
      tipo: 'CLIENTE',
      descuentoUnitario: 0,
      precioUnitario: 150,
    })
  })

  it('aplica precio pactado mayor al precio base de catálogo (ej. base 1.00, pactado 10.00)', () => {
    const customerPrices = { 1: 10 }
    const result = computeCartPricing([cartItem({ qty: 2, price: 1, basePrice: 1 })], config(), customerPrices)
    expect(result.lines['1::1']).toMatchObject({
      tipo: 'CLIENTE',
      descuentoUnitario: 0,
      precioUnitario: 10,
    })
  })

  it('carrito mixto: línea con precio pactado usa precio de cliente, línea sin pactar usa mayoreo normal', () => {
    const items = [
      cartItem({ id: '1::1', variantId: 1, qty: 1 }), // precio pactado 170 (base 200)
      cartItem({ id: '1::2', variantId: 2, qty: 1, price: 150, size: 'L' }), // sin precio pactado
    ]
    const customerPrices = { 1: 170 }
    const result = computeCartPricing(items, config(), customerPrices)

    // Variante 1: precio cliente fijado en 170
    expect(result.lines['1::1']).toMatchObject({
      tipo: 'CLIENTE',
      descuentoUnitario: 0,
      precioUnitario: 170,
    })

    // Variante 2: no tiene precio de cliente, pero el carrito suma 2 unidades activando mayoreo al 50%
    expect(result.lines['1::2']).toMatchObject({
      tipo: 'MAYORISTA',
      descuentoUnitario: 10,
    })
  })

  it('sin configuración efectiva, los precios pactados se respetan con el precio pactado', () => {
    const customerPrices = { 1: 180 }
    const result = computeCartPricing([cartItem({ qty: 2 })], null, customerPrices)
    expect(result.lines['1::1']).toMatchObject({
      tipo: 'CLIENTE',
      descuentoUnitario: 0,
      precioUnitario: 180,
    })
  })
})
