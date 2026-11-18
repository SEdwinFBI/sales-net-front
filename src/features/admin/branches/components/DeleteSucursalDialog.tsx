import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteSucursal } from '../hooks/useDeleteSucursal'
import type { Sucursal } from '../types/sucursal-types'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

type Props = {
  sucursal: Sucursal | null
  onClose: () => void
}

export default function DeleteSucursalDialog({ sucursal, onClose }: Props) {
  const { mutateAsync: deleteSucursal, isPending } = useDeleteSucursal()

  const handleConfirm = async (): Promise<boolean> => {
    if (!sucursal) return false
    try {
      await deleteSucursal(sucursal.id)
      toast.success(`Sucursal ${sucursal.nombre} desactivada`)
      onClose()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al desactivar la sucursal'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Desactivar» tras un clic de confirmación.
  useAgentTools(
    'delete-sucursal-dialog',
    sucursal
      ? [
          commitTool({
            name: 'confirmar_desactivar_sucursal',
            description: 'Presiona Desactivar en la confirmacion abierta para desactivar la sucursal.',
            validar: () => (isPending ? 'Ya se esta desactivando.' : null),
            texto: () => `Desactivar la sucursal ${sucursal.nombre}`,
            run: handleConfirm,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={!!sucursal} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar sucursal</DialogTitle>
          <DialogDescription>
            Desactivar <strong>{sucursal?.nombre}</strong>. Su inventario, ventas y precios
            se conservan; solo deja de estar disponible para operar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => { void handleConfirm() }} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Desactivando…' : 'Desactivar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
