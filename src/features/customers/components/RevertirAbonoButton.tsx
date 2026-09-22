import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency } from '@/helpers/money'
import type { Abono } from '../types/clientes'

export default function RevertirAbonoButton({ abono }: { abono: Abono }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => api.post(`/abonos/${abono.id}/revertir`),
    onSuccess: () => Promise.all([
      queryKeys.customers.all, queryKeys.sales.all, queryKeys.adminVentas.all, queryKeys.reporting.all,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })
  if (Number(abono.monto) <= 0) return <span>Reversión de #{abono.id_abono_original}</span>
  if (abono.revertido) return <span>Revertido</span>

  const confirmar = async () => {
    try {
      await mutateAsync()
      setOpen(false)
      toast.success('Abono revertido correctamente')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo revertir el abono'))
    }
  }

  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Revertir</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!isPending) setOpen(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revertir abono #{abono.id}</DialogTitle>
          <DialogDescription>
            {abono.id_movimiento
              ? 'Se revertirá el pago completo y todas sus aplicaciones a ventas.'
              : 'Este registro histórico se revertirá individualmente.'}
            {' '}El total abonado disminuirá en {formatCurrency(Number(abono.monto_pago ?? abono.monto))}
            {' '}y la deuda del cliente aumentará por ese importe. Se conservará el historial.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>Volver</Button>
          <Button variant="destructive" disabled={isPending} onClick={() => void confirmar()}>
            {isPending ? 'Revirtiendo…' : 'Confirmar reversión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
