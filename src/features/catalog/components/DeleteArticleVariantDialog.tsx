import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteArticleVariant } from '../hooks/useDeleteArticleVariant'
import type { Article } from '../types/article-types'
import type { ArticleVariant } from '../types/article-variant-types'

type Props = {
  article?: Article
  variant: ArticleVariant | null
  onClose: () => void
}

export default function DeleteArticleVariantDialog({ article, variant, onClose }: Props) {
  const { mutateAsync: deleteVariant, isPending } = useDeleteArticleVariant()

  const handleConfirm = async () => {
    if (!variant) return

    try {
      await deleteVariant(variant.id)
      toast.success('Talla eliminada correctamente')
      onClose()
    } catch {
      toast.error('Error al eliminar la talla')
    }
  }

  return (
    <Dialog open={!!variant} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar talla</DialogTitle>
          <DialogDescription>
            Deseas eliminar la talla <strong>{variant?.size}</strong> de{' '}
            <strong>{article?.title}</strong>?
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
