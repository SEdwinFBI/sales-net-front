import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteArticle } from '../hooks/useDeleteArticle'
import type { Article } from '../types/article-types'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'

type Props = {
  article: Article | null
  onClose: () => void
}

export default function DeleteArticleDialog({ article, onClose }: Props) {
  const { mutateAsync: deleteArticle, isPending } = useDeleteArticle()

  const handleConfirm = async (): Promise<boolean> => {
    if (!article) return false

    try {
      await deleteArticle(article.id)
      toast.success(`Articulo ${article.title} eliminado`)
      onClose()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el articulo'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Eliminar» tras un clic de confirmación.
  useAgentTools(
    'delete-articulo-dialog',
    article
      ? [
          commitTool({
            name: 'confirmar_eliminar_articulo',
            description: 'Presiona Eliminar en la confirmacion abierta para eliminar el articulo.',
            validar: () => (isPending ? 'Ya se esta eliminando.' : null),
            texto: () => `Eliminar el articulo ${article.title}`,
            run: handleConfirm,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={!!article} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar articulo</DialogTitle>
          <DialogDescription>
            Eliminar <strong>{article?.title}</strong>. Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => { void handleConfirm() }} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
