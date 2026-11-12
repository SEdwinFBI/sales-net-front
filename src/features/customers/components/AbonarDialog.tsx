import { useEffect, useRef } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { formatCurrency } from '../utils/venta-total'
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import VentaSelect from './VentaSelect'
import { useAbonarVenta } from '../hooks/useAbonarVenta'
import type { Venta } from '@/features/sales/types/sales'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool, submitForm } from '@/features/agent/commit-tools'
import { buildAbonoDialogTools } from '../agent/cliente-detail-tools'
import type { AbonoFormValues } from '../agent/cliente-detail-forms'

const schema = z.object({
  idVenta: z.preprocess((val) => Number(val), z.number().min(0)),
  monto: z.preprocess((val) => Number(val), z.number().positive('El monto debe ser mayor a 0')),
  observacion: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  ventas: Venta[]
  idCliente: number
  /** Valores con los que se abre (los usa el agente); sin ellos el formulario se conserva como estaba. */
  initialValues?: Partial<AbonoFormValues>
  onClose: () => void
}

export default function AbonarDialog({ open, ventas, idCliente, initialValues, onClose }: Props) {
  const { mutateAsync: abonar, isPending } = useAbonarVenta()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { idVenta: 0, monto: 0, observacion: '' },
  })

  // En una ref para que cambiar la identidad del prop no reinicie el formulario ya abierto.
  const initialRef = useRef(initialValues)
  useEffect(() => {
    initialRef.current = initialValues
  })
  useEffect(() => {
    if (!open || !initialRef.current) return
    reset({ idVenta: 0, monto: 0, observacion: '', ...initialRef.current })
  }, [open, reset])

  // Mientras el diálogo está abierto, el agente puede llenar el formulario (nunca registrar el abono).
  useAgentTools(
    'abonar-dialog',
    open
      ? buildAbonoDialogTools({
          getVentas: () => ventas,
          getValues: () => ({
            idVenta: Number(getValues('idVenta')),
            monto: Number(getValues('monto')),
            observacion: getValues('observacion') ?? '',
          }),
          setValues: (values) => {
            const options = { shouldValidate: true, shouldDirty: true }
            if (values.idVenta !== undefined) setValue('idVenta', values.idVenta, options)
            if (values.monto !== undefined) setValue('monto', values.monto, options)
            if (values.observacion !== undefined) setValue('observacion', values.observacion, options)
          },
        })
      : null,
  )

  const idVentaValue = watch('idVenta')
  const selectedVenta = ventas.find((v) => v.id === idVentaValue)

  const onSubmit = async (values: FormValues) => {
    try {
      await abonar({
        idVenta: values.idVenta,
        idCliente,
        data: {
          monto: values.monto,
          observacion: values.observacion,
        },
      })
      toast.success('Abono registrado correctamente')
      reset()
      onClose()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al registrar el abono'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Registrar abono» tras un clic de confirmación.
  useAgentTools(
    'abonar-dialog-guardar',
    open
      ? [
          commitTool({
            name: 'confirmar_abono',
            description: 'Registra el abono del formulario abierto (presiona Registrar abono).',
            validar: () => (isPending ? 'Ya se esta registrando.' : null),
            texto: () => {
              const idVenta = Number(getValues('idVenta'))
              return `Registrar un abono de Q${Number(getValues('monto')).toFixed(2)} ${idVenta ? `a la venta #${idVenta}` : 'a la deuda del cliente'}`
            },
            run: () => submitForm(handleSubmit, onSubmit),
          }),
        ]
      : null,
  )

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Venta</FieldLabel>
            <VentaSelect
              ventas={ventas}
              value={idVentaValue}
              onChange={(id) => setValue('idVenta', id)}
            />
            <FieldError errors={[errors.idVenta]} />
          </Field>

                    {selectedVenta && (
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-semibold">{formatCurrency(selectedVenta.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Abonado</span>
                          <span className="text-warning">{formatCurrency(selectedVenta.abonado)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo</span>
                          <span className="text-destructive font-semibold">{formatCurrency(selectedVenta.saldo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado</span>
                          <span>{selectedVenta.estado}</span>
                        </div>
                      </div>
          )}


          <Field>
            <FieldLabel>Monto a abonar</FieldLabel>
            <Input {...register('monto')} type="number" step="0.01" placeholder="0.00" />
            <FieldError errors={[errors.monto]} />
          </Field>

          <Field>
            <FieldLabel>Observación</FieldLabel>
            <Textarea
              {...register('observacion')}
              placeholder="Nota adicional (opcional)"
            />
          </Field>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? 'Registrando…' : 'Registrar abono'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
