import { describe, expect, it } from 'vitest'
import { planMayoreoRows, planPriceEdit, rowsEqual, rowsToTiers, type DraftRow, type TierRow } from './pricing-draft'

const fila = (extra: Partial<DraftRow> = {}): DraftRow => ({
  precio: '',
  descuentoMayorista: '',
  tiers: [{ desde: '3', hasta: '', descuento: '' }],
  ...extra,
})

const errores = (plan: ReturnType<typeof planPriceEdit>) => ('errores' in plan ? plan.errores : [])

describe('planPriceEdit (precio, descuento mayorista y rangos individuales)', () => {
  it('cambia el precio y devuelve la fila con strings de input', () => {
    const plan = planPriceEdit({ precio: 15.5 }, fila(), 20)
    expect(plan).toEqual({ row: fila({ precio: '15.5' }) })
  })

  it('no toca lo que no se pidió', () => {
    const actual = fila({ precio: '10', descuentoMayorista: '2' })
    const plan = planPriceEdit({ descuento_mayorista: 3 }, actual, 20)
    expect(plan).toEqual({ row: fila({ precio: '10', descuentoMayorista: '3' }) })
    expect(actual.descuentoMayorista).toBe('2') // sin mutar la fila original
  })

  it('null vuelve a heredar el valor por defecto', () => {
    const plan = planPriceEdit({ precio: null, descuento_mayorista: null }, fila({ precio: '10', descuentoMayorista: '2' }), 20)
    expect(plan).toEqual({ row: fila() })
  })

  it('reemplaza todos los rangos y [] los quita', () => {
    const plan = planPriceEdit(
      { rangos: [{ desde: 2, hasta: 4, descuento: 3 }, { desde: 5, descuento: 5 }] },
      fila(),
      20,
    )
    expect(plan).toEqual({
      row: fila({ tiers: [{ desde: '2', hasta: '4', descuento: '3' }, { desde: '5', hasta: '', descuento: '5' }] }),
    })
    expect(planPriceEdit({ rangos: [] }, fila({ tiers: [{ desde: '2', hasta: '', descuento: '3' }] }), 20)).toEqual({ row: fila() })
  })

  describe('devuelve los errores de los schemas del formulario (nunca deja un borrador inválido)', () => {
    it('más de 2 decimales, negativos y montos fuera de rango', () => {
      expect(errores(planPriceEdit({ precio: 10.123 }, fila(), 20))[0]).toMatch(/2 decimales/)
      expect(errores(planPriceEdit({ precio: -1 }, fila(), 20))[0]).toMatch(/precio/)
      expect(errores(planPriceEdit({ descuento_mayorista: 2_000_000 }, fila(), 20))).toHaveLength(1)
      expect(errores(planPriceEdit({ precio: NaN }, fila(), 20))).toHaveLength(1)
    })

    it('un descuento mayorista mayor que el precio efectivo (variantPricingRowSchema)', () => {
      const result = errores(planPriceEdit({ descuento_mayorista: 25 }, fila(), 20)) // precio base 20
      expect(result).toHaveLength(1)
      expect(result[0]).toMatch(/descuento_mayorista: El descuento no puede superar el precio/)
    })

    it('el descuento mayorista se compara con el precio NUEVO, no con el base', () => {
      expect(errores(planPriceEdit({ precio: 50, descuento_mayorista: 25 }, fila(), 20))).toEqual([])
      expect(errores(planPriceEdit({ precio: 10, descuento_mayorista: 15 }, fila(), 20))).toHaveLength(1)
    })

    it('un descuento por rango mayor que el precio', () => {
      const result = errores(planPriceEdit({ rangos: [{ desde: 2, descuento: 30 }] }, fila(), 20))
      expect(result[0]).toMatch(/rangos\[0\]\.descuento: El descuento .* no puede superar el precio/)
    })

    it('rangos solapados o con un tope menor al inicio (validateTiers)', () => {
      const solapados = errores(
        planPriceEdit({ rangos: [{ desde: 1, hasta: 5, descuento: 2 }, { desde: 4, hasta: 8, descuento: 3 }] }, fila(), 20),
      )
      expect(solapados.some((e) => /Se solapa/.test(e))).toBe(true)
      const invertido = errores(planPriceEdit({ rangos: [{ desde: 5, hasta: 3, descuento: 2 }] }, fila(), 20))
      expect(invertido.some((e) => /"Hasta" debe ser/.test(e))).toBe(true)
    })

    it('solo el último rango puede quedar sin límite', () => {
      const result = errores(
        planPriceEdit({ rangos: [{ desde: 1, descuento: 2 }, { desde: 5, descuento: 3 }] }, fila(), 20),
      )
      expect(result.some((e) => /Solo el último rango/.test(e))).toBe(true)
    })

    it('argumentos de rango mal formados', () => {
      for (const rangos of [
        [{ desde: 0, descuento: 2 }],
        [{ desde: 1.5, descuento: 2 }],
        [{ desde: 1, hasta: 0, descuento: 2 }],
        [{ desde: 1, descuento: 0 }],
        [{ desde: 1, descuento: -3 }],
        [{ desde: 1, descuento: 2.555 }],
        [null],
        'no es lista',
        Array.from({ length: 11 }, (_, i) => ({ desde: i + 1, hasta: i + 1, descuento: 1 })),
      ]) {
        expect(errores(planPriceEdit({ rangos } as never, fila(), 20)).length, JSON.stringify(rangos).slice(0, 40)).toBeGreaterThan(0)
      }
    })

    it('con errores no hay fila (no se aplica nada)', () => {
      expect(planPriceEdit({ precio: -5 }, fila(), 20)).toHaveProperty('errores')
      expect(planPriceEdit({ precio: -5 }, fila(), 20)).not.toHaveProperty('row')
    })
  })
})

describe('rowsEqual', () => {
  it('compara precio, descuento y rangos', () => {
    expect(rowsEqual(fila(), fila())).toBe(true)
    expect(rowsEqual(fila({ precio: '1' }), fila())).toBe(false)
    expect(rowsEqual(fila({ descuentoMayorista: '1' }), fila())).toBe(false)
    expect(rowsEqual(fila({ tiers: [{ desde: '3', hasta: '', descuento: '1' }] }), fila())).toBe(false)
    expect(rowsEqual(fila({ tiers: [] }), fila())).toBe(false)
  })
})

describe('planMayoreoRows y rowsToTiers (mayoreoTiersSchema)', () => {
  const MSG = (plan: ReturnType<typeof planMayoreoRows>) => ('errores' in plan ? plan.errores : [])

  it('convierte rangos válidos en filas del formulario (factor en %)', () => {
    const plan = planMayoreoRows([
      { min: 2, max: 2, modo: 'DERIVADO', factor: 50 },
      { min: 3, modo: 'DERIVADO' },
    ])
    expect(plan).toEqual({
      rows: [
        { min: '2', max: '2', sinLimite: false, modo: 'DERIVADO', factor: '50' },
        { min: '3', max: '', sinLimite: true, modo: 'DERIVADO', factor: '100' },
      ],
    })
  })

  it('MONTO_ARTICULO ignora el factor', () => {
    const plan = planMayoreoRows([{ min: 2, modo: 'MONTO_ARTICULO', factor: 40 }])
    expect(plan).toEqual({ rows: [{ min: '2', max: '', sinLimite: true, modo: 'MONTO_ARTICULO', factor: '100' }] })
  })

  it('sin_limite true gana sobre un max', () => {
    const plan = planMayoreoRows([{ min: 2, max: 9, sin_limite: true, modo: 'DERIVADO' }])
    expect('rows' in plan && plan.rows[0]).toMatchObject({ max: '', sinLimite: true })
  })

  it('devuelve los mensajes del schema: solapes, tope menor al mínimo, sin límite fuera del último', () => {
    expect(MSG(planMayoreoRows([{ min: 2, max: 5, modo: 'DERIVADO' }, { min: 4, modo: 'DERIVADO' }])).join(' ')).toMatch(/se solapan/)
    expect(MSG(planMayoreoRows([{ min: 5, max: 3, modo: 'DERIVADO' }])).join(' ')).toMatch(/tope menor al mínimo/)
    expect(MSG(planMayoreoRows([{ min: 2, modo: 'DERIVADO' }, { min: 5, modo: 'DERIVADO' }])).join(' ')).toMatch(/Solo el último rango/)
  })

  it('el factor debe estar entre 0 y 100', () => {
    expect(MSG(planMayoreoRows([{ min: 2, modo: 'DERIVADO', factor: 150 }])).join(' ')).toMatch(/factor/i)
    expect(MSG(planMayoreoRows([{ min: 2, modo: 'DERIVADO', factor: -5 }])).join(' ')).toMatch(/factor/i)
  })

  it('entradas mal formadas', () => {
    for (const rangos of [[], 'x', null, [null], [{ min: 0, modo: 'DERIVADO' }], [{ min: 2, modo: 'OTRO' }], [{ min: 2, max: 0, modo: 'DERIVADO' }]]) {
      expect(MSG(planMayoreoRows(rangos)).length, JSON.stringify(rangos)).toBeGreaterThan(0)
    }
    expect(MSG(planMayoreoRows(Array.from({ length: 11 }, (_, i) => ({ min: i + 1, max: i + 1, modo: 'DERIVADO' })))).length).toBeGreaterThan(0)
  })

  it('rowsToTiers hace la misma conversión que el botón Guardar', () => {
    const rows: TierRow[] = [
      { min: '2', max: '2', sinLimite: false, modo: 'DERIVADO', factor: '50' },
      { min: '3', max: '', sinLimite: true, modo: 'MONTO_ARTICULO', factor: '' },
    ]
    expect(rowsToTiers(rows)).toEqual([
      { unidades_min: 2, unidades_max: 2, factor_individual: '0.5', usar_descuento_articulo: false },
      { unidades_min: 3, unidades_max: null, factor_individual: '1', usar_descuento_articulo: true },
    ])
  })
})
