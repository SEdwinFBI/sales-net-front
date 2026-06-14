export const LOW_STOCK_THRESHOLD = 20

export type StockStatus = 'out' | 'low' | 'available'

export function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'out'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low'

  return 'available'
}

export function getStockTextClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'text-destructive'
  if (status === 'low') return 'text-yellow-700'

  return 'text-muted-foreground'
}

export function getStockAccentBorderClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-l-destructive'
  if (status === 'low') return 'border-l-yellow-400'

  return 'border-l-primary/70'
}

export function getStockBadgeClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') {
    return 'bg-destructive/80 text-white hover:bg-destructive/80'
  }

  if (status === 'low') {
    return 'bg-orange-400/80 text-white hover:bg-orange-400/80'
  }

  return ''
}
export function getStockBadgeClassDrawer(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') {
    return 'bg-destructive/80 text-white hover:bg-destructive/80'
  }

  // if (status === 'low') {
  //   return 'bg-orange-400/80 text-white hover:bg-orange-400/80'
  // }

  return ''
}

export function getStockInputClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-destructive/40 text-destructive focus-visible:border-destructive'
  if (status === 'low') return 'border-yellow-400 text-yellow-800 focus-visible:border-yellow-500'

  return ''
}
