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

type Props = {
  article: Article | null
  onClose: () => void
}

export default function DeleteArticleDialog({ article, onClose }: Props) {
  const { mutateAsync: deleteArticle, isPending } = useDeleteArticle()

  const handleConfirm = async () => {
    if (!article) return

    try {
      await deleteArticle(article.id)
      toast.success(`Articulo ${article.title} eliminado`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el articulo'))
    }
  }

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
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
