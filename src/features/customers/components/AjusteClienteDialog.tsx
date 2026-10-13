import { useState } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api-error'
import { useCrearAjusteCliente } from '../hooks/useCrearAjusteCliente'

const schema = z.object({
  monto: z.preprocess(
    (value) => Number(value),
    z.number({ error: 'Ingresa un monto válido' }).finite().refine((value) => value !== 0, 'El monto no puede ser 0'),
  ),
  descripcion: z.string().trim().min(1, 'Ingresa una descripción'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  idCliente: number
  onClose: () => void
}

export default function AjusteClienteDialog({ open, idCliente, onClose }: Props) {
  const { mutateAsync: crearAjuste, isPending } = useCrearAjusteCliente()
  const [isNegative, setIsNegative] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { monto: 0, descripcion: '' },
  })

  const closeDialog = () => {
    if (isPending) return
    reset()
    setIsNegative(false)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const monto = isNegative ? -Math.abs(values.monto) : Math.abs(values.monto)

    try {
      await crearAjuste({
        idCliente,
        data: {
          monto: monto.toFixed(2),
          descripcion: values.descripcion.trim(),
        },
      })
      toast.success('Ajuste registrado correctamente')
      reset()
      setIsNegative(false)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar el ajuste'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar ajuste</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Monto del ajuste</FieldLabel>
            <div className="flex gap-2">
              <Controller
                name="monto"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <MoneyInput {...field} onValueChange={onChange} placeholder="0.00" autoFocus />
                )}
              />
              <Button
                type="button"
                variant={isNegative ? 'destructive' : 'outline'}
                className="min-w-10 text-lg"
                aria-label={isNegative ? 'Quitar signo negativo' : 'Agregar signo negativo'}
                aria-pressed={isNegative}
                onClick={() => setIsNegative((current) => !current)}
              >
                −
              </Button>
            </div>
            <FieldDescription>
              {isNegative
                ? 'El ajuste disminuirá el balance.'
                : 'El ajuste aumentará el balance. Presiona − para disminuirlo.'}
            </FieldDescription>
            <FieldError errors={[errors.monto]} />
          </Field>

          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              {...register('descripcion')}
              placeholder="Motivo del ajuste"
              rows={3}
            />
            <FieldError errors={[errors.descripcion]} />
          </Field>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={closeDialog} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? 'Registrando…' : 'Registrar ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
