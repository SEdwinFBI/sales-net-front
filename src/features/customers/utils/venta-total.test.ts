import { describe, expect, it } from 'vitest'
import type { Venta } from '@/features/sales/types/sales'
import { getVentaTotal } from './venta-total'

describe('getVentaTotal', () => {
  it('conserva el importe negativo de una venta compensatoria', () => {
    const original = { total_neto: 160, total: 200, abonado: 0, saldo: 0 } as Venta
    const reversion = { ...original, total_neto: -160, total: -200 }
    expect(getVentaTotal(reversion)).toBe(-160)
    expect(getVentaTotal(original) + getVentaTotal(reversion)).toBe(0)
  })

  it('respeta un total neto cero', () => {
    expect(getVentaTotal({ total_neto: 0, total: 100 } as Venta)).toBe(0)
  })

  it('conserva el fallback para respuestas antiguas', () => {
    expect(getVentaTotal({ total: -40 } as Venta)).toBe(-40)
    expect(getVentaTotal({ abonado: 20, saldo: 80 } as Venta)).toBe(100)
  })
})
