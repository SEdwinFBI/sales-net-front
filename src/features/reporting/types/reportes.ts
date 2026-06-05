import type { Venta } from '@/features/sales/types/sales'

export interface ReporteVentasFilters {
  fecha_desde?: string
  fecha_hasta?: string
  id_variante?: number
  id_vendedor?: number
  id_articulo?: number
  output?: 'json' | 'pdf'
}

export interface ReporteVentas {
  status: 'success'
  data: {
    resumen: {
      total_general: number
      cantidad_total: number
      total_descuento: number
      total_ventas: number
    }
    por_variante: {
      id_variante: number
      id_talla: number
      articulo: string
      talla: string
      unidades: number
      precio_promedio: number
      total: number
      descuento_total: number
    }[]
    por_vendedor: {
      id_vendedor: number
      nombre: string
      cantidad_ventas: number
      unidades: number
      total: number
    }[]
    detalle_ventas: Venta[]
  }
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
