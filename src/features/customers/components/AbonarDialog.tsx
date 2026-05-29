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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAbonarVenta } from '../hooks/useAbonarVenta'
import type { Venta } from '@/features/sales/types/sales'
import { toast } from 'sonner'

const schema = z.object({
  idVenta: z.preprocess((val) => Number(val), z.number().min(1, 'Selecciona una venta')),
  monto: z.preprocess((val) => Number(val), z.number().positive('El monto debe ser mayor a 0')),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  ventas: Venta[]
  onClose: () => void
}

export default function AbonarDialog({ open, ventas, onClose }: Props) {
  const { mutateAsync: abonar, isPending } = useAbonarVenta()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { idVenta: 0, monto: 0 },
  })

  const selectedVentaId = watch('idVenta')
  const selectedVenta = ventas.find((v) => v.id === selectedVentaId)

  const onSubmit = async (values: FormValues) => {
    try {
      await abonar({ idVenta: values.idVenta, data: { monto: values.monto } })
      toast.success('Abono registrado correctamente')
      reset()
      onClose()
    } catch {
      toast.error('Error al registrar el abono')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Venta</FieldLabel>
            <Select {...register('idVenta')}>
              <option value={0}>Selecciona una venta</option>
              {ventas.map((v) => (
<option key={v.id} value={v.id}>
                            Venta #{v.id} — Q{Number(v.total).toFixed(2)} — {v.estado}
                          </option>
                        ))}
                      </Select>
                      <FieldError errors={[errors.idVenta]} />
                    </Field>

                    {selectedVenta && (
                      <p className="text-sm text-muted-foreground">
                        Total: Q{Number(selectedVenta.total).toFixed(2)} | Estado: {selectedVenta.estado}
            </p>
          )}

          <Field>
            <FieldLabel>Monto a abonar</FieldLabel>
            <Input {...register('monto')} type="number" step="0.01" placeholder="0.00" />
            <FieldError errors={[errors.monto]} />
          </Field>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Registrar abono'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
