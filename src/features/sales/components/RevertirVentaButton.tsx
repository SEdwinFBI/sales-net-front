import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency } from '@/helpers/money'
import type { Venta } from '../types/sales'

export default function RevertirVentaButton({ venta }: { venta: Venta }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => api.post(`/admin/venta/${venta.id}/revertir/`),
    onSuccess: async () => {
      await Promise.all([
        queryKeys.sales.all, queryKeys.adminVentas.all, queryKeys.customers.all,
        queryKeys.inventario.all, queryKeys.adminCatalog.stock.all(), queryKeys.reporting.all,
        ['cajas'], ['caja'],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
  if (venta.estado !== 'PENDIENTE' && venta.estado !== 'PAGADA') return null

  const confirmar = async () => {
    try {
      await mutateAsync()
      setOpen(false)
      toast.success('Venta revertida correctamente')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo revertir la venta'))
    }
  }

  return <>
    <Button variant="outline" size="sm" disabled={Number(venta.abonado) > 0}
      title={Number(venta.abonado) > 0 ? 'Por ahora no se pueden revertir ventas con abonos' : undefined}
      onClick={() => setOpen(true)}>Revertir</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!isPending) setOpen(value) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revertir venta #{venta.id}</DialogTitle>
          <DialogDescription>
            Se registrará una venta compensatoria de {formatCurrency(-Number(venta.total_neto))}
            {' '}y se devolverán los productos a la sucursal de origen. Si es a crédito, se descontará
            su importe del saldo del cliente. La venta original permanecerá en el historial.
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
