import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCreateCliente } from '../hooks/useCreateCliente'
import { useUpdateCliente } from '../hooks/useUpdateCliente'
import type { Cliente, DiaNotificacion } from '../types/clientes'
import { DIAS_NOTIFICACION } from '../utils/dias-notificacion'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'

const schema = z.object({
  nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z.string().min(3, 'La dirección debe tener al menos 3 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  balance: z.preprocess((val) => Number(val), z.number().min(0, 'El balance debe ser un número positivo')),
  dias_notificacion: z.array(z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ])).max(7),
  activo: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  cliente?: Cliente | null
  onClose: () => void
}

const EMPTY_FORM: FormValues = {
  nombre_completo: '',
  direccion: '',
  telefono: '',
  balance: 0,
  dias_notificacion: [],
  activo: true,
}

export default function ClienteDialog({ open, cliente, onClose }: Props) {
  const isEdit = !!cliente
  const { mutateAsync: createCliente, isPending: isCreating } = useCreateCliente()
  const { mutateAsync: updateCliente, isPending: isUpdating } = useUpdateCliente()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: EMPTY_FORM,
  })
  const diasSeleccionados = watch('dias_notificacion')

  useEffect(() => {
    if (!open) return
    reset(cliente ? {
      nombre_completo: cliente.nombre_completo,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      balance: cliente.balance,
      dias_notificacion: cliente.dias_notificacion ?? [],
      activo: cliente.activo,
    } : EMPTY_FORM)
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
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar el cliente'))
    }
  }

  const toggleDia = (dia: DiaNotificacion) => {
    const nextDias = diasSeleccionados.includes(dia)
      ? diasSeleccionados.filter((value) => value !== dia)
      : [...diasSeleccionados, dia].sort((a, b) => a - b)

    setValue('dias_notificacion', nextDias, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
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
              <FieldLabel>Días de notificación</FieldLabel>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Días de notificación">
                {DIAS_NOTIFICACION.map((dia) => {
                  const isSelected = diasSeleccionados.includes(dia.value)
                  return (
                    <Button
                      key={dia.value}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      aria-pressed={isSelected}
                      onClick={() => toggleDia(dia.value)}
                    >
                      {dia.label}
                    </Button>
                  )
                })}
              </div>
              <FieldError errors={[errors.dias_notificacion]} />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel>Activo</FieldLabel>
              <Switch checked={watch('activo')} onCheckedChange={(checked: boolean) => setValue('activo', checked)} />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
