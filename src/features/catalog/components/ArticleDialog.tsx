import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
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
import { cn } from '@/lib/utils'
import { useCreateArticle } from '../hooks/useCreateArticle'
import { useCreateArticleVariant } from '../hooks/useCreateArticleVariant'
import { useDeleteArticleVariant } from '../hooks/useDeleteArticleVariant'
import { useUpdateArticle } from '../hooks/useUpdateArticle'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'

const sizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']

const articleSchema = z.object({
  title: z.string().min(3, 'El titulo debe tener al menos 3 caracteres'),
  basePrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
})

type FormValues = z.infer<typeof articleSchema> & {
  image?: FileList
}

type Props = {
  article?: Article | null
  variants?: ArticleVariant[]
  open: boolean
  onClose: () => void
}

export default function ArticleDialog({ article, variants = [], open, onClose }: Props) {
  const isEdit = !!article
  const initialSizes = useMemo(
    () =>
      article
        ? variants
            .filter((variant) => variant.articleId === article.id)
            .map((variant) => variant.size)
        : [],
    [article, variants]
  )
  const { mutateAsync: createArticle, isPending: isCreating } = useCreateArticle()
  const { mutateAsync: updateArticle, isPending: isUpdating } = useUpdateArticle()
  const { mutateAsync: createVariant, isPending: isCreatingVariant } = useCreateArticleVariant()
  const { mutateAsync: deleteVariant, isPending: isDeletingVariant } = useDeleteArticleVariant()
  const [selectedSizes, setSelectedSizes] = useState<ArticleSize[]>(initialSizes)
  const isPending = isCreating || isUpdating || isCreatingVariant || isDeletingVariant

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(articleSchema) as unknown as Resolver<FormValues>,
    defaultValues: { title: '', basePrice: 0 },
  })

  useEffect(() => {
    if (open) {
      reset(
        article
          ? {
              title: article.title,
              basePrice:
                variants.find((variant) => variant.articleId === article.id)?.price ?? 0,
            }
          : { title: '', basePrice: 0 }
      )
    }
  }, [article, open, reset, variants])

  const toggleSize = (size: ArticleSize) => {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size]
    )
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const imageFile = values.image?.item(0) ?? undefined
      if (!isEdit && !imageFile) {
        toast.error('Selecciona una imagen para el articulo')
        return
      }

      const currentVariants = article
        ? variants.filter((variant) => variant.articleId === article.id)
        : []
      const selectedSet = new Set(selectedSizes)
      const currentSet = new Set(currentVariants.map((variant) => variant.size))
      const sizesToCreate = selectedSizes.filter((size) => !currentSet.has(size))

      if (sizesToCreate.length > 0 && values.basePrice <= 0) {
        toast.error('Ingresa un precio base mayor a 0 para las nuevas tallas')
        return
      }

      const savedArticle = isEdit
        ? await updateArticle({ id: article.id, title: values.title, image: imageFile })
        : await createArticle({ title: values.title, image: imageFile as File })

      await Promise.all([
        ...sizesToCreate
          .map((size) => createVariant({ articleId: savedArticle.id, size, price: values.basePrice })),
        ...currentVariants
          .filter((variant) => !selectedSet.has(variant.size))
          .map((variant) => deleteVariant(variant.id)),
      ])

      if (isEdit) {
        toast.success('Articulo actualizado correctamente')
      } else {
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
              <Input {...register('title')} placeholder="Ej. Huipil bordado rojo" />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel>{isEdit ? 'Imagen (opcional)' : 'Imagen'}</FieldLabel>
              <Input
                {...register('image')}
                accept="image/*"
                type="file"
              />
            </Field>

            <Field>
              <FieldLabel>Precio base</FieldLabel>
              <Input
                {...register('basePrice')}
                min={0}
                step="0.01"
                type="number"
                placeholder="Ej. 125.00"
              />
              <FieldError errors={[errors.basePrice]} />
            </Field>

            <Field>
              <FieldLabel>Tallas disponibles</FieldLabel>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {sizes.map((size) => {
                  const isSelected = selectedSizes.includes(size)

                  return (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'px-2 font-semibold',
                        !isSelected &&
                          'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-primary'
                      )}
                      onClick={() => toggleSize(size)}
                    >
                      Talla {size}
                    </Button>
                  )
                })}
              </div>
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
