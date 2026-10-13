import { formatCurrency, formatNumber } from '@/helpers/money'
import type { DetalleVenta } from '../types/sales'

type Props = {
  detalles: DetalleVenta[]
  /** Observación de la venta; si se omite, la columna no se muestra. */
  observacion?: string | null
}

export default function VentaDetallesTable({ detalles, observacion }: Props) {
  const showObservacion = observacion !== undefined

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Artículo</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ancho</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cantidad</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stock restante</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Precio Bruto</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Desc. Unidad</th>
            <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tipo</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total Bruto</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total Neto</th>
            {showObservacion && <th className="text-left px-3 py-2 font-medium text-muted-foreground">Observación</th>}
          </tr>
        </thead>
        <tbody>
          {detalles.map((d) => {
            const cant = d.cantidad || 1
            const totalBrutoU = Number(d.total) / cant
            const descU = Number(d.descuento)
            const tipo = d.tipo_descuento ?? 'NINGUNO'
            return (
              <tr key={d.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2">{d.articulo}</td>
                <td className="px-3 py-2">{d.talla}</td>
                <td className="px-3 py-2 text-right">{formatNumber(d.cantidad)}</td>
                <td className="px-3 py-2 text-right">{d.stock_restante != null ? formatNumber(d.stock_restante) : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(totalBrutoU)}</td>
                <td className="px-3 py-2 text-right text-destructive">{formatCurrency(descU)}</td>
                <td className="px-3 py-2 text-center">
                  {tipo !== 'NINGUNO' ? (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${tipo === 'INDIVIDUAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tipo === 'INDIVIDUAL' ? 'Individual' : 'Mayorista'}
                    </span>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(Number(d.total))}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(d.total_neto))}</td>
                {showObservacion && <td className="px-3 py-2">{observacion || <span className="text-muted-foreground">—</span>}</td>}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/30">
            <td className="px-3 py-2 font-semibold text-xs" colSpan={7}>Total</td>
            <td className="px-3 py-2 text-right font-semibold text-xs">
              {formatCurrency(detalles.reduce((s, d) => s + Number(d.total), 0))}
            </td>
            <td className="px-3 py-2 text-right font-semibold text-xs">
              {formatCurrency(detalles.reduce((s, d) => s + Number(d.total_neto), 0))}
            </td>
            {showObservacion && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
