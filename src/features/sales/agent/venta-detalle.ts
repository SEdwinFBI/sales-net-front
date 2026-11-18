import { MAX_READ_ROWS, limitRows } from '@/features/agent/tool-helpers'
import type { Venta } from '../types/sales'

/**
 * Detalle de una venta para el agente: los artículos que se ven al expandirla. Sin foto ni datos
 * de contacto: solo lo necesario para responder qué se vendió y por cuánto.
 */
export function describeVentaDetalle(venta: Venta) {
  const detalles = venta.detalles ?? []
  return {
    venta_id: venta.id,
    fecha: venta.fecha,
    cliente: venta.cliente_info?.nombre_completo ?? null,
    vendedor: venta.vendedor ? venta.vendedor.full_name || venta.vendedor.username : null,
    sucursal: venta.sucursal?.nombre ?? null,
    estado: venta.estado,
    forma_pago: venta.forma_pago,
    total: Number(venta.total),
    descuento: Number(venta.total_descuento),
    total_neto: Number(venta.total_neto),
    abonado: Number(venta.abonado),
    saldo: Number(venta.saldo),
    ...(venta.observacion ? { observacion: venta.observacion } : {}),
    total_articulos: detalles.length,
    ...(detalles.length > MAX_READ_ROWS ? { mostrando: MAX_READ_ROWS } : {}),
    articulos: limitRows(detalles).map((d) => ({
      articulo: d.articulo,
      talla: d.talla,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      descuento: Number(d.descuento),
      total_neto: Number(d.total_neto),
    })),
  }
}
