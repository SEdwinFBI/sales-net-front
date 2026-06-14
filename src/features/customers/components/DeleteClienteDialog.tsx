import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteCliente } from '../hooks/useDeleteCliente'
import type { Cliente } from '../types/clientes'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'

type Props = {
  cliente: Cliente | null
  onClose: () => void
}

export default function DeleteClienteDialog({ cliente, onClose }: Props) {
  const { mutateAsync: deleteCliente, isPending } = useDeleteCliente()

  const handleConfirm = async () => {
    if (!cliente) return
    try {
      await deleteCliente(cliente.id)
      toast.success(`Cliente ${cliente.nombre_completo} eliminado`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el cliente'))
    }
  }

  return (
    <Dialog open={!!cliente} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar a <strong>{cliente?.nombre_completo}</strong>? El cliente quedará inactivo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
