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
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

const ClearCartDialog = () => {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const clearCart = useSalesStore((state) => state.clearCart)
  const closeDialog = useSalesStore((state) => state.closeDialog)
  const voiceResetFn = useSalesStore((state) => state.voiceResetFn)
  const totalItems = useSalesStore((state) => state.items.length)

  const vaciar = () => {
    clearCart()
    voiceResetFn?.()
    closeDialog()
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Vaciar carrito» tras un clic de confirmación.
  useAgentTools(
    'clear-cart-dialog',
    activeDialog === 'clear-cart'
      ? [
          commitTool({
            name: 'confirmar_vaciar_carrito',
            description: 'Presiona Vaciar carrito en la confirmacion abierta.',
            texto: () => `Vaciar el carrito (${totalItems} producto(s))`,
            run: async () => {
              vaciar()
              return true
            },
          }),
        ]
      : null,
  )

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
            onClick={vaciar}
          >
            Vaciar carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClearCartDialog
