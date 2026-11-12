import { useEffect, useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api-error'
import { useCrearAjusteCliente } from '../hooks/useCrearAjusteCliente'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool, submitForm } from '@/features/agent/commit-tools'
import { buildAjusteDialogTools } from '../agent/cliente-detail-tools'
import type { AjusteFormValues } from '../agent/cliente-detail-forms'

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
  /** Valores con los que se abre (los usa el agente). */
  initialValues?: Partial<AjusteFormValues>
  onClose: () => void
}

export default function AjusteClienteDialog({ open, idCliente, initialValues, onClose }: Props) {
  const { mutateAsync: crearAjuste, isPending } = useCrearAjusteCliente()
  const [isNegative, setIsNegative] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { monto: 0, descripcion: '' },
  })

  // Al abrir con valores del agente: el signo vive en un useState (no en el formulario), así que se
  // ajusta en el mismo render en que `open` cambia; el resto de campos los repone el efecto de abajo.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && initialValues) setIsNegative(Boolean(initialValues.negativo))
  }
  // En una ref para que cambiar la identidad del prop no reinicie el formulario ya abierto.
  const initialRef = useRef(initialValues)
  useEffect(() => {
    initialRef.current = initialValues
  })
  useEffect(() => {
    if (!open || !initialRef.current) return
    reset({ monto: initialRef.current.monto ?? 0, descripcion: initialRef.current.descripcion ?? '' })
  }, [open, reset])

  // Mientras el diálogo está abierto, el agente puede llenar el formulario (nunca registrar el ajuste).
  useAgentTools(
    'ajuste-dialog',
    open
      ? buildAjusteDialogTools({
          getValues: () => ({
            monto: Number(getValues('monto')),
            negativo: isNegative,
            descripcion: getValues('descripcion') ?? '',
          }),
          setValues: (values) => {
            const options = { shouldValidate: true, shouldDirty: true }
            if (values.monto !== undefined) setValue('monto', values.monto, options)
            if (values.descripcion !== undefined) setValue('descripcion', values.descripcion, options)
            if (values.negativo !== undefined) setIsNegative(values.negativo)
          },
        })
      : null,
  )

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
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar el ajuste'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Registrar ajuste» tras un clic de confirmación.
  useAgentTools(
    'ajuste-dialog-guardar',
    open
      ? [
          commitTool({
            name: 'confirmar_ajuste',
            description: 'Registra el ajuste de saldo del formulario abierto (presiona Registrar ajuste).',
            validar: () => (isPending ? 'Ya se esta registrando.' : null),
            texto: () =>
              `Registrar un ajuste de ${isNegative ? '-' : '+'}Q${Math.abs(Number(getValues('monto'))).toFixed(2)} al saldo del cliente: ${getValues('descripcion') || '(sin descripcion)'}`,
            run: () => submitForm(handleSubmit, onSubmit),
          }),
        ]
      : null,
  )

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
              <Input
                {...register('monto')}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                autoFocus
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
