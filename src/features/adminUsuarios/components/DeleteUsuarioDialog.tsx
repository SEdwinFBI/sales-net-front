import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteUsuario } from '../hooks/useDeleteUsuario'
import type { Usuario } from '../types/usuario-types'
import { toast } from 'sonner'

type Props = {
  usuario: Usuario | null
  onClose: () => void
}

export default function DeleteUsuarioDialog({ usuario, onClose }: Props) {
  const { mutateAsync: deleteUsuario, isPending } = useDeleteUsuario()

  const handleConfirm = async () => {
    if (!usuario) return
    try {
      await deleteUsuario(usuario.id)
      toast.success(`Usuario ${usuario.fullName} eliminado`)
      onClose()
    } catch {
      toast.error('Error al eliminar el usuario')
    }
  }

  return (
    <Dialog open={!!usuario} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar a <strong>{usuario?.fullName}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}