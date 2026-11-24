import type { ReporteCobrosUsuario, ReporteCobroCliente } from '../types/reportes'

/**
 * Filas de cliente a expandir bajo un usuario. Si el reporte ya trae
 * `clientes` se usa tal cual; si sólo trae `cobros` sueltos (reportes
 * filtrados por fecha), se agrupan aquí por cliente para armar la misma forma.
 */
export function getClienteRows(row: ReporteCobrosUsuario): ReporteCobroCliente[] {
  if (row.clientes) return row.clientes

  const grouped = new Map<number, ReporteCobroCliente & { ventaIds: Set<number> }>()

  for (const cobro of row.cobros ?? []) {
    const current = grouped.get(cobro.cliente.id)
    if (current) {
      current.total_cobrado += Number(cobro.monto ?? 0)
      current.saldo_restante = Number(current.saldo_restante ?? 0) + Number(cobro.saldo_restante ?? 0)
      current.balance = cobro.cliente.balance ?? current.balance
      current.cantidad_cobros = Number(current.cantidad_cobros ?? 0) + 1
      current.ventaIds.add(cobro.id_venta)
      current.ventas_afectadas = current.ventaIds.size
      continue
    }

    grouped.set(cobro.cliente.id, {
      id_cliente: cobro.cliente.id,
      nombre_completo: cobro.cliente.nombre_completo,
      total_cobrado: Number(cobro.monto ?? 0),
      saldo_restante: Number(cobro.saldo_restante ?? 0),
      balance: cobro.cliente.balance,
      cantidad_cobros: 1,
      ventas_afectadas: 1,
      ventaIds: new Set([cobro.id_venta]),
    })
  }

  return [...grouped.values()].map((cliente) => ({
    id_cliente: cliente.id_cliente,
    nombre_completo: cliente.nombre_completo,
    total_cobrado: cliente.total_cobrado,
    saldo_restante: cliente.saldo_restante,
    balance: cliente.balance,
    cantidad_cobros: cliente.cantidad_cobros,
    ventas_afectadas: cliente.ventas_afectadas,
  }))
}
