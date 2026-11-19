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
  if (status === 'low') return 'text-amber-700 dark:text-amber-400'

  return 'text-muted-foreground'
}

export function getStockAccentBorderClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-l-destructive'
  if (status === 'low') return 'border-l-amber-500'

  return 'border-l-primary/80'
}

export function getStockBadgeClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') {
    return 'border-destructive/25 bg-destructive/12 text-destructive line-through opacity-75 dark:border-destructive/35 dark:bg-destructive/20'
  }

  if (status === 'low') {
    return 'border-amber-500/30 bg-amber-500/14 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300'
  }

  return 'border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary'
}

export function getStockBadgeClassDrawer(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') {
    return 'border-destructive/30 bg-destructive/12 text-destructive line-through dark:bg-destructive/20'
  }

  return ''
}

export function getStockInputClass(quantity: number) {
  const status = getStockStatus(quantity)

  if (status === 'out') return 'border-destructive/45 text-destructive focus-visible:border-destructive'
  if (status === 'low') return 'border-amber-400 text-amber-800 dark:text-amber-400 focus-visible:border-amber-500'

  return ''
}
