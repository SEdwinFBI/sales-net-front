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
import VentaFotoCapture from './VentaFotoCapture'
import { useCustomers } from '@/features/customers'
import { useCreateSale } from '../hooks/useCreateSale'
import { formatCurrency } from '@/helpers/money'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'
import { useDeferredValue, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotizarCarrito } from '@/features/catalog/services/pricing-service'
import type { PaymentMethod } from '../types/sales'
import { Wallet, CreditCard, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/features/core/store/auth-store'
import QuickClienteDialog from '@/features/customers/components/QuickClienteDialog'


const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

const CheckoutDialog = () => {
  const userId = useAuthStore((state) => state.user?.id)
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const items = useSalesStore((state) => state.items)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)
  const openDialog = useSalesStore((state) => state.openDialog)
  const setLastSale = useSalesStore((state) => state.setLastSale)
  const voiceTranscript = useSalesStore((state) => state.voiceTranscript)
  const voiceResetFn = useSalesStore((state) => state.voiceResetFn)
  const ventaFoto = useSalesStore((state) => state.ventaFoto)
  const setVentaFoto = useSalesStore((state) => state.setVentaFoto)

  const storeCustomerId = useSalesStore((state) => state.selectedCustomerId)
  const setStoreCustomerId = useSalesStore((state) => state.setSelectedCustomerId)
  const customerPricingEnabled = useSalesStore((state) => state.customerPricingEnabled)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const [customerSearch, setCustomerSearch] = useState('')
  const deferredCustomerSearch = useDeferredValue(customerSearch.trim())
  const { data: customers, isLoading } = useCustomers({
    search: deferredCustomerSearch,
    activeOnly: true,
    pageSize: 50,
  })
  const { mutateAsync: createSale, isPending } = useCreateSale()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [selectedCustomerId, setSelectedCustomerId] = useState(storeCustomerId)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  // Cotización del servidor para confirmar el total antes
  // de cobrar
  const detalles = items.map((item) => ({ id_variante: item.variantId, cantidad: item.qty }))
  const activeClienteId = customerPricingEnabled && selectedCustomerId ? Number(selectedCustomerId) : null
  const { data: cotizacion, isFetching: isQuoting, isError: quoteError, refetch: retryQuote } = useQuery({
    queryKey: ['pricing', 'cotizar', userId, detalles, activeClienteId],
    queryFn: () => cotizarCarrito(detalles, activeClienteId),
    enabled: activeDialog === 'checkout' && items.length > 0,
    staleTime: 0,
  })
  const serverTotal = cotizacion?.total
  const evidenciaFotografica = cotizacion?.evidencia_fotografica ?? true
  const totalsDiffer = serverTotal !== undefined && Math.abs(serverTotal - total) >= 0.01

  useEffect(() => {
    if (activeDialog === 'checkout' && storeCustomerId && !selectedCustomerId) {
      setSelectedCustomerId(storeCustomerId)
    }
  }, [activeDialog, storeCustomerId, selectedCustomerId])

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id)
    setStoreCustomerId(id)
  }

  // El servidor indica si este usuario tiene habilitada la evidencia.
  const pagoValido = paymentMethod === 'efectivo' || (paymentMethod === 'credito' && selectedCustomerId)
  const canConfirm = Boolean(pagoValido && (!evidenciaFotografica || ventaFoto) && cotizacion && !isQuoting && !quoteError)

  const handleConfirm = async () => {
    if (!canConfirm) return

    try {
      const result = await createSale({
        id: new Date().getTime().toString(),
        items,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerPricingEnabled,
        total,
        observacion: voiceTranscript.trim() || undefined,
        foto: evidenciaFotografica ? ventaFoto ?? undefined : undefined,
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
        customerId: selectedCustomerId || undefined,
      })
      clearCart()
      voiceResetFn?.()
      setVentaFoto(null)
      openDialog('summary')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar la venta'))
    }
  }

  return (
    <>
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
              onChange={handleCustomerChange}
              onSearch={setCustomerSearch}
              loading={isLoading}
              onQuickCreate={() => setQuickCreateOpen(true)}
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

          {quoteError ? (
            <div className="text-sm text-destructive">
              <p>No se pudo verificar la configuración de la venta.</p>
              <Button variant="outline" onClick={() => void retryQuote()}>Reintentar</Button>
            </div>
          ) : isQuoting ? (
            <p className="text-sm text-muted-foreground">Verificando venta…</p>
          ) : evidenciaFotografica && (
            <VentaFotoCapture foto={ventaFoto} onChange={setVentaFoto} />
          )}

          {!isQuoting && !quoteError && evidenciaFotografica && pagoValido && !ventaFoto && (
            <p className="text-xs text-warning -mt-3">
              Toma la foto de entrega para confirmar la venta
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

    <QuickClienteDialog
      open={quickCreateOpen}
      onClose={() => setQuickCreateOpen(false)}
      onSuccess={(newC) => handleCustomerChange(String(newC.id))}
    />
  </>
  )
}

export default CheckoutDialog
