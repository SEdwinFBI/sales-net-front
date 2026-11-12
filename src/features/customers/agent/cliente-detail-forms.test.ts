import { describe, expect, it } from 'vitest'
import type { Venta } from '@/features/sales/types/sales'
import {
  sanitizeAbonoValues,
  sanitizeAjusteValues,
  sanitizeVentaClienteValues,
  ventasConSaldo,
} from './cliente-detail-forms'

const venta = (id: number, saldo: number): Venta =>
  ({ id, saldo, abonado: 0, total: saldo, total_neto: saldo, estado: 'PENDIENTE' }) as unknown as Venta

const ventas = [venta(45, 300), venta(46, 0), venta(47, 80)]

describe('sanitizeAbonoValues', () => {
  it('sin valores no devuelve nada', () => {
    expect(sanitizeAbonoValues(undefined, ventas)).toEqual({ values: {}, ignorados: [], errores: [], notas: [] })
  })

  it('acepta una venta con saldo, monto y observación', () => {
    const { values, errores } = sanitizeAbonoValues({ id_venta: 45, monto: 100, observacion: ' abono ' }, ventas)
    expect(errores).toEqual([])
    expect(values).toEqual({ idVenta: 45, monto: 100, observacion: 'abono' })
  })

  it('id_venta debe ser una venta del cliente con saldo > 0', () => {
    for (const id of [46 /* saldo 0 */, 999 /* ajena */, 'x', 0, -1, null]) {
      const { values, errores } = sanitizeAbonoValues({ id_venta: id }, ventas)
      expect(values.idVenta, String(id)).toBeUndefined()
      expect(errores, String(id)).toHaveLength(1)
    }
  })

  it('monto debe ser positivo', () => {
    for (const monto of [0, -5, '10', NaN]) expect(sanitizeAbonoValues({ monto }, ventas).errores).toHaveLength(1)
  })

  it('avisa (sin bloquear) si el monto supera el saldo de la venta', () => {
    const { values, notas } = sanitizeAbonoValues({ id_venta: 47, monto: 100 }, ventas)
    expect(values).toEqual({ idVenta: 47, monto: 100 })
    expect(notas).toHaveLength(1)
  })

  it('reporta campos ajenos', () => {
    expect(sanitizeAbonoValues({ monto: 5, usuario: 'x' }, ventas).ignorados).toEqual(['usuario'])
  })

  it('ventasConSaldo deja solo las que se pueden abonar', () => {
    expect(ventasConSaldo(ventas).map((v) => v.id)).toEqual([45, 47])
  })
})

describe('sanitizeAjusteValues', () => {
  it('acepta monto (magnitud), signo y descripción', () => {
    expect(sanitizeAjusteValues({ monto: 25.5, negativo: true, descripcion: ' error de captura ' })).toEqual({
      values: { monto: 25.5, negativo: true, descripcion: 'error de captura' },
      ignorados: [],
      errores: [],
      notas: [],
    })
  })

  it('el monto es una magnitud: un negativo se rechaza (el signo va en negativo)', () => {
    const { errores } = sanitizeAjusteValues({ monto: -10 })
    expect(errores[0]).toMatch(/negativo=true/)
  })

  it('valida tipos', () => {
    expect(sanitizeAjusteValues({ negativo: 'si', descripcion: '  ', monto: 0 }).errores).toHaveLength(3)
  })

  it('valores que no son objeto son un error', () => {
    for (const malo of ['x', 5, [1]]) expect(sanitizeAjusteValues(malo).errores).toHaveLength(1)
  })
})

describe('sanitizeVentaClienteValues', () => {
  it('acepta forma de pago, monto, observación y sucursal', () => {
    expect(
      sanitizeVentaClienteValues({ forma_pago: 'credito', monto: 150, observacion: ' fiado ', sucursal_id: 2 }).values,
    ).toEqual({ forma_pago: 'credito', monto: 150, observacion: 'fiado', sucursal_id: 2 })
  })

  it('el monto puede ser 0 (igual que el formulario) pero no negativo', () => {
    expect(sanitizeVentaClienteValues({ monto: 0 }).values.monto).toBe(0)
    expect(sanitizeVentaClienteValues({ monto: -1 }).errores).toHaveLength(1)
  })

  it('forma_pago solo efectivo o credito', () => {
    for (const malo of ['tarjeta', 'EFECTIVO', 1, null]) {
      expect(sanitizeVentaClienteValues({ forma_pago: malo }).errores, String(malo)).toHaveLength(1)
    }
  })

  it('con la lista de sucursales cargada, sucursal_id debe estar entre ellas', () => {
    expect(sanitizeVentaClienteValues({ sucursal_id: 2 }, { sucursalIds: [1, 2] }).values.sucursal_id).toBe(2)
    expect(sanitizeVentaClienteValues({ sucursal_id: 9 }, { sucursalIds: [1, 2] }).errores).toHaveLength(1)
    // sin sucursales que elegir (el diálogo no la pide): cualquier id sobra
    expect(sanitizeVentaClienteValues({ sucursal_id: 1 }, { sucursalIds: [] }).errores).toHaveLength(1)
  })

  it('sin lista conocida solo se valida que sea un entero', () => {
    expect(sanitizeVentaClienteValues({ sucursal_id: 9 }).values.sucursal_id).toBe(9)
    expect(sanitizeVentaClienteValues({ sucursal_id: 'a' }).errores).toHaveLength(1)
  })
})
