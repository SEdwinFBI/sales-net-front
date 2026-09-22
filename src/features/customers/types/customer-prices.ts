export interface CustomerProductPrice {
  id: string                     // Clave única: `${customerId}::${variantId}`
  customerId: number             // ID del cliente
  customerName: string           // Nombre del cliente
  variantId: number              // ID de la variante (talla/artículo)
  productId: number              // ID del artículo base
  productName: string            // Nombre descriptivo del artículo
  variantSize: string            // Talla o presentación
  precioPactado: number          // Precio unitario acordado/vendido (precio base - descuento)
  precioCatalogo: number         // Precio base de catálogo
  descuentoAplicado: number      // Descuento unitario que tuvo en la venta
  tipoDescuentoOrigen: 'INDIVIDUAL' | 'MAYORISTA' | 'MANUAL'
  fechaRegistro: string          // ISO string
  idVenta?: number               // Venta de origen opcional
}

export interface ClienteVariantePrecioResponse {
  id_variante: number
  id_articulo: number
  articulo: string
  id_talla: number
  talla: string
  sku: string
  precio_base: number
  precio_cliente: number | null
  precio_efectivo: number
  ahorro: number
  tiene_config: boolean
  fecha_actualizacion: string | null
}

export interface UpsertPrecioClienteItem {
  id_variante: number
  precio: number
  activo?: boolean
}

