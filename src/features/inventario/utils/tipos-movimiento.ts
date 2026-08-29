import type { TipoMovimiento } from '../types/inventario'

/**
 * Opciones del filtro de tipo para los movimientos de existencias.
 * Vive fuera del componente para no romper el fast refresh (un archivo de
 * componente sólo debe exportar componentes).
 */
export const TIPOS_STOCK: { value: TipoMovimiento | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'STOCK_VENTA', label: 'Salida por venta' },
  { value: 'STOCK_RESURTIDO', label: 'Resurtido' },
  { value: 'STOCK_AJUSTE', label: 'Ajuste de stock' },
  { value: 'STOCK_CARGA_INICIAL', label: 'Carga inicial' },
]
