export type SalesDialog = 'checkout' | 'clear-cart' | null

export type ProductVariant = {
  id: string
  size: string
  stock: number
  price: number
}

export type Product = {
  id: string
  name: string
  category: string
  variants: ProductVariant[]
  image: string
}

export type CartItem = {
  id: string
  productId: string
  name: string
  category: string
  image: string
  variantId: string
  size: string
  price: number
  stock: number
  qty: number
}
