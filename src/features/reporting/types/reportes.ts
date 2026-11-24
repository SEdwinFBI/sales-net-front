import type { DiaNotificacion } from '@/features/admin/notifications/services/horario-cobros-service'

export interface ReporteVentasFilters {
  fecha_desde?: string
  fecha_hasta?: string
  id_variante?: number
  id_sucursal?: number
  id_articulo?: number
  id_talla?: number
  output?: 'json' | 'pdf'
}

export interface ReporteDeudoresFilters {
  nombre?: string
  lugar?: string
  output?: 'json' | 'pdf'
}

export interface ReporteCobrosFilters {
  id_sucursal?: number | 'sin_sucursal'
  nombre?: string
  fecha?: string
  fecha_desde?: string
  fecha_hasta?: string
  id_usuario?: number
  output?: 'json' | 'pdf'
}

/** Totales de un origen de ventas: POS (con artículos), cliente (registradas en la ficha, solo monto) o global. */
export interface OrigenVentas {
  cantidad_ventas: number
  total_neto: number
  efectivo: number
  credito: number
}

/** El POS además trae lo que solo existe con artículos. */
export interface OrigenVentasPos extends OrigenVentas {
  total_bruto?: number
  total_descuento?: number
}

/**
 * Global = POS + cliente. Con filtro de artículo o talla `cliente` es null (esas ventas no tienen
 * artículos) y llega `nota`.
 */
export interface PorOrigen<P = OrigenVentasPos, C = OrigenVentas> {
  global: C
  pos: P
  cliente: C | null
  nota?: string
}

export interface ReporteVentas {
  status: 'success'
  data: {
    resumen: ReporteResumen
    por_variante: ReporteVentaItem[]
    por_sucursal: ReporteVentaSucursal[]
  }
}

export interface ReporteResumen {
  total_bruto: number
  total_neto: number
  total_descuento: number
  cantidad_total: number
  total_ventas: number
  /** Aditivo: los campos de arriba siguen siendo solo del POS. */
  por_origen?: PorOrigen
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
  vendedor: VendedorInfo | null
  sucursal: SucursalInfo
  cliente: ClienteInfo
  estado: 'PENDIENTE' | 'PAGADA' | 'CANCELADA'
  forma_pago: string
  observacion?: string | null
}

export interface VendedorInfo {
  id: number
  full_name: string
}

export interface SucursalInfo {
  id: number
  nombre: string
}

export interface ClienteInfo {
  id: number
  nombre_completo: string
}

export interface ReporteVentaSucursal {
  id_sucursal: number
  nombre: string
  cantidad_ventas: number
  unidades: number
  total_bruto: number
  descuento_total: number
  total_neto: number
  articulos: VendedorArticulo[]
  /** Ventas registradas en la ficha del cliente (null si el filtro las excluye). */
  total_cliente?: number | null
  cantidad_ventas_cliente?: number | null
  /** POS + cliente. */
  total_global?: number
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

export interface ComparacionOrigen {
  ven_semana_anterior: number
  ven_mes_anterior: number
}

export interface VentasHoyOrigen {
  total_neto: number
  cantidad_ventas: number
  variacion_ayer: number
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
    por_origen?: PorOrigen
    total_clientes: number
    total_deudores: number
    total_adeudado: number
    total_articulos: number
    total_variantes: number
    total_sucursales: number
    stock_bajo: number
  }
  comparacion: {
    ven_semana_anterior: number
    ven_mes_anterior: number
    por_origen?: PorOrigen<ComparacionOrigen, ComparacionOrigen>
  }
  ventas_hoy: {
    total_neto: number
    total_bruto: number
    cantidad_ventas: number
    variacion_ayer: number
    por_origen?: PorOrigen<VentasHoyOrigen, VentasHoyOrigen>
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
  top_sucursales: {
    id_sucursal: number
    nombre: string
    total_neto: number
    total_bruto: number
    cantidad_ventas: number
    total_cliente?: number | null
    cantidad_ventas_cliente?: number | null
    total_global?: number
  }[]
  formas_pago: {
    nombre: string
    total_neto: number
  }[]
  /** Formas de pago de POS + ventas del cliente. */
  formas_pago_global?: {
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
    id_sucursal: number
    sucursal: string
  }[]
  ventas_recientes: {
    id_venta: number
    fecha: string
    cliente: string
    total_neto: number
    vendedor: string | null
    sucursal: string
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
      dias_notificacion: DiaNotificacion[]
      dias_notificacion_display: string[]
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

export interface ReporteCobros {
  status: 'success'
  data: {
    resumen: {
      total_usuarios: number
      total_cobros: number
      total_abonado: number
      total_restante: number
    }
    por_sucursal: ReporteCobrosSucursal[]
    por_usuario: ReporteCobrosUsuario[]
  }
}

export interface ReporteCobrosSucursal {
  id_sucursal: number | null
  nombre: string
  total_abonado: number
  por_usuario: ReporteCobrosUsuario[]
}

export interface ReporteCobrosUsuario {
  id_usuario: number | null
  nombre: string
  username?: string
  cantidad_cobros: number
  total_abonado: number
  total_restante: number
  clientes?: ReporteCobroCliente[]
  cobros?: ReporteCobroItem[]
}

export interface ReporteCobroCliente {
  id_cliente: number
  nombre_completo: string
  total_cobrado: number
  saldo_restante?: number
  balance?: number
  cantidad_cobros?: number
  ventas_afectadas?: number
}

export interface ReporteCobroItem {
  id_abono: number
  fecha_abono: string
  id_venta: number
  monto: number
  saldo_restante: number
  cliente: {
    id: number
    nombre_completo: string
    balance?: number
  }
}
