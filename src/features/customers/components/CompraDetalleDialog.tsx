import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import VentaDetallesTable from '@/features/sales/components/VentaDetallesTable'
import type { Venta } from '@/features/sales/types/sales'
import { formatCurrency } from '@/helpers/money'
import { formatDisplayDateTime } from '@/lib/dates'
import { getVentaTotal } from '../utils/venta-total'

type Props = {
  venta: Venta | null
  onClose: () => void
}

export default function CompraDetalleDialog({ venta, onClose }: Props) {
  const estadoVariant = venta?.estado === 'PAGADA'
    ? 'default' as const
    : venta?.estado === 'CANCELADA' ? 'destructive' as const : 'secondary' as const

  return (
    <Dialog open={venta !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {venta && (
          <>
            <DialogHeader>
              <DialogTitle>Compra #{venta.id}</DialogTitle>
              <DialogDescription>
                {formatDisplayDateTime(venta.fecha)} · {venta.sucursal.nombre} · {venta.vendedor?.full_name ?? 'Sin vendedor'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold">{formatCurrency(getVentaTotal(venta))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Abonado</p>
                <p className="font-semibold text-warning">{formatCurrency(Number(venta.abonado))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo</p>
                <p className="font-semibold text-destructive">{formatCurrency(Number(venta.saldo))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge variant={estadoVariant}>{venta.estado}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Artículos</p>
              {venta.detalles.length > 0
                ? <VentaDetallesTable detalles={venta.detalles} />
                : <p className="text-sm text-muted-foreground">Esta compra no tiene artículos registrados.</p>}
            </div>

            {venta.observacion && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Observación:</span> {venta.observacion}
              </p>
            )}

            {venta.foto_url && (
              <div>
                <img
                  src={venta.foto_url}
                  alt={`Entrega de la venta ${venta.id}`}
                  loading="lazy"
                  className="max-h-60 rounded-lg border border-border object-contain"
                />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
