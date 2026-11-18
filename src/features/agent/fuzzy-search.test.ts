import { describe, expect, it } from 'vitest'
import { candidatePrefixes, phoneticKey, rankBySimilarity, significantWords, similarity } from './fuzzy-search'

const articulos = [
  { id: 1, name: 'Marcador con Brich' },
  { id: 2, name: 'Marcador permanente' },
  { id: 3, name: 'Camisa tipica' },
  { id: 4, name: 'Huipil bordado' },
]
const nombres = (items: { name: string }[]) => items.map((i) => i.name)

describe('fuzzy-search', () => {
  it('la clave fonetica junta lo que el dictado confunde', () => {
    expect(phoneticKey('bridge')).toBe(phoneticKey('Brich'))
    expect(phoneticKey('vasquez')).toBe(phoneticKey('basques'))
    expect(phoneticKey('huipil')).toBe(phoneticKey('uipil'))
  })

  it('"marcador con bridge" sugiere primero el Marcador con Brich', () => {
    expect(nombres(rankBySimilarity(articulos, (a) => a.name, 'marcador con bridge'))[0]).toBe('Marcador con Brich')
  })

  it('una sola palabra mal dictada tambien encuentra el articulo', () => {
    expect(nombres(rankBySimilarity(articulos, (a) => a.name, 'bridge'))).toEqual(['Marcador con Brich'])
  })

  it('ignora acentos, mayusculas y conectores', () => {
    expect(similarity('CAMISA TÍPICA', 'Camisa tipica')).toBe(1)
    expect(significantWords('el marcador con la tinta')).toEqual(['marcador', 'tinta'])
  })

  it('no sugiere lo que no se parece', () => {
    expect(rankBySimilarity(articulos, (a) => a.name, 'zapato')).toEqual([])
  })

  it('limita las sugerencias y no repite ids', () => {
    const repetidos = [...articulos, articulos[0], articulos[1]]
    const result = rankBySimilarity(repetidos, (a) => a.name, 'marcador', { limit: 5 })
    expect(result.map((a) => a.id)).toEqual([1, 2])
    expect(rankBySimilarity(articulos, (a) => a.name, 'marcador', { limit: 1 })).toHaveLength(1)
  })

  it('prefijos de 3 letras para traer candidatos del servidor', () => {
    expect(candidatePrefixes('marcador con bridge')).toEqual(['mar', 'bri'])
    expect(candidatePrefixes('a b')).toEqual([])
  })
})
