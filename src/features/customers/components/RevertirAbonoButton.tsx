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
import { puedeAnular } from '@/features/sales/utils/anulacion-rules'
import type { Abono } from '../types/clientes'
import { puedeAnularAbono } from '../utils/anulacion-rules'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

/** Mutación de anulación y su aviso al usuario; la comparten el botón y el diálogo suelto. */
function useRevertirAbono(abono: Abono) {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => api.post(`/abonos/${abono.id}/revertir`),
    onSuccess: () => Promise.all([
      queryKeys.customers.all, queryKeys.sales.all, queryKeys.adminVentas.all, queryKeys.reporting.all,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })

  /** true si se anuló; en caso contrario ya mostró el error. */
  const confirmar = async () => {
    try {
      await mutateAsync()
      toast.success('Abono revertido correctamente')
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo revertir el abono'))
      return false
    }
  }

  return { isPending, confirmar }
}

type DialogViewProps = {
  abono: Abono
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  /** true si se anuló. */
  onConfirm: () => Promise<boolean>
}

function RevertirAbonoDialogView({ abono, open, onOpenChange, isPending, onConfirm }: DialogViewProps) {
  // Solo con las acciones de guardado activadas: el agente presiona «Confirmar anulación» tras un clic de confirmación.
  useAgentTools(
    `revertir-abono-${abono.id}`,
    open
      ? [
          commitTool({
            name: 'confirmar_anular_abono',
            description: 'Presiona Confirmar anulacion en el dialogo abierto para anular el abono.',
            validar: () => (isPending ? 'Ya se esta anulando.' : null),
            texto: () => `Anular el abono #${abono.id} de ${formatCurrency(Number(abono.monto_pago ?? abono.monto))}: la deuda del cliente aumentara por ese importe`,
            run: onConfirm,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isPending) onOpenChange(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular abono #{abono.id}</DialogTitle>
          <DialogDescription>
            {abono.id_movimiento
              ? 'Se revertirá el pago completo y todas sus aplicaciones a ventas.'
              : 'Este registro histórico se revertirá individualmente.'}
            {' '}El total abonado disminuirá en {formatCurrency(Number(abono.monto_pago ?? abono.monto))}
            {' '}y la deuda del cliente aumentará por ese importe. Se conservará el historial.
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
export function RevertirAbonoDialog({ abono, open, onOpenChange }: {
  abono: Abono
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const user = useAuthStore((state) => state.user)
  const { isPending, confirmar } = useRevertirAbono(abono)
  if (!puedeAnularAbono(user, abono)) return null

  return (
    <RevertirAbonoDialogView
      abono={abono}
      open={open}
      onOpenChange={onOpenChange}
      isPending={isPending}
      onConfirm={() => confirmar().then((anulado) => { if (anulado) onOpenChange(false); return anulado })}
    />
  )
}

export default function RevertirAbonoButton({ abono }: { abono: Abono }) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { isPending, confirmar } = useRevertirAbono(abono)
  if (!puedeAnular(user)) return null
  if (Number(abono.monto) <= 0) return <span>Reversión de #{abono.id_abono_original}</span>
  if (abono.revertido) return <span>Revertido</span>

  return <>
    <Button variant="destructive" size="sm" className="border border-destructive/40 font-semibold" onClick={() => setOpen(true)}>
      <Undo2 aria-hidden="true" />
      Anular abono
    </Button>
    <RevertirAbonoDialogView
      abono={abono}
      open={open}
      onOpenChange={setOpen}
      isPending={isPending}
      onConfirm={() => confirmar().then((anulado) => { if (anulado) setOpen(false); return anulado })}
    />
  </>
}
