import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useSalesStore } from '../hooks/useSalesStore'
import { formatCurrency } from '@/helpers/money'
import { toast } from 'sonner'


const CheckoutDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const items = useSalesStore((state) => state.items)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'checkout'}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar venta</DialogTitle>
          <DialogDescription>
            Vas a cobrar {totalItems} item{totalItems === 1 ? '' : 's'} por{' '}
            {formatCurrency(total)}.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              clearCart()
              closeDialog()
              closeCart()
              toast.success(`Se realizo la venta por ${formatCurrency(total)}`)
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckoutDialog
