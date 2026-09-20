import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api-error'

const apiError = (data: unknown) => ({ isAxiosError: true, response: { data } })

describe('getApiErrorMessage', () => {
  it('does not show an HTML server error in the toast', () => {
    expect(getApiErrorMessage(apiError('<!doctype html><html><h1>Server Error (500)</h1></html>'), 'Error al guardar'))
      .toBe('Error al guardar')
  })

  it('shows the backend failure instead of the status envelope', () => {
    expect(getApiErrorMessage(apiError({ status: 'error', data: 'No se pudo guardar' }), 'Fallback'))
      .toBe('No se pudo guardar')
  })

  it('finds nested pricing validation errors after valid items', () => {
    expect(getApiErrorMessage(apiError({ status: 'error', data: [
      {}, { individual_tiers: [{ descuento: ['No puede superar el precio.'] }] },
    ] }), 'Fallback')).toBe('individual_tiers: descuento: No puede superar el precio.')
  })

  it('keeps explicit messages and plain field errors', () => {
    expect(getApiErrorMessage(apiError({ status: 'error', message: 'Sucursal no encontrada.' }), 'Fallback'))
      .toBe('Sucursal no encontrada.')
    expect(getApiErrorMessage(apiError({ precio: ['Valor invalido.'] }), 'Fallback'))
      .toBe('precio: Valor invalido.')
  })

  it('uses the fallback when only status is present', () => {
    expect(getApiErrorMessage(apiError({ status: 'error' }), 'Fallback')).toBe('Fallback')
  })
})
