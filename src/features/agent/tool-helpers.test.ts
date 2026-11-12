import { describe, expect, it } from 'vitest'
import {
  MAX_READ_ROWS,
  cleanText,
  isIsoDate,
  limitRows,
  matchOption,
  mergeDateRange,
  positiveInt,
  positiveNumber,
} from './tool-helpers'

describe('validadores de argumentos', () => {
  it('positiveInt: solo enteros mayores a 0', () => {
    expect(positiveInt(5)).toBe(5)
    for (const malo of [0, -1, 1.5, '5', null, undefined, NaN, Infinity]) expect(positiveInt(malo)).toBeNull()
  })

  it('positiveNumber: finitos mayores a 0', () => {
    expect(positiveNumber(0.5)).toBe(0.5)
    for (const malo of [0, -2, '3', NaN, Infinity, null]) expect(positiveNumber(malo)).toBeNull()
  })

  it('cleanText recorta, limita y rechaza vacíos', () => {
    expect(cleanText('  hola  ')).toBe('hola')
    expect(cleanText('x'.repeat(300), 10)).toBe('x'.repeat(10))
    for (const malo of ['', '   ', 5, null, undefined]) expect(cleanText(malo)).toBeNull()
  })

  it('isIsoDate exige una fecha real AAAA-MM-DD', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2028-02-29')).toBe(true) // bisiesto
    for (const mala of ['2026-02-30', '2027-02-29', '2026-13-01', '26-01-01', '2026-1-1', '', 20260101, null, '2026-01-01T00:00']) {
      expect(isIsoDate(mala), String(mala)).toBe(false)
    }
  })

  it('limitRows corta a MAX_READ_ROWS', () => {
    expect(limitRows(Array.from({ length: 100 }, (_, i) => i))).toHaveLength(MAX_READ_ROWS)
    expect(limitRows([1, 2, 3])).toEqual([1, 2, 3])
  })
})

describe('mergeDateRange (las fechas de los filtros son obligatorias)', () => {
  const actual = { fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14' }

  it('combina cambios parciales con el rango actual', () => {
    expect(mergeDateRange({ fecha_desde: '2026-10-05' }, actual)).toEqual({
      range: { fecha_desde: '2026-10-05', fecha_hasta: '2026-10-14' },
    })
    expect(mergeDateRange({ fecha_hasta: '2026-10-20' }, actual)).toEqual({
      range: { fecha_desde: '2026-10-01', fecha_hasta: '2026-10-20' },
    })
  })

  it('no acepta fechas vacías, mal formadas ni inexistentes', () => {
    for (const mala of ['', null, undefined, '2026-02-30', 'ayer', 5]) {
      expect('error' in mergeDateRange({ fecha_desde: mala }, actual), String(mala)).toBe(true)
    }
  })

  it('rechaza un rango invertido', () => {
    expect(mergeDateRange({ fecha_desde: '2026-11-01' }, actual)).toEqual({
      error: 'fecha_desde no puede ser posterior a fecha_hasta.',
    })
  })

  it('permite el mismo día en ambos extremos', () => {
    expect('range' in mergeDateRange({ fecha_desde: '2026-10-14' }, actual)).toBe(true)
  })

  it('no toca las fechas que no vienen', () => {
    expect(mergeDateRange({}, actual)).toEqual({ range: actual })
  })
})

describe('matchOption', () => {
  const opciones = ['PAGADA', 'PENDIENTE', 'Crédito']

  it('compara sin distinguir mayúsculas ni acentos y devuelve la opción canónica', () => {
    expect(matchOption(opciones, 'pagada')).toBe('PAGADA')
    expect(matchOption(opciones, ' credito ')).toBe('Crédito')
  })

  it('devuelve null si no existe o no es texto', () => {
    expect(matchOption(opciones, 'cancelada')).toBeNull()
    expect(matchOption(opciones, 5)).toBeNull()
    expect(matchOption([], 'pagada')).toBeNull()
  })
})
