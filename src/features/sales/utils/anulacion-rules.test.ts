import { describe, expect, it } from 'vitest'
import { motivoNoAnulableAbono, puedeAnularAbono } from '@/features/customers/utils/anulacion-rules'
import { motivoNoAnulableVenta, puedeAnular, puedeAnularVenta } from './anulacion-rules'

const vendedor = (puede_anular?: boolean) => ({ role: 'vendedor' as const, puede_anular })
const admin = { role: 'admin' as const, puede_anular: false }

describe('puedeAnular', () => {
  it('el admin siempre puede, aunque puede_anular sea false', () => {
    expect(puedeAnular(admin)).toBe(true)
  })

  it('un vendedor puede salvo que se le haya quitado el permiso (false explícito)', () => {
    expect(puedeAnular(vendedor(true))).toBe(true)
    expect(puedeAnular(vendedor(undefined))).toBe(true)
    expect(puedeAnular(vendedor(false))).toBe(false)
  })

  it('sin usuario no se oculta nada (igual que antes del refactor)', () => {
    expect(puedeAnular(null)).toBe(true)
    expect(puedeAnular(undefined)).toBe(true)
  })
})

describe('puedeAnularVenta', () => {
  it.each(['PENDIENTE', 'PAGADA'] as const)('permite anular una venta %s', (estado) => {
    expect(puedeAnularVenta(vendedor(true), { estado })).toBe(true)
  })

  it.each(['CANCELADA', 'REVERTIDA', 'REVERSION'] as const)('no permite anular una venta %s', (estado) => {
    expect(puedeAnularVenta(vendedor(true), { estado })).toBe(false)
    expect(puedeAnularVenta(admin, { estado })).toBe(false)
  })

  it('exige también el permiso', () => {
    expect(puedeAnularVenta(vendedor(false), { estado: 'PAGADA' })).toBe(false)
  })
})

describe('puedeAnularAbono', () => {
  it('solo pagos reales (monto > 0) y aún no revertidos', () => {
    expect(puedeAnularAbono(vendedor(true), { monto: 100, revertido: false })).toBe(true)
    expect(puedeAnularAbono(vendedor(true), { monto: 100, revertido: true })).toBe(false)
    expect(puedeAnularAbono(vendedor(true), { monto: -100 })).toBe(false)
    expect(puedeAnularAbono(vendedor(true), { monto: 0 })).toBe(false)
  })

  it('exige también el permiso', () => {
    expect(puedeAnularAbono(vendedor(false), { monto: 100 })).toBe(false)
    expect(puedeAnularAbono(admin, { monto: 100 })).toBe(true)
  })
})

describe('motivos por los que no se puede anular (para decírselo al usuario)', () => {
  it('venta: sin permiso, estado no anulable, o null si sí se puede', () => {
    expect(motivoNoAnulableVenta(vendedor(false), { estado: 'PAGADA' })).toMatch(/permiso/)
    expect(motivoNoAnulableVenta(vendedor(true), { estado: 'REVERTIDA' })).toMatch(/REVERTIDA/)
    expect(motivoNoAnulableVenta(vendedor(true), { estado: 'PENDIENTE' })).toBeNull()
    expect(motivoNoAnulableVenta(admin, { estado: 'PAGADA' })).toBeNull()
  })

  it('el motivo coincide siempre con puedeAnularVenta', () => {
    for (const user of [admin, vendedor(true), vendedor(false), vendedor(undefined), null]) {
      for (const estado of ['PENDIENTE', 'PAGADA', 'CANCELADA', 'REVERTIDA', 'REVERSION'] as const) {
        expect(motivoNoAnulableVenta(user, { estado }) === null, `${user?.role} ${estado}`).toBe(puedeAnularVenta(user, { estado }))
      }
    }
  })

  it('abono: sin permiso, reversión, ya revertido, o null si sí se puede', () => {
    expect(motivoNoAnulableAbono(vendedor(false), { monto: 100 })).toMatch(/permiso/)
    expect(motivoNoAnulableAbono(vendedor(true), { monto: -100 })).toMatch(/reversion/)
    expect(motivoNoAnulableAbono(vendedor(true), { monto: 100, revertido: true })).toMatch(/ya fue revertido/)
    expect(motivoNoAnulableAbono(vendedor(true), { monto: 100 })).toBeNull()
  })

  it('el motivo coincide siempre con puedeAnularAbono', () => {
    for (const user of [admin, vendedor(true), vendedor(false), null]) {
      for (const abono of [{ monto: 100 }, { monto: 100, revertido: true }, { monto: -1 }, { monto: 0 }]) {
        expect(motivoNoAnulableAbono(user, abono) === null).toBe(puedeAnularAbono(user, abono))
      }
    }
  })
})
