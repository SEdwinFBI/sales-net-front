import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StockLevelMeter from './StockLevelMeter'
import { LOW_STOCK_THRESHOLD } from '@/lib/stock-status'
import ProductCard from './ProductCard'

describe('medidor de stock general del POS', () => {
  it('no muestra la barra si no se ha habilitado su visibilidad', () => {
    const html = renderToStaticMarkup(<ProductCard item={{
      id: 1, name: 'Fajas', category: 'Ropa', image: null,
      variants: [{ id: 1, size: '1', stock: 10, price: 45 }],
    }} />)
    expect(html).not.toContain('Stock general:')
    expect(html).toContain('Fajas')
  })
  it('la tarjeta muestra la suma de todas las tallas, no solo una variante', () => {
    const html = renderToStaticMarkup(<ProductCard showStockMeter item={{
      id: 1, name: 'Fajas', category: 'Ropa', image: null,
      variants: [
        { id: 1, size: '1', stock: 0, price: 45 },
        { id: 2, size: '2', stock: 15, price: 45 },
        { id: 3, size: '3', stock: 10, price: 45 },
      ],
    }} />)
    expect(html).toContain('Stock general: 25 unidades. Disponible.')
    expect(html).toContain('bg-emerald-500')
  })
  it.each([
    [0, 'Sin stock', 'bg-red-500'],
    [1, 'Stock bajo', 'bg-amber-400'],
    [LOW_STOCK_THRESHOLD, 'Stock bajo', 'bg-amber-400'],
    [LOW_STOCK_THRESHOLD + 1, 'Disponible', 'bg-emerald-500'],
    [40, 'Disponible', 'bg-emerald-500'],
  ])('comunica el estado para %i unidades sin alterar los umbrales', (quantity, label, color) => {
    const html = renderToStaticMarkup(<StockLevelMeter quantity={quantity} />)
    expect(html).toContain(`Stock general: ${quantity} unidades. ${label}`)
    expect(html).toContain(`h-2 rounded-full ${color}"`)
    expect(html).toContain('role="img"')
    expect(html).toContain(quantity === 1 ? 'unidad en total' : 'unidades en total')
    expect(html).not.toContain('grid-cols-3')
  })
})
