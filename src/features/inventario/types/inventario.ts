/** Módulo del ledger genérico: qué recurso tocó el movimiento. */
export type ModuloMovimiento = 'STOCK' | 'SALDO'

/**
 * Catálogo de tipos del ledger. Agregar un proceso nuevo en el backend
 * (traslados, mermas, devoluciones) sólo requiere sumar su constante aquí.
 */
export type TipoMovimiento =
  | 'STOCK_VENTA'
  | 'STOCK_RESURTIDO'
  | 'STOCK_AJUSTE'
  | 'STOCK_CARGA_INICIAL'
  | 'SALDO_VENTA_CREDITO'
  | 'SALDO_ABONO'
  | 'SALDO_CANCELACION'
  | 'SALDO_INICIAL'
  | 'SALDO_AJUSTE'

export type UsuarioResumen = {
  id: number
  username: string
  full_name: string
}

export type DetalleMovimiento = {
  id: number
  id_variante: number | null
  id_articulo: number | null
  articulo: string | null
  talla: string | null
  id_cliente: number | null
  /** Con signo: positivo ingresa, negativo egresa. */
  cantidad: number
  /** Lo que había antes del movimiento. */
  cantidad_anterior: number
  /** Lo que quedó después. */
  cantidad_resultante: number
}

export type Movimiento = {
  id: number
  modulo: ModuloMovimiento
  modulo_display: string
  tipo: TipoMovimiento
  tipo_display: string
  fecha: string
  total: string
  total_unidades: number
  referencia: string | null
  observacion: string | null
  id_venta: number | null
  usuario_afectado: UsuarioResumen | null
  usuario_registra: UsuarioResumen | null
  cliente: { id: number; nombre_completo: string } | null
  detalles: DetalleMovimiento[]
}

export type MovimientosFilters = {
  fecha_desde?: string
  fecha_hasta?: string
  id_usuario?: number | string
  id_cliente?: number | string
  tipo?: string
  modulo?: ModuloMovimiento
  id_variante?: number | string
  page?: number
  page_size?: number
}

export type Paginacion = {
  page: number
  page_size: number
  total: number
  total_pages: number
  next: string | null
  previous: string | null
}

export type MovimientosResponse = {
  status: 'success'
  data: Movimiento[]
  pagination: Paginacion
}

export type ResumenFilaExistencias = {
  id_variante: number
  id_articulo: number
  articulo: string
  talla: string
  id_usuario: number | null
  vendedor: string
  /** Invariante: habia + entradas − salidas = hay. */
  habia: number
  entradas: number
  salidas: number
  vendido: number
  hay: number
}

export type ResumenTotales = {
  habia: number
  entradas: number
  salidas: number
  vendido: number
  hay: number
}

export type ResumenExistencias = {
  resumen: ResumenFilaExistencias[]
  totales: ResumenTotales
  filtros: {
    fecha_desde: string | null
    fecha_hasta: string | null
    id_usuario: number | null
    id_cliente: number | null
  }
}

export type ResumenFilters = {
  fecha_desde?: string
  fecha_hasta?: string
  id_usuario?: number | string
  id_cliente?: number | string
}

