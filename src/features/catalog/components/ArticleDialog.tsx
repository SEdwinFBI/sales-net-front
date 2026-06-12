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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { useCreateArticle } from '../hooks/useCreateArticle'
import { useCreateArticleVariant } from '../hooks/useCreateArticleVariant'
import { useDeleteArticleVariant } from '../hooks/useDeleteArticleVariant'
import { useUpdateArticle } from '../hooks/useUpdateArticle'
import { useUpdateArticleVariant } from '../hooks/useUpdateArticleVariant'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'

const defaultSizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']
const showSizeSelectorOnCreate = false

const articleSchema = z.object({
  title: z.string().min(3, 'El titulo debe tener al menos 3 caracteres'),
  basePrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  image: z.any().optional(),
})

type FormValues = z.infer<typeof articleSchema>

type Props = {
  article?: Article | null
  variants?: ArticleVariant[]
  open: boolean
  onClose: () => void
}

export default function ArticleDialog({ article, variants = [], open, onClose }: Props) {
  const isEdit = !!article
  const articleVariants = useMemo(
    () =>
      article
        ? variants.filter((variant) => variant.articleId === article.id)
        : [],
    [article, variants]
  )
  const initialSizes = useMemo(
    () => articleVariants.map((variant) => variant.size),
    [articleVariants]
  )
  const availableSizes = useMemo(
    () =>
      Array.from(new Set([...defaultSizes, ...initialSizes])).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [initialSizes]
  )
  const initialBasePrice = articleVariants.find((v) => v.size === '6')?.price ?? 0
  const { mutateAsync: createArticle, isPending: isCreating } = useCreateArticle()
  const { mutateAsync: updateArticle, isPending: isUpdating } = useUpdateArticle()
  const { mutateAsync: createVariant, isPending: isCreatingVariant } = useCreateArticleVariant()
  const { mutateAsync: deleteVariant, isPending: isDeletingVariant } = useDeleteArticleVariant()
  const { mutateAsync: updateVariant, isPending: isUpdatingVariant } = useUpdateArticleVariant()
  const [selectedSizes, setSelectedSizes] = useState<ArticleSize[]>(isEdit ? initialSizes : defaultSizes)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const isPending = isCreating || isUpdating || isCreatingVariant || isDeletingVariant || isUpdatingVariant

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(articleSchema) as unknown as Resolver<FormValues>,
    defaultValues: { title: '', basePrice: 0 },
  })
  const imageField = register('image')

  useEffect(() => {
    if (open) {
      setSelectedSizes(isEdit ? initialSizes : defaultSizes)
      setSelectedImage(null)
      reset(
        article
          ? {
              title: article.title,
              basePrice: initialBasePrice,
            }
          : { title: '', basePrice: 0 }
      )
    }
  }, [article, initialBasePrice, initialSizes, open, reset])

  const toggleSize = (size: ArticleSize) => {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size]
    )
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const imageFile = selectedImage ?? undefined
      if (!isEdit && !imageFile) {
        toast.error('Selecciona una imagen para el articulo')
        return
      }

      const getSizePrice = (size: string) => {
        const sizeNum = parseInt(size)
        return Math.max(0, values.basePrice - (6 - sizeNum) * 10)
      }

      const effectiveSelectedSizes = isEdit ? selectedSizes : defaultSizes
      const currentVariants = articleVariants
      const selectedSet = new Set(effectiveSelectedSizes)
      const currentSet = new Set(currentVariants.map((variant) => variant.size))
      const sizesToCreate = effectiveSelectedSizes.filter((size) => !currentSet.has(size))

      const zeroLevelSizes = effectiveSelectedSizes.filter((size) => getSizePrice(size) === 0)
      if (zeroLevelSizes.length > 0) {
        const sortedSizes = zeroLevelSizes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        toast.warning(`Las tallas ${sortedSizes.join(', ')} quedaran con precio 0 debido a la regla de precios establecida`)
      }

      if (sizesToCreate.length > 0 && values.basePrice <= 0) {
        toast.error('Ingresa un precio base mayor a 0 para las nuevas tallas')
        return
      }

      const savedArticle = isEdit
        ? await updateArticle({ id: article.id, title: values.title, image: imageFile })
        : await createArticle({ title: values.title, image: imageFile as File })

      if (isEdit) {
        await Promise.all([
          ...sizesToCreate.map((size) =>
            createVariant({ articleId: savedArticle.id, size, price: getSizePrice(size) })
          ),
          ...currentVariants
            .filter((variant) => selectedSet.has(variant.size))
            .map((variant) => updateVariant({ id: variant.id, price: getSizePrice(variant.size) })),
          ...currentVariants
            .filter((variant) => !selectedSet.has(variant.size))
            .map((variant) => deleteVariant(variant.id)),
        ])
      } else {
        await Promise.all(
          defaultSizes.map((size) =>
            createVariant({ articleId: savedArticle.id, size, price: getSizePrice(size) })
          )
        )
      }

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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar articulo' : 'Crear articulo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Titulo</FieldLabel>
              <Input {...register('title')} placeholder="Faja cruceta, bordada..." />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel>{isEdit ? 'Imagen (opcional)' : 'Imagen obligatoria'}</FieldLabel>
              <Input
                {...imageField}
                accept="image/*"
                onChange={(event) => {
                  void imageField.onChange(event)
                  setSelectedImage(event.currentTarget.files?.item(0) ?? null)
                }}
                type="file"
              />
            </Field>

            <Field>
              <FieldLabel>Precio base</FieldLabel>
              <InputGroup>
                <InputGroupAddon>Q</InputGroupAddon>
                <InputGroupInput
                  {...register('basePrice')}
                  min={0}
                  step="0.01"
                  type="number"
                  placeholder="Ej. 125.00"
                />
              </InputGroup>
              <FieldError errors={[errors.basePrice]} />
            </Field>

            {showSizeSelectorOnCreate && (
            <Field>
              <FieldLabel>Tallas disponibles</FieldLabel>
              <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 sm:grid-cols-6">
                {availableSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size)

                  return (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'min-w-0 px-2 font-semibold',
                        !isSelected &&
                          'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-primary'
                      )}
                      onClick={() => toggleSize(size)}
                    >
                      <span className="truncate">Talla {size}</span>
                    </Button>
                  )
                })}
              </div>
            </Field>
            )}
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear articulo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
