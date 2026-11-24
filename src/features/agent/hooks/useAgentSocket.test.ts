import { describe, expect, it } from 'vitest'
import { actionLabel } from './useAgentSocket'

describe('actionLabel', () => {
  it('nombra las consultas que ejecuta el back', () => {
    expect(actionLabel('consultar_ventas')).toBe('Consultando ventas…')
    for (const name of ['consultar_abonos', 'consultar_clientes', 'consultar_stock', 'consultar_precios_especiales', 'consultar_cajas']) {
      expect(actionLabel(name)).toMatch(/^Consultando/)
    }
  })

  it('usa el prefijo para las tools de pantalla y un texto genérico para el resto', () => {
    expect(actionLabel('filtrar_cobros')).toBe('Aplicando filtros…')
    expect(actionLabel('algo_raro')).toBe('Ejecutando…')
  })
})
