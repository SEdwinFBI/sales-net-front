import { describe, expect, it } from 'vitest'
import { sanitizeClienteValues } from './cliente-form-values'

describe('sanitizeClienteValues', () => {
  it('sin valores no devuelve nada', () => {
    for (const vacio of [undefined, null]) {
      expect(sanitizeClienteValues(vacio)).toEqual({ values: {}, ignorados: [], errores: [], notas: [] })
    }
  })

  it('acepta los campos válidos y limpia los textos', () => {
    const { values, errores } = sanitizeClienteValues({
      nombre_completo: '  Ana López  ',
      direccion: 'Zona 1',
      telefono: '55551234',
      permitir_credito: true,
      balance: 150.5,
      dias_notificacion: [3, 1, 3],
      activo: false,
    })
    expect(errores).toEqual([])
    expect(values).toEqual({
      nombre_completo: 'Ana López',
      direccion: 'Zona 1',
      telefono: '55551234',
      permitir_credito: true,
      balance: 150.5,
      dias_notificacion: [1, 3],
      activo: false,
    })
  })

  it('el teléfono puede llegar como número', () => {
    expect(sanitizeClienteValues({ telefono: 55551234 }).values.telefono).toBe('55551234')
  })

  it('ignora y reporta los campos que no son del formulario (como una contraseña)', () => {
    const result = sanitizeClienteValues({ nombre_completo: 'Ana', password: '1234', id: 5, is_superuser: true })
    expect(result.values).toEqual({ nombre_completo: 'Ana' })
    expect(result.ignorados.sort()).toEqual(['id', 'is_superuser', 'password'])
  })

  it('reporta tipos y rangos inválidos sin aplicarlos', () => {
    const result = sanitizeClienteValues({
      nombre_completo: '   ',
      direccion: 5,
      telefono: -1,
      permitir_credito: 'si',
      activo: 1,
      balance: -10,
      dias_notificacion: [0, 8],
    })
    expect(result.values).toEqual({})
    expect(result.errores).toHaveLength(7)
  })

  it.each([NaN, Infinity, '10', null])('rechaza balance %j', (balance) => {
    expect(sanitizeClienteValues({ balance }).errores).toHaveLength(1)
  })

  it('días de notificación: solo enteros del 1 al 7', () => {
    expect(sanitizeClienteValues({ dias_notificacion: [] }).values.dias_notificacion).toEqual([])
    expect(sanitizeClienteValues({ dias_notificacion: [1.5] }).errores).toHaveLength(1)
    expect(sanitizeClienteValues({ dias_notificacion: ['1'] }).errores).toHaveLength(1)
    expect(sanitizeClienteValues({ dias_notificacion: 3 }).errores).toHaveLength(1)
  })

  it('valores que no son un objeto son un error', () => {
    for (const malo of ['texto', 5, [1, 2]]) {
      expect(sanitizeClienteValues(malo).errores).toHaveLength(1)
    }
  })

  it('sin crédito no se aplica el balance (se guarda en 0)', () => {
    const { values, notas } = sanitizeClienteValues({ permitir_credito: false, balance: 100 })
    expect(values).toEqual({ permitir_credito: false })
    expect(notas).toHaveLength(1)
  })

  it('con balance distinto de cero el permiso de crédito no se puede cambiar', () => {
    const { values, notas } = sanitizeClienteValues(
      { permitir_credito: false, nombre_completo: 'Ana' },
      { creditoBloqueado: true },
    )
    expect(values).toEqual({ nombre_completo: 'Ana' })
    expect(notas[0]).toMatch(/balance/)
  })

  it('con crédito bloqueado el balance sí se puede editar', () => {
    expect(sanitizeClienteValues({ balance: 50 }, { creditoBloqueado: true }).values).toEqual({ balance: 50 })
  })

  it('corta los textos largos', () => {
    expect(sanitizeClienteValues({ direccion: 'x'.repeat(500) }).values.direccion).toHaveLength(200)
  })
})
