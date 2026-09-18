import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import PreciosClienteTable from '@/features/customers/components/PreciosClienteTable'
import { useSalesStore } from '../store/useSalesStore'
import { useCustomers } from '@/features/customers'
import { Tag } from 'lucide-react'

type Props = {
  open?: boolean
  onClose?: () => void
  customerId?: number
  customerName?: string
}

export default function CustomerPricesViewDialog({
  open: propOpen,
  onClose: propOnClose,
  customerId: propCustomerId,
  customerName: propCustomerName,
}: Props = {}) {
  const activeDialog = useSalesStore((state) => state.activeDialog)
  const closeDialog = useSalesStore((state) => state.closeDialog)
  const storeCustomerId = useSalesStore((state) => state.selectedCustomerId)

  const isControlled = propOpen !== undefined
  const open = isControlled ? propOpen : activeDialog === 'customer-prices'
  const handleClose = propOnClose ?? closeDialog

  const effectiveCustomerId = propCustomerId ?? (storeCustomerId ? Number(storeCustomerId) : 0)

  const { data: customers } = useCustomers({ pageSize: 50 })
  const storeCustomerObj = customers?.find((c) => String(c.id) === storeCustomerId)
  const effectiveCustomerName = propCustomerName ?? storeCustomerObj?.name ?? 'Cliente'

  return (
    <Dialog
      disablePointerDismissal
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto w-[96vw] sm:max-w-4xl lg:max-w-6xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Tag className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">Precios pactados del cliente</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {effectiveCustomerId
                  ? `Precios especiales guardados para ${effectiveCustomerName}`
                  : 'Precios especiales guardados'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          {effectiveCustomerId ? (
            <PreciosClienteTable
              customerId={effectiveCustomerId}
              customerName={effectiveCustomerName}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona un cliente para ver sus precios especiales.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

