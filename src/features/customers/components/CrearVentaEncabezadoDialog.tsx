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
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/features/core/store/auth-store'
import { getSucursales } from '@/features/admin/branches/services/sucursales-service'
import { Select } from '@/components/ui/select'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'
import { buildVentaClienteDialogTools } from '../agent/cliente-detail-tools'
import type { VentaClienteFormValues } from '../agent/cliente-detail-forms'

type PaymentMethod = 'efectivo' | 'credito'

const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
]

type Props = {
  open: boolean
  idCliente: number
  clienteNombre: string
  /** Valores con los que se abre (los usa el agente). */
  initialValues?: Partial<VentaClienteFormValues>
  onClose: () => void
}

export default function CrearVentaEncabezadoDialog({ open, idCliente, clienteNombre, initialValues, onClose }: Props) {
  const { mutateAsync: crearVenta, isPending } = useCreateVentaEncabezado()
  const user = useAuthStore(state => state.user)
  const necesitaSucursal = !user?.sucursalActual
  const { data: sucursales = [], isPending: cargandoSucursales, isError: errorSucursales, refetch } = useQuery({
    queryKey: queryKeys.adminSucursales.list(),
    queryFn: getSucursales,
    enabled: open && necesitaSucursal,
    staleTime: 1000 * 60 * 5,
  })
  const sucursalesActivas = sucursales.filter(sucursal => sucursal.activo)
  const [idSucursal, setIdSucursal] = useState('')
  const sucursalSeleccionada = sucursalesActivas.some(sucursal => String(sucursal.id) === idSucursal)
    ? idSucursal
    : sucursalesActivas.length === 1 ? String(sucursalesActivas[0].id) : ''

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [monto, setMonto] = useState('0.00')
  const [observacion, setObservacion] = useState('')
  const [montoError, setMontoError] = useState('')

  // Al abrir con valores del agente se precargan los campos, en el mismo render en que `open` cambia
  // (sin valores, el diálogo se abre como siempre).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && initialValues) {
      setPaymentMethod(initialValues.forma_pago ?? 'efectivo')
      setMonto(initialValues.monto !== undefined ? initialValues.monto.toFixed(2) : '0.00')
      setObservacion(initialValues.observacion ?? '')
      if (initialValues.sucursal_id !== undefined) setIdSucursal(String(initialValues.sucursal_id))
    }
  }

  // Mientras el diálogo está abierto, el agente puede llenar el formulario (nunca registrar la venta).
  useAgentTools(
    'venta-cliente-dialog',
    open
      ? buildVentaClienteDialogTools({
          // Solo se conoce la lista de sucursales cuando el diálogo la pide y ya cargó.
          getSucursalIds: () =>
            !necesitaSucursal ? [] : cargandoSucursales || errorSucursales ? undefined : sucursalesActivas.map((s) => s.id),
          getValues: () => ({
            forma_pago: paymentMethod,
            monto: Number(monto),
            observacion,
            ...(necesitaSucursal && sucursalSeleccionada ? { sucursal_id: Number(sucursalSeleccionada) } : {}),
          }),
          setValues: (values) => {
            if (values.forma_pago !== undefined) setPaymentMethod(values.forma_pago)
            if (values.monto !== undefined) { setMonto(values.monto.toFixed(2)); setMontoError('') }
            if (values.observacion !== undefined) setObservacion(values.observacion)
            if (values.sucursal_id !== undefined) setIdSucursal(String(values.sucursal_id))
          },
        })
      : null,
  )

  const handleSubmit = async (): Promise<boolean> => {
    if (necesitaSucursal && !sucursalSeleccionada) {
      toast.error('Selecciona la sucursal para registrar la venta')
      return false
    }
    const montoNum = Number(monto)
    if (isNaN(montoNum) || montoNum < 0) {
      setMontoError('El monto debe ser un número válido mayor o igual a 0')
      return false
    }
    setMontoError('')

    const estado = paymentMethod === 'credito' ? 'PENDIENTE' : 'PAGADA'
    const id_forma_pago = paymentMethod === 'credito' ? 2 : 1

    try {
      await crearVenta({
        ...(necesitaSucursal ? { id_sucursal: Number(sucursalSeleccionada) } : {}),
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
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al crear la venta'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Registrar venta» tras un clic de confirmación.
  useAgentTools(
    'venta-cliente-dialog-guardar',
    open
      ? [
          commitTool({
            name: 'confirmar_venta_cliente',
            description: 'Registra la venta del formulario abierto en la ficha del cliente (presiona Registrar venta).',
            validar: () => {
              if (isPending) return 'Ya se esta registrando.'
              if (necesitaSucursal && (cargandoSucursales || errorSucursales || !sucursalSeleccionada)) return 'Falta elegir la sucursal de la venta.'
              const montoNum = Number(monto)
              return isNaN(montoNum) || montoNum < 0 ? 'El monto debe ser un numero mayor o igual a 0.' : null
            },
            texto: () => `Registrar una venta de Q${Number(monto).toFixed(2)} (${paymentMethod}) a ${clienteNombre}`,
            run: handleSubmit,
          }),
        ]
      : null,
  )

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar venta — {clienteNombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {necesitaSucursal && (
            <Field>
              <FieldLabel htmlFor="venta-sucursal">Sucursal</FieldLabel>
              <Select id="venta-sucursal" value={sucursalSeleccionada}
                onChange={event => setIdSucursal(event.target.value)}
                disabled={isPending || cargandoSucursales || errorSucursales}>
                <option value="">{cargandoSucursales ? 'Cargando sucursales…' : 'Selecciona una sucursal'}</option>
                {sucursalesActivas.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </Select>
              {errorSucursales ? (
                <div role="alert" className="text-sm text-destructive">
                  No se pudieron cargar las sucursales.
                  <Button type="button" variant="link" onClick={() => void refetch()}>Reintentar</Button>
                </div>
              ) : !cargandoSucursales && sucursalesActivas.length === 0 ? (
                <p role="alert" className="text-sm text-destructive">No hay sucursales activas para registrar la venta.</p>
              ) : null}
            </Field>
          )}
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
            <FieldError errors={montoError ? [{ message: montoError }] : []} />
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
          <Button type="button" onClick={() => { void handleSubmit() }} disabled={isPending || (necesitaSucursal && (cargandoSucursales || errorSucursales || !sucursalSeleccionada))}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Registrando…' : 'Registrar venta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
