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
  nombre?: string
  lugar?: string
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
  total_bruto: number
  total_neto: number
  total_descuento: number
  cantidad_total: number
  total_ventas: number
}

export interface ReporteVentaItem {
  id_variante: number
  id_talla: number
  id_articulo: number
  articulo: string
  talla: string
  unidades: number
  precio_promedio: number
  total_bruto: number
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
  tipo_descuento?: 'INDIVIDUAL' | 'MAYORISTA' | 'NINGUNO'
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
  total_bruto: number
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
  precio_promedio: number
  unidades: number
  total_bruto: number
  descuento_total: number
  total_neto: number
}

export interface DashboardData {
  periodo: string
  resumen: {
    total_bruto: number
    total_neto: number
    total_descuento: number
    cantidad_ventas: number
    cantidad_unidades: number
    promedio_por_venta: number
    efectivo: number
    credito: number
    total_clientes: number
    total_deudores: number
    total_adeudado: number
    total_articulos: number
    total_variantes: number
    total_vendedores: number
    stock_bajo: number
  }
  comparacion: {
    ven_semana_anterior: number
    ven_mes_anterior: number
  }
  ventas_hoy: {
    total_neto: number
    total_bruto: number
    cantidad_ventas: number
    variacion_ayer: number
  }
  ventas_por_dia: {
    fecha: string
    total_neto: number
    total_bruto: number
    cantidad_ventas: number
  }[]
  ventas_acumuladas_mes: {
    fecha: string
    acumulado: number
    acumulado_mes_anterior: number
  }[]
  top_articulos: {
    id_articulo: number
    articulo: string
    total_neto: number
    unidades: number
    variantes: number
  }[]
  top_tallas: {
    id_talla: number
    talla: string
    total_neto: number
    unidades: number
  }[]
  ventas_por_dia_semana: {
    dia: string
    total_neto: number
    cantidad_ventas: number
  }[]
  top_vendedores: {
    id_vendedor: number
    nombre: string
    total_neto: number
    total_bruto: number
    cantidad_ventas: number
  }[]
  formas_pago: {
    nombre: string
    total_neto: number
  }[]
  estados_venta: {
    estado: string
    count: number
    total_neto: number
  }[]
  stock_bajo: {
    id_variante: number
    articulo: string
    talla: string
    precio: number
    total_stock: number
    vendedores_afectados: number
  }[]
  ventas_recientes: {
    id_venta: number
    fecha: string
    cliente: string
    total_neto: number
    vendedor: string
    estado: string
    forma_pago: string
  }[]
  top_deudores: {
    id_cliente: number
    nombre: string
    telefono: string | null
    balance: number
    ultima_compra: string | null
  }[]
}

export interface ReporteDeudores {
  status: 'success'
  data: {
    clientes: {
      id: number
      nombre_completo: string
      direccion?: string | null
      telefono: string
      balance: number
      fecha_notificacion: string | null
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
