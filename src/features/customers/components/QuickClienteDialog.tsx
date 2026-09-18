import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCreateCliente } from '../hooks/useCreateCliente'
import type { Cliente } from '../types/clientes'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { UserPlus, Loader2 } from 'lucide-react'

const schema = z.object({
  nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  direccion: z.string().default('Ciudad'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: (cliente: Cliente) => void
}

export default function QuickClienteDialog({ open, onClose, onSuccess }: Props) {
  const { mutateAsync: createCliente, isPending } = useCreateCliente()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      nombre_completo: '',
      telefono: '',
      direccion: 'Ciudad',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createCliente({
        nombre_completo: values.nombre_completo.trim(),
        telefono: values.telefono.trim(),
        direccion: values.direccion.trim() || 'Ciudad',
        balance: 0,
        dias_notificacion: [],
        activo: true,
      })

      toast.success(`Cliente "${values.nombre_completo}" creado exitosamente`)
      reset()
      onSuccess?.(res.data)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al crear el cliente'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle>Crear cliente rápido</DialogTitle>
              <DialogDescription>
                Registra al cliente para vincular sus precios y ventas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input
                {...register('nombre_completo')}
                placeholder="Ej. Carlos Morales"
                autoFocus
              />
              <FieldError errors={[errors.nombre_completo]} />
            </Field>

            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input
                {...register('telefono')}
                placeholder="Ej. 55551234"
                inputMode="numeric"
              />
              <FieldError errors={[errors.telefono]} />
            </Field>

            <Field>
              <FieldLabel>Dirección (opcional)</FieldLabel>
              <Input
                {...register('direccion')}
                placeholder="Ej. Zona 1, Guatemala"
              />
              <FieldError errors={[errors.direccion]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin size-4 mr-2" />}
              Crear y vincular
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
