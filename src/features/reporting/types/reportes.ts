export interface ReporteVentasFilters {
  fecha_desde?: string
  fecha_hasta?: string
  id_variante?: number
  id_vendedor?: number
  id_articulo?: number
  id_talla?: number
  output?: 'json' | 'pdf'
}

export interface ReporteDeudoresFilters {
  fecha_desde?: string
  fecha_hasta?: string
  id_vendedor?: number
  id_cliente?: number
  search?: string
  saldo_min?: number
  saldo_max?: number
  output?: 'json' | 'pdf'
}

export interface ReporteVentas {
  status: 'success'
  data: {
    resumen: ReporteResumen
    por_variante: ReporteVentaItem[]
    por_vendedor: ReporteVentaVendedor[]
  }
}

export interface ReporteResumen {
  total_general: number
  cantidad_total: number
  total_descuento: number
  total_ventas: number
}

export interface ReporteVentaItem {
  id_variante: number
  id_talla: number
  id_articulo: number
  articulo: string
  talla: string
  unidades: number
  precio_unitario: number
  precio_promedio: number
  total: number
  descuento_total: number
  total_neto: number
  ventas: VentaEnVariante[]
}

export interface VentaEnVariante {
  id_venta: number
  fecha: string
  cantidad: number
  precio_unitario: number
  monto: number
  descuento: number
  vendedor: VendedorInfo
  cliente: ClienteInfo
  estado: 'PENDIENTE' | 'PAGADA' | 'CANCELADA'
  forma_pago: string
  observacion?: string | null
}

export interface VendedorInfo {
  id: number
  full_name: string
}

export interface ClienteInfo {
  id: number
  nombre_completo: string
}

export interface ReporteVentaVendedor {
  id_vendedor: number
  nombre: string
  cantidad_ventas: number
  unidades: number
  total: number
  descuento_total: number
  total_neto: number
  articulos: VendedorArticulo[]
}

export interface VendedorArticulo {
  id_variante: number
  id_talla: number
  id_articulo: number
  articulo: string
  talla: string
  precio_unitario: number
  precio_promedio: number
  unidades: number
  total: number
  descuento_total: number
  total_neto: number
}

export interface ReporteDeudores {
  status: 'success'
  data: {
    clientes: {
      id: number
      nombre_completo: string
      telefono: string
      balance: number
      ultima_compra: string | null
      total_ventas_pendientes: number
      total_abonado: number
    }[]
    resumen: {
      total_deudores: number
      total_adeudado: number
    }
  }
}
