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
import { Input } from '@/components/ui/input'
import { useSalesStore } from '../store/useSalesStore'
import CustomerSelect from './CustomerSelect'
import VentaFotoCapture from './VentaFotoCapture'
import { useCustomers } from '@/features/customers'
import { useCreateSale } from '../hooks/useCreateSale'
import { formatCurrency } from '@/helpers/money'
import { toast } from 'sonner'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'
import { buildClienteRapidoOpenTools } from '../agent/pos-dialog-tools'
import { getApiErrorMessage } from '@/lib/api-error'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'
import { useDeferredValue, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotizarCarrito } from '@/features/catalog/services/pricing-service'
import type { PaymentMethod } from '../types/sales'
import { Wallet, CreditCard, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/features/core/store/auth-store'
import QuickClienteDialog from '@/features/customers/components/QuickClienteDialog'
import { useCliente } from '@/features/customers/hooks/useCliente'


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
  const [concepto, setConcepto] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(storeCustomerId)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const { data: selectedCliente } = useCliente(activeDialog === 'checkout' ? Number(selectedCustomerId) : 0)
  const sinCredito = selectedCliente?.permitir_credito === false
  const permiteCredito = selectedCliente?.permitir_credito === true

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
    if (activeDialog === 'checkout') setSelectedCustomerId(storeCustomerId)
  }, [activeDialog, storeCustomerId])

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id)
    setStoreCustomerId(id)
  }

  // El servidor indica si este usuario tiene habilitada la evidencia.
  const pagoValido = paymentMethod === 'efectivo' || (paymentMethod === 'credito' && selectedCustomerId && permiteCredito)
  // La venta al credito exige un concepto (como el ajuste); se guarda antes de la observacion.
  const exigeConcepto = paymentMethod === 'credito'
  const conceptoValido = !exigeConcepto || concepto.trim().length > 0
  const canConfirm = Boolean(pagoValido && conceptoValido && (!evidenciaFotografica || ventaFoto) && cotizacion && !isQuoting && !quoteError)

  const handleConfirm = async (): Promise<boolean> => {
    if (!canConfirm) return false

    try {
      const result = await createSale({
        id: new Date().getTime().toString(),
        items,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerPricingEnabled,
        total,
        observacion: voiceTranscript.trim() || undefined,
        ...(exigeConcepto ? { concepto: concepto.trim() } : {}),
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
      setConcepto('')
      openDialog('summary')
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar la venta'))
      return false
    }
  }

  // Dentro del cobro, el agente abre el formulario de cliente rápido igual que el selector de cliente.
  useAgentTools(
    'cliente-rapido-abrir-cobro',
    activeDialog === 'checkout' && !quickCreateOpen
      ? buildClienteRapidoOpenTools({ bloqueo: () => (isPending ? 'La venta se esta procesando.' : null), open: () => setQuickCreateOpen(true) })
      : null,
  )

  // Con el cobro abierto, el agente puede elegir la forma de pago. Confirmar la venta solo existe con las
  // acciones de guardado activadas y tras un clic de confirmación; la foto de entrega la toma siempre el usuario.
  useAgentTools(
    'checkout-dialog',
    activeDialog === 'checkout' && !quickCreateOpen
      ? [
          {
            name: 'elegir_forma_pago',
            description: 'Elige la forma de pago del cobro abierto: efectivo o credito (credito exige un cliente con credito). No confirma la venta.',
            parameters: {
              type: 'object',
              properties: { forma: { type: 'string', enum: ['efectivo', 'credito'] } },
              required: ['forma'],
              additionalProperties: false,
            },
            validar: (args) => {
              if (args.forma !== 'efectivo' && args.forma !== 'credito') return "forma debe ser 'efectivo' o 'credito'."
              if (args.forma === 'credito' && !selectedCustomerId) return 'Para vender a credito primero hay que seleccionar un cliente.'
              return args.forma === 'credito' && !permiteCredito ? 'El cliente seleccionado no tiene credito habilitado.' : null
            },
            run: async (args) => {
              setPaymentMethod(args.forma as PaymentMethod)
              return { ok: true, data: { forma_pago: args.forma, mensaje: 'Forma de pago elegida. El usuario confirma la venta.' } }
            },
          },
          commitTool({
            name: 'confirmar_cobro',
            description: 'Confirma la venta del cobro abierto (presiona Confirmar). Si se exige foto de entrega, el usuario debe tomarla antes.',
            validar: () => {
              if (isPending) return 'La venta ya se esta procesando.'
              if (!pagoValido) return 'La forma de pago no es valida: el credito exige un cliente con credito habilitado.'
              if (!conceptoValido) return 'Falta el concepto de la venta al credito: el usuario lo escribe en el cobro.'
              if (evidenciaFotografica && !ventaFoto) return 'Falta la foto de entrega: el usuario debe tomarla en el dialogo de cobro.'
              return canConfirm ? null : 'El total aun se esta calculando o no se pudo cotizar; intenta de nuevo.'
            },
            texto: () => {
              const cliente = customers?.find((c) => String(c.id) === selectedCustomerId)?.name
              return `Confirmar la venta de ${totalItems} articulo(s) por Q${Number(serverTotal ?? total).toFixed(2)} (${paymentMethod})${cliente ? ` a ${cliente}` : ''}`
            },
            run: handleConfirm,
          }),
        ]
      : null,
  )

  return (
    <>
      <Dialog
        disablePointerDismissal
        modal
        open={activeDialog === 'checkout' && !quickCreateOpen}
        onOpenChange={(open) => {
          if (!open && !quickCreateOpen) closeDialog()
        }}
      >
      <DialogContent className="min-w-0 grid-cols-1">
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

        <div className="min-w-0 space-y-5">
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
                    aria-pressed={selected}
                    disabled={opt.value === 'credito' && Boolean(selectedCustomerId) && !permiteCredito}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-45 disabled:cursor-not-allowed ${selected
                      ? 'border-primary bg-primary/[0.08] text-primary shadow-xs'
                      : 'border-border/80 bg-muted/25 text-muted-foreground hover:border-primary/35 hover:bg-muted/50 hover:text-foreground'
                      }`}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                    )}
                    <span className={`flex size-10 items-center justify-center rounded-xl ${selected ? 'bg-primary/15 text-primary' : 'bg-card text-muted-foreground'}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {sinCredito && <p className="text-xs text-muted-foreground">Este cliente solo puede comprar al contado.</p>}
          {paymentMethod === 'credito' && !selectedCustomerId && (
            <p className="text-xs text-warning -mt-3">
              Selecciona un cliente para venta a crédito
            </p>
          )}

          {exigeConcepto && (
            <div className="space-y-1.5">
              <label htmlFor="venta-concepto" className="text-sm font-medium">Concepto</label>
              <Input
                id="venta-concepto"
                value={concepto}
                onChange={(event) => setConcepto(event.target.value)}
                placeholder="Qué se vendió…"
                maxLength={200}
              />
              {!conceptoValido && <p className="text-xs text-warning">Escribe el concepto para confirmar la venta a crédito</p>}
            </div>
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
          <Button onClick={() => { void handleConfirm() }} disabled={!canConfirm || isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Procesando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <QuickClienteDialog
      open={quickCreateOpen}
      onClose={() => setQuickCreateOpen(false)}
      onSuccess={(newC) => {
        handleCustomerChange(String(newC.id))
        setQuickCreateOpen(false)
      }}
    />
  </>
  )
}

export default CheckoutDialog
