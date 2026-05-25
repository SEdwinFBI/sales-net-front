import type { ArticleSize } from './article-variant-types'

export type StockAssignment = {
  id: string
  sellerId: string
  variantId: string
  quantity: number
}

export type StockDraftItem = {
  variantId: string
  quantity: number
}

export type SaveSellerStockPayload = {
  sellerId: string
  items: StockDraftItem[]
}

export type StockSizeColumn = {
  size: ArticleSize
  variantId?: string
  quantity: number
}
