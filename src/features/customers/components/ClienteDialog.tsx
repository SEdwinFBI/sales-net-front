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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCreateCliente } from '../hooks/useCreateCliente'
import { useUpdateCliente } from '../hooks/useUpdateCliente'
import type { Cliente } from '../types/clientes'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { DIAS_NOTIFICACION } from '../utils/dias-notificacion'

const schema = z.object({
  dias_notificacion: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)])).max(7),
  permitir_credito: z.boolean(),
  nombre_completo: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z
    .string()
    .min(3, 'La dirección debe tener al menos 3 caracteres'),
  telefono: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos'),
  balance: z.preprocess(
    val => Number(val),
    z.number().min(0, 'El balance debe ser un número positivo'),
  ),
  activo: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  cliente?: Cliente | null
  onClose: () => void
}

const EMPTY_FORM: FormValues = {
  dias_notificacion: [],
  permitir_credito: true,
  nombre_completo: '',
  direccion: '',
  telefono: '',
  balance: 0,
  activo: true,
}

export default function ClienteDialog({
  open,
  cliente,
  onClose,
}: Props) {
  const isEdit = !!cliente

  const {
    mutateAsync: createCliente,
    isPending: isCreating,
  } = useCreateCliente()

  const {
    mutateAsync: updateCliente,
    isPending: isUpdating,
  } = useUpdateCliente()

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
    defaultValues: EMPTY_FORM,
  })

  const sinCredito = !watch('permitir_credito')
  const creditoBloqueado = !!cliente && Number(cliente.balance) !== 0

  useEffect(() => {
    if (!open) return

    reset(
      cliente
        ? {
            permitir_credito: cliente.permitir_credito ?? true,
            nombre_completo: cliente.nombre_completo,
            direccion: cliente.direccion,
            telefono: cliente.telefono,
            balance: cliente.balance,
            activo: cliente.activo,
            dias_notificacion: cliente.dias_notificacion ?? [],
          }
        : EMPTY_FORM,
    )
  }, [open, cliente, reset])

  const onSubmit = async (values: FormValues) => {
    const data = values.permitir_credito
      ? values
      : { ...values, balance: 0 }

    try {
      if (cliente) {
        await updateCliente({ id: cliente.id, data })
        toast.success('Cliente actualizado correctamente')
      } else {
        await createCliente(data)
        toast.success('Cliente creado correctamente')
      }

      onClose()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Error al guardar el cliente'),
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="cliente-credito">Permitir dar crédito</FieldLabel>
              <Switch id="cliente-credito" disabled={creditoBloqueado} checked={watch('permitir_credito')} onCheckedChange={(checked: boolean) => setValue('permitir_credito', checked, { shouldDirty: true, shouldValidate: true })} />
              <FieldError errors={[errors.permitir_credito]} />
            </Field>
            {creditoBloqueado && <p className="text-sm text-muted-foreground">El balance debe ser cero para cambiar el permiso de crédito.</p>}
            <Field>
              <FieldLabel htmlFor="cliente-nombre">
                Nombre completo
              </FieldLabel>
              <Input
                id="cliente-nombre"
                {...register('nombre_completo')}
                placeholder="Juan Pérez"
              />
              <FieldError errors={[errors.nombre_completo]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="cliente-direccion">
                Dirección
              </FieldLabel>
              <Input
                id="cliente-direccion"
                {...register('direccion')}
                placeholder="Calle principal, zona 1"
              />
              <FieldError errors={[errors.direccion]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="cliente-telefono">
                Teléfono
              </FieldLabel>
              <Input
                id="cliente-telefono"
                {...register('telefono')}
                placeholder="12345678"
              />
              <FieldError errors={[errors.telefono]} />
            </Field>

            {!sinCredito && (
              <Field>
                <FieldLabel htmlFor="cliente-balance">
                  Balance
                </FieldLabel>
                <Input
                  id="cliente-balance"
                  {...register('balance')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                <FieldError errors={[errors.balance]} />
              </Field>
            )}

            <Field>
              <FieldLabel>Días de notificación</FieldLabel>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Días de notificación">
                {DIAS_NOTIFICACION.map(({ value, label }) => {
                  const dias = watch('dias_notificacion')
                  const selected = dias.includes(value)
                  return (
                    <Button key={value} type="button" size="sm" disabled={isPending}
                      variant={selected ? 'default' : 'outline'} aria-pressed={selected}
                      onClick={() => setValue('dias_notificacion', selected
                        ? dias.filter(dia => dia !== value)
                        : [...dias, value].sort((a, b) => a - b),
                      { shouldDirty: true, shouldValidate: true })}>
                      {label}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">Los avisos de este cliente solo se enviarán en días habilitados también en los ajustes globales. Sin días seleccionados, no se incluirá en los avisos de cobros.</p>
              <FieldError errors={[errors.dias_notificacion]} />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="cliente-activo">
                Activo
              </FieldLabel>
              <Switch
                id="cliente-activo"
                checked={watch('activo')}
                onCheckedChange={(checked: boolean) =>
                  setValue('activo', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <FieldError errors={[errors.activo]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="py-5">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
