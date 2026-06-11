export const LOW_STOCK_THRESHOLD = 20

export type StockStatus = 'out' | 'low' | 'available'

export function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'out'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low'

  return 'available'
}

export function getStockTextClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'text-red-600'
  if (status === 'low') return 'text-yellow-700'

  return 'text-muted-foreground'
}

export function getStockAccentBorderClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-l-red-500'
  if (status === 'low') return 'border-l-yellow-400'

  return 'border-l-primary/70'
}

export function getStockBadgeClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') {
    return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
  }

  if (status === 'low') {
    return 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
  }

  return ''
}

export function getStockInputClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-red-300 text-red-700 focus-visible:border-red-500'
  if (status === 'low') return 'border-yellow-400 text-yellow-800 focus-visible:border-yellow-500'

  return ''
}
