import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/helpers/money'
import { useSalesStore } from '../store/useSalesStore'

const SaleSummaryDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const lastSale = useSalesStore((state) => state.lastSale)
  const closeSummary = useSalesStore((state) => state.closeSummary)

  if (!lastSale) return null

  const fecha = new Date(lastSale.fecha)
  const totalDescuento = lastSale.items.reduce(
    (sum, item) => sum + item.discount * item.qty,
    0
  )

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'summary'}
      onOpenChange={(open) => {
        if (!open) closeSummary()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <DialogTitle>¡Venta registrada!</DialogTitle>
            <DialogDescription>
              Venta #{lastSale.idVenta} · {fecha.toLocaleDateString()}{' '}
              {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6">
          {/* Cliente / pago / estado */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {lastSale.customerName && (
              <span className="text-muted-foreground">{lastSale.customerName}</span>
            )}
            <Badge variant="outline" className="capitalize">{lastSale.paymentMethod}</Badge>
            <Badge variant={lastSale.estado === 'PAGADA' ? 'default' : 'secondary'}>
              {lastSale.estado}
            </Badge>
          </div>

          <Separator />

          {/* Líneas vendidas */}
          <div className="space-y-2">
            {lastSale.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Talla {item.size} · {item.qty} × {formatCurrency(item.price)}
                    {item.discount > 0 && (
                      <span
                        className={`ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-semibold ${
                          item.discountType === 'INDIVIDUAL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        −{formatCurrency(item.discount)} c/u
                      </span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency((item.price - item.discount) * item.qty)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totales */}
          {totalDescuento > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Ahorro total</span>
              <span className="font-medium">−{formatCurrency(totalDescuento)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(lastSale.total)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={closeSummary}>
            Nueva venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SaleSummaryDialog
