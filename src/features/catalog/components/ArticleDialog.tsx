import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCreateArticle } from '../hooks/useCreateArticle'
import { useUpdateArticle } from '../hooks/useUpdateArticle'
import type { Article } from '../types/article-types'

const articleSchema = z.object({
  title: z.string().min(3, 'El titulo debe tener al menos 3 caracteres'),
  image: z.string().min(1, 'La imagen es requerida'),
})

type FormValues = z.infer<typeof articleSchema>

type Props = {
  article?: Article | null
  open: boolean
  onClose: () => void
}

export default function ArticleDialog({ article, open, onClose }: Props) {
  const isEdit = !!article
  const { mutateAsync: createArticle, isPending: isCreating } = useCreateArticle()
  const { mutateAsync: updateArticle, isPending: isUpdating } = useUpdateArticle()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: '', image: '' },
  })

  useEffect(() => {
    if (open) {
      reset(article ? { title: article.title, image: article.image } : { title: '', image: '' })
    }
  }, [article, open, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateArticle({ id: article.id, ...values })
        toast.success('Articulo actualizado correctamente')
      } else {
        await createArticle(values)
        toast.success('Articulo creado correctamente')
      }
      onClose()
    } catch {
      toast.error('Error al guardar el articulo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar articulo' : 'Crear articulo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Titulo</FieldLabel>
              <Input {...register('title')} placeholder="Huipil bordado" />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel>Imagen</FieldLabel>
              <Input {...register('image')} placeholder="https://..." />
              <FieldError errors={[errors.image]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear articulo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
