import { describe, expect, it } from 'vitest'
import { normalizeText, searchCatalogArticles } from './catalog-search'

const articles = [
  { id: 1, title: 'Camisa Polo', image: null },
  { id: 2, title: 'Pantalón Jeans', image: null },
  { id: 3, title: 'Camiseta', image: null },
]
const variants = [
  { id: 11, articleId: 1, size: 'M', sizeId: 1, price: 100 },
  { id: 12, articleId: 1, size: 'L', sizeId: 2, price: 110 },
  { id: 21, articleId: 2, size: '32', sizeId: 3, price: 200 },
]

describe('catalog-search', () => {
  it('normaliza acentos y mayúsculas', () => {
    expect(normalizeText('  PANTALÓN  ')).toBe('pantalon')
    expect(normalizeText('Camísa')).toBe('camisa')
  })

  it('filtra por título sin distinguir mayúsculas ni acentos', () => {
    expect(searchCatalogArticles(articles, variants, 'pantalon').map((a) => a.id)).toEqual([2])
    expect(searchCatalogArticles(articles, variants, 'PANTALÓN').map((a) => a.id)).toEqual([2])
    expect(searchCatalogArticles(articles, variants, 'cami').map((a) => a.id)).toEqual([1, 3])
  })

  it('devuelve id, nombre y variantes sin stock', () => {
    expect(searchCatalogArticles(articles, variants, 'polo')).toEqual([
      {
        id: 1,
        nombre: 'Camisa Polo',
        variantes: [
          { id: 11, talla: 'M', precio: 100 },
          { id: 12, talla: 'L', precio: 110 },
        ],
      },
    ])
  })

  it('un artículo sin variantes sale con la lista vacía', () => {
    expect(searchCatalogArticles(articles, variants, 'camiseta')[0].variantes).toEqual([])
  })

  it('texto vacío o sin coincidencias no devuelve nada y se respeta el límite', () => {
    expect(searchCatalogArticles(articles, variants, '   ')).toEqual([])
    expect(searchCatalogArticles(articles, variants, 'zapato')).toEqual([])
    expect(searchCatalogArticles(articles, variants, 'cami', 1)).toHaveLength(1)
  })
})
