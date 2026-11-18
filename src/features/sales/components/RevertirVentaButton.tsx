import { useState } from 'react'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency } from '@/helpers/money'
import type { Venta } from '../types/sales'
import { puedeAnularVenta } from '../utils/anulacion-rules'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

/** Mutación de anulación y su aviso al usuario; la comparten el botón y el diálogo suelto. */
function useRevertirVenta(venta: Venta) {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => api.post(`/admin/venta/${venta.id}/revertir/`,
      Number(venta.abonado) > 0 ? { anular_abonos: true } : undefined),
    onSuccess: async () => {
      await Promise.all([
        queryKeys.sales.all, queryKeys.adminVentas.all, queryKeys.customers.all,
        queryKeys.inventario.all, queryKeys.adminCatalog.stock.all(), queryKeys.reporting.all,
        ['cajas'], ['caja'],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })

  /** true si se anuló; en caso contrario ya mostró el error. */
  const confirmar = async () => {
    try {
      await mutateAsync()
      toast.success('Venta revertida correctamente')
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo revertir la venta'))
      return false
    }
  }

  return { isPending, confirmar }
}

type DialogViewProps = {
  venta: Venta
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  /** true si se anuló. */
  onConfirm: () => Promise<boolean>
}

function RevertirVentaDialogView({ venta, open, onOpenChange, isPending, onConfirm }: DialogViewProps) {
  // Solo con las acciones de guardado activadas: el agente presiona «Confirmar anulación» tras un clic de confirmación.
  useAgentTools(
    `revertir-venta-${venta.id}`,
    open
      ? [
          commitTool({
            name: 'confirmar_anular_venta',
            description: 'Presiona Confirmar anulacion en el dialogo abierto para anular la venta.',
            validar: () => (isPending ? 'Ya se esta anulando.' : null),
            texto: () =>
              `Anular la venta #${venta.id} de ${formatCurrency(Number(venta.total_neto))}${Number(venta.abonado) > 0 ? ` (sus abonos de ${formatCurrency(Number(venta.abonado))} quedaran en cero)` : ''}`,
            run: onConfirm,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isPending) onOpenChange(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular venta #{venta.id}</DialogTitle>
          <DialogDescription>
            {Number(venta.abonado) > 0 && `El importe abonado a esta venta quedará en cero: se compensarán únicamente los ${formatCurrency(Number(venta.abonado))} aplicados a ella. Los pagos aplicados a otras ventas se conservarán. `}
            Se registrará una venta compensatoria de {formatCurrency(-Number(venta.total_neto))}.
            {venta.detalles.length > 0 && ' Se devolverán los productos a la sucursal de origen.'}
            {' '}Si es a crédito, se eliminará su saldo pendiente de la deuda del cliente.
            La venta y los registros de pago permanecerán en el historial.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>Volver</Button>
          <Button variant="destructive" disabled={isPending} onClick={() => { void onConfirm() }}>
            {isPending ? 'Anulando…' : 'Confirmar anulación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Diálogo de anulación controlado desde fuera (lo abre, por ejemplo, el agente). Aplica la
 * misma regla de visibilidad que el botón y sigue exigiendo el clic en «Confirmar anulación».
 */
export function RevertirVentaDialog({ venta, open, onOpenChange }: {
  venta: Venta
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const user = useAuthStore((state) => state.user)
  const { isPending, confirmar } = useRevertirVenta(venta)
  if (!puedeAnularVenta(user, venta)) return null

  return (
    <RevertirVentaDialogView
      venta={venta}
      open={open}
      onOpenChange={onOpenChange}
      isPending={isPending}
      onConfirm={() => confirmar().then((anulada) => { if (anulada) onOpenChange(false); return anulada })}
    />
  )
}

export default function RevertirVentaButton({ venta }: { venta: Venta }) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { isPending, confirmar } = useRevertirVenta(venta)
  if (!puedeAnularVenta(user, venta)) return null

  return <>
    <Button variant="destructive" size="sm" className="border border-destructive/40 font-semibold" disabled={isPending}
      onClick={() => setOpen(true)}>
      <Undo2 aria-hidden="true" />
      Anular venta
    </Button>
    <RevertirVentaDialogView
      venta={venta}
      open={open}
      onOpenChange={setOpen}
      isPending={isPending}
      onConfirm={() => confirmar().then((anulada) => { if (anulada) setOpen(false); return anulada })}
    />
  </>
}
