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
import { useSalesStore } from '../store/useSalesStore'
import CustomerSelect from './CustomerSelect'
import { useCustomers } from '@/features/usuarios/hooks/useCustomers'
import { useCreateSale } from '../hooks/useCreateSale'
import { formatCurrency } from '@/helpers/money'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotizarCarrito } from '@/features/catalog/services/pricing-service'
import type { PaymentMethod } from '../types/sales'
import { Wallet, CreditCard, Loader2 } from 'lucide-react'


const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

const CheckoutDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const items = useSalesStore((state) => state.items)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)
  const openDialog = useSalesStore((state) => state.openDialog)
  const setLastSale = useSalesStore((state) => state.setLastSale)
  const voiceTranscript = useSalesStore((state) => state.voiceTranscript)
  const voiceResetFn = useSalesStore((state) => state.voiceResetFn)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const { data: customers, isLoading } = useCustomers()
  const { mutateAsync: createSale, isPending } = useCreateSale()

  // Cotización del servidor para confirmar el total antes
  // de cobrar
  const detalles = items.map((item) => ({ id_variante: item.variantId, cantidad: item.qty }))
  const { data: cotizacion } = useQuery({
    queryKey: ['pricing', 'cotizar', detalles],
    queryFn: () => cotizarCarrito(detalles),
    enabled: activeDialog === 'checkout' && items.length > 0,
    staleTime: 0,
  })
  const serverTotal = cotizacion?.total
  const totalsDiffer = serverTotal !== undefined && Math.abs(serverTotal - total) >= 0.01

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  const canConfirm = paymentMethod === 'efectivo' || (paymentMethod === 'credito' && selectedCustomerId)

  const handleConfirm = async () => {
    if (!canConfirm) return

    try {
      const result = await createSale({
        id: new Date().getTime().toString(),
        items,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        total,
        observacion: voiceTranscript.trim() || undefined,
      })
      // Snapshot ANTES de limpiar el carrito
      const customerName =
        customers?.find((c) => String(c.id) === selectedCustomerId)?.name ?? null
      setLastSale({
        idVenta: result.data.id_venta,
        total: Number(result.data.total),
        estado: result.data.estado,
        fecha: new Date().toISOString(),
        items: [...items],
        paymentMethod,
        customerName,
      })
      clearCart()
      voiceResetFn?.()
      openDialog('summary')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar la venta'))
    }
  }

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'checkout'}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar venta</DialogTitle>
          <DialogDescription>
            {totalItems} unidad{totalItems === 1 ? '' : 'es'} por{' '}
            {formatCurrency(serverTotal ?? total)}
          </DialogDescription>
          {totalsDiffer && (
            <p className="text-xs text-warning">
              El total fue verificado por el servidor ({formatCurrency(serverTotal)}).
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5 px-6">
          <div>
            <p className="text-sm font-medium mb-2">Cliente</p>
            <CustomerSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              loading={isLoading}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors cursor-pointer ${selected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                  >
                    <Icon className="size-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {paymentMethod === 'credito' && !selectedCustomerId && (
            <p className="text-xs text-warning -mt-3">
              Selecciona un cliente para venta a crédito
            </p>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Procesando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutDialog
