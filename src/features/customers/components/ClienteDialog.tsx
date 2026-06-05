import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { useCreateCliente } from '../hooks/useCreateCliente'
import { useUpdateCliente } from '../hooks/useUpdateCliente'
import type { Cliente } from '../types/clientes'
import { toast } from 'sonner'

const schema = z.object({
  nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z.string().min(3, 'La dirección debe tener al menos 3 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  balance: z.preprocess((val) => Number(val), z.number().min(0, 'El balance debe ser un número positivo')),
  fecha_notificacion: z.string().min(1, 'La fecha es requerida'),
  activo: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  cliente?: Cliente | null
  onClose: () => void
}

export default function ClienteDialog({ open, cliente, onClose }: Props) {
  const isEdit = !!cliente
  const { mutateAsync: createCliente, isPending: isCreating } = useCreateCliente()
  const { mutateAsync: updateCliente, isPending: isUpdating } = useUpdateCliente()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { nombre_completo: '', direccion: '', telefono: '', balance: 0, fecha_notificacion: '', activo: true },
  })

  useEffect(() => {
    if (open) {
      reset(
        cliente
          ? { nombre_completo: cliente.nombre_completo, direccion: cliente.direccion, telefono: cliente.telefono, balance: cliente.balance, fecha_notificacion: cliente.fecha_notificacion, activo: cliente.activo }
          : { nombre_completo: '', direccion: '', telefono: '', balance: 0, fecha_notificacion: '', activo: true }
      )
    }
  }, [open, cliente, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateCliente({ id: cliente!.id, data: values })
        toast.success('Cliente actualizado correctamente')
      } else {
        await createCliente(values)
        toast.success('Cliente creado correctamente')
      }
      onClose()
    } catch {
      toast.error('Error al guardar el cliente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input {...register('nombre_completo')} placeholder="Juan Pérez" />
              <FieldError errors={[errors.nombre_completo]} />
            </Field>

            <Field>
              <FieldLabel>Dirección</FieldLabel>
              <Input {...register('direccion')} placeholder="Calle principal, zona 1" />
              <FieldError errors={[errors.direccion]} />
            </Field>

            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input {...register('telefono')} placeholder="12345678" />
              <FieldError errors={[errors.telefono]} />
            </Field>

            <Field>
              <FieldLabel>Balance</FieldLabel>
              <Input {...register('balance')} type="number" step="0.01" placeholder="0.00" />
              <FieldError errors={[errors.balance]} />
            </Field>

            <Field>
              <FieldLabel>Fecha de notificación</FieldLabel>
              <Input {...register('fecha_notificacion')} type="date" />
              <FieldError errors={[errors.fecha_notificacion]} />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel>Activo</FieldLabel>
              <Switch
                checked={watch('activo')}
                onCheckedChange={(checked: boolean) => setValue('activo', checked)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
