import { useState } from 'react'
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
import { Loader2, Wallet, CreditCard } from 'lucide-react'
import { useCreateVentaEncabezado } from '../hooks/useCreateVentaEncabezado'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'

type PaymentMethod = 'efectivo' | 'credito'

const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

type Props = {
  open: boolean
  idCliente: number
  clienteNombre: string
  onClose: () => void
}

export default function CrearVentaEncabezadoDialog({ open, idCliente, clienteNombre, onClose }: Props) {
  const { mutateAsync: crearVenta, isPending } = useCreateVentaEncabezado()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [monto, setMonto] = useState('0.00')
  const [observacion, setObservacion] = useState('')
  const [montoError, setMontoError] = useState('')

  const handleSubmit = async () => {
    const montoNum = Number(monto)
    if (isNaN(montoNum) || montoNum < 0) {
      setMontoError('El monto debe ser un número válido mayor o igual a 0')
      return
    }
    setMontoError('')

    const estado = paymentMethod === 'credito' ? 'PENDIENTE' : 'PAGADA'
    const id_forma_pago = paymentMethod === 'credito' ? 2 : 1

    try {
      await crearVenta({
        id_cliente: idCliente,
        id_forma_pago,
        estado,
        monto,
        observacion: observacion.trim() || null,
      })
      toast.success('Venta registrada correctamente')
      setMonto('0.00')
      setObservacion('')
      setPaymentMethod('efectivo')
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al crear la venta'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar venta — {clienteNombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors cursor-pointer ${selected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                  >
                    <Icon className="size-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Field>
            <FieldLabel>Monto</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => { setMonto(e.target.value); setMontoError('') }}
              placeholder="0.00"
            />
            <FieldError errors={[montoError]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="observacion">Observación (opcional)</FieldLabel>
            <Textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Notas adicionales…"
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Registrando…' : 'Registrar venta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
