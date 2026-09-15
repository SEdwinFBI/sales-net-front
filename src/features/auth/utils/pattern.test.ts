import { describe, expect, it } from 'vitest'
import { appendPatternNode } from './pattern'

describe('appendPatternNode', () => {
  it('agrega puntos adyacentes en orden sin repetirlos', () => {
    expect(appendPatternNode([1, 2], 5)).toEqual([1, 2, 5])
    expect(appendPatternNode([1, 2], 1)).toEqual([1, 2])
  })
  it('incluye puntos intermedios horizontales, verticales y diagonales', () => {
    expect(appendPatternNode([1], 3)).toEqual([1, 2, 3])
    expect(appendPatternNode([1], 7)).toEqual([1, 4, 7])
    expect(appendPatternNode([9], 1)).toEqual([9, 5, 1])
  })
  it('no repite un punto intermedio ni agrega puntos fuera de la cuadrícula', () => {
    expect(appendPatternNode([5, 1], 9)).toEqual([5, 1, 9])
    expect(appendPatternNode([1], 6)).toEqual([1, 6])
    for (const node of [0, 10, 1.5, NaN]) expect(appendPatternNode([1], node)).toEqual([1])
  })
})
