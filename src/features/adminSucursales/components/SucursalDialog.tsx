import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useCreateSucursal } from '../hooks/useCreateSucursal'
import { useUpdateSucursal } from '../hooks/useUpdateSucursal'
import type { Sucursal } from '../types/sucursal-types'

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  sucursal?: Sucursal | null
  onClose: () => void
}

export default function SucursalDialog({ open, sucursal, onClose }: Props) {
  const isEdit = !!sucursal
  const { mutateAsync: createSucursal, isPending: isCreating } = useCreateSucursal()
  const { mutateAsync: updateSucursal, isPending: isUpdating } = useUpdateSucursal()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', direccion: '', telefono: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        sucursal
          ? { nombre: sucursal.nombre, direccion: sucursal.direccion, telefono: sucursal.telefono }
          : { nombre: '', direccion: '', telefono: '' }
      )
    }
  }, [open, sucursal, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateSucursal({ id: sucursal.id, ...values })
        toast.success('Sucursal actualizada correctamente')
      } else {
        await createSucursal(values)
        toast.success('Sucursal creada correctamente')
      }
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar la sucursal'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar sucursal' : 'Crear sucursal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...register('nombre')} placeholder="Ej. Sucursal Centro" />
              <FieldError errors={[errors.nombre]} />
            </Field>

            <Field>
              <FieldLabel>Dirección (opcional)</FieldLabel>
              <Input {...register('direccion')} placeholder="Ej. 4a calle 5-10 zona 1" />
              <FieldError errors={[errors.direccion]} />
            </Field>

            <Field>
              <FieldLabel>Teléfono (opcional)</FieldLabel>
              <Input {...register('telefono')} placeholder="Ej. 55512345" />
              <FieldError errors={[errors.telefono]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
