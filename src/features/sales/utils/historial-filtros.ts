import { formatCurrency } from '@/helpers/money'
import { formatDisplayDateTime } from '@/lib/dates'
import { crearFiltroTexto, normalizarTexto } from '@/lib/table-filters'
import type { Venta } from '../types/sales'

export { normalizarTexto }

/** Filtro por columna del historial: ve el valor crudo y lo que se muestra ("#12", "Q1,500.00", la fecha legible). */
export const filtrarPorTexto = crearFiltroTexto<Venta>({
  id: (v) => `#${v.id}`,
  fecha: (v) => formatDisplayDateTime(v.fecha),
  saldo: (v) => formatCurrency(Number(v.saldo)),
  abonado: (v) => formatCurrency(Number(v.abonado)),
  total_neto: (v) => formatCurrency(Number(v.total_neto)),
  total_descuento: (v) => formatCurrency(Number(v.total_descuento)),
  total_sin_descuento: (v) => formatCurrency(Number(v.total)),
})

/** Buscador superior: numero de venta, cliente, sucursal, vendedor u observacion. */
export const coincideBusqueda = (venta: Venta, texto: string): boolean => {
  const buscado = normalizarTexto(texto)
  if (!buscado) return true
  return (
    String(venta.id).includes(buscado) ||
    [venta.cliente_info.nombre_completo, venta.sucursal.nombre, venta.vendedor?.full_name, venta.observacion].some(
      (valor) => normalizarTexto(valor).includes(buscado),
    )
  )
}
