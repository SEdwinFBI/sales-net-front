import { describe, expect, it } from 'vitest'
import { tierRowSchema } from './pricing-schema'

describe('rangos de descuento por artículo', () => {
  it.each(['abc', '2.5', '0', '-1'])('rechaza el tope inválido %s', (hasta) => {
    expect(tierRowSchema.safeParse({ desde: '3', hasta, descuento: '30' }).success).toBe(false)
  })

  it.each(['', '5'])('acepta un rango con tope %s', (hasta) => {
    expect(tierRowSchema.safeParse({ desde: '3', hasta, descuento: '30' }).success).toBe(true)
  })

  it('rechaza un descuento sin unidad inicial', () => {
    expect(tierRowSchema.safeParse({ desde: '', hasta: '', descuento: '30' }).success).toBe(false)
  })
})
