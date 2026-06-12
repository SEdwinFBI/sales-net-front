import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useSalesStore } from '../store/useSalesStore'

const ClearCartDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={activeDialog === 'clear-cart'}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vaciar carrito</DialogTitle>
          <DialogDescription>
            Esta accion eliminara todos los productos agregados a la venta.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clearCart()
              closeDialog()
            }}
          >
            Vaciar carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClearCartDialog
