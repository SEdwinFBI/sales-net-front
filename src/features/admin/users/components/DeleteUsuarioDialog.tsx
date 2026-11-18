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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

type Props = {
  usuario: Usuario | null
  onClose: () => void
}

export default function DeleteUsuarioDialog({ usuario, onClose }: Props) {
  const { mutateAsync: deleteUsuario, isPending } = useDeleteUsuario()

  const handleConfirm = async (): Promise<boolean> => {
    if (!usuario) return false
    try {
      await deleteUsuario(usuario.id)
      toast.success(`Usuario ${usuario.fullName} eliminado`)
      onClose()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el usuario'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Eliminar» tras un clic de confirmación.
  useAgentTools(
    'delete-usuario-dialog',
    usuario
      ? [
          commitTool({
            name: 'confirmar_eliminar_usuario',
            description: 'Presiona Eliminar en la confirmacion abierta para eliminar al usuario.',
            validar: () => (isPending ? 'Ya se esta eliminando.' : null),
            texto: () => `Eliminar al usuario ${usuario.fullName || usuario.username} (${usuario.username})`,
            run: handleConfirm,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={!!usuario} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            Eliminar a <strong>{usuario?.fullName}</strong>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => { void handleConfirm() }} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
