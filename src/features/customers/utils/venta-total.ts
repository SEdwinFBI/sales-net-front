import type { Venta } from '@/features/sales/types/sales'

/** Total NETO de la venta (con descuentos aplicados), con fallback al total
 * bruto y al derivado de abonado + saldo para respuestas antiguas. */
export const getVentaTotal = (venta: Venta) => {
  const totalNeto = Number(venta.total_neto)
  const total = Number(venta.total)
  const totalDesdeSaldo = Number(venta.abonado) + Number(venta.saldo)

  if (totalNeto > 0) return totalNeto
  if (total > 0) return total
  return totalDesdeSaldo
}

export const formatCurrency = (value: number | string) =>
  `Q${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
