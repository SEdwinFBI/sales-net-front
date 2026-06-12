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
import { selectTotal, selectTotalItems } from '../utils/utilsSales'
import { useState } from 'react'
import type { PaymentMethod } from '../types/sales'
import { Wallet, CreditCard } from 'lucide-react'


const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

const CheckoutDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const items = useSalesStore((state) => state.items)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const { data: customers } = useCustomers()
  const { mutateAsync: createSale, isPending } = useCreateSale()

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
      })
      clearCart()
      closeDialog()
      closeCart()
      toast.success(result.message)
    } catch {
      toast.error('Error al registrar la venta')
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
            {totalItems} item{totalItems === 1 ? '' : 's'} por{' '}
            {formatCurrency(total)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6">
          <div>
            <p className="text-sm font-medium mb-2">Cliente</p>
            <CustomerSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
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
            <p className="text-xs text-amber-600 -mt-3">
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
            {isPending ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutDialog
