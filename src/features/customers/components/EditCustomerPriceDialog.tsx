import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { formatCurrency } from '@/helpers/money'
import { useUpsertPreciosCliente } from '../hooks/usePreciosCliente'
import { useCustomerPricesStore } from '../store/useCustomerPricesStore'
import type { ClienteVariantePrecioResponse } from '../types/customer-prices'
import { toast } from 'sonner'
import { Pencil, Tag, Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  customerId: number
  customerName?: string
  variantItem: ClienteVariantePrecioResponse | null
  onSuccess?: () => void
}

export default function EditCustomerPriceDialog({
  open,
  onClose,
  customerId,
  customerName = 'Cliente',
  variantItem,
  onSuccess,
}: Props) {
  const [precioInput, setPrecioInput] = useState('')
  const upsertMutation = useUpsertPreciosCliente(customerId)
  const saveLocalPrice = useCustomerPricesStore((state) => state.savePrices)

  useEffect(() => {
    if (variantItem) {
      const initialVal =
        variantItem.precio_cliente !== null
          ? String(variantItem.precio_cliente)
          : String(variantItem.precio_base)
      setPrecioInput(initialVal)
    }
  }, [variantItem])

  if (!variantItem) return null

  const isConfigured = variantItem.tiene_config

  const handleSave = async () => {
    const nuevoPrecio = Number(precioInput)
    if (!Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0) {
      toast.error('Ingresa un precio mayor que cero.')
      return
    }

    try {
      await upsertMutation.mutateAsync([
        {
          id_variante: variantItem.id_variante,
          precio: nuevoPrecio,
        },
      ])

      // Actualizar también el store local para sincronización inmediata con el carrito
      saveLocalPrice([
        {
          id: `${customerId}::${variantItem.id_variante}`,
          customerId,
          customerName,
          variantId: variantItem.id_variante,
          productId: variantItem.id_articulo,
          productName: variantItem.articulo,
          variantSize: variantItem.talla,
          precioPactado: nuevoPrecio,
          precioCatalogo: variantItem.precio_base,
          descuentoAplicado: Math.max(0, variantItem.precio_base - nuevoPrecio),
          tipoDescuentoOrigen: 'MANUAL',
          fechaRegistro: new Date().toISOString(),
        },
      ])

      if (onSuccess) onSuccess()
      onClose()
    } catch {
      // El error ya lo muestra useUpsertPreciosCliente
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isConfigured ? <Pencil className="size-5" /> : <Tag className="size-5" />}
            </div>
            <div>
              <DialogTitle>
                {isConfigured ? 'Editar precio del cliente' : 'Asignar precio al cliente'}
              </DialogTitle>
              <DialogDescription>
                {customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-sm space-y-1">
            <p className="font-semibold text-foreground">{variantItem.articulo}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Talla: <strong className="text-foreground">{variantItem.talla}</strong></span>
              {variantItem.sku && <span>SKU: {variantItem.sku}</span>}
              <span>Precio de catálogo: <strong className="text-foreground">{formatCurrency(variantItem.precio_base)}</strong></span>
            </div>
          </div>

          <Field>
            <FieldLabel>Precio del cliente (Q)</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={precioInput}
              onChange={(e) => setPrecioInput(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            {Number(precioInput) > 0 && (
              <div className="mt-1 text-xs">
                {Number(precioInput) < variantItem.precio_base ? (
                  <span className="text-emerald-600 font-medium">
                    Ahorro por unidad: {formatCurrency(variantItem.precio_base - Number(precioInput))}
                  </span>
                ) : Number(precioInput) > variantItem.precio_base ? (
                  <span className="text-amber-600 font-medium">
                    Precio superior al de catálogo (+{formatCurrency(Number(precioInput) - variantItem.precio_base)})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Igual al precio de catálogo</span>
                )}
              </div>
            )}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={upsertMutation.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={upsertMutation.isPending} className="gap-1.5">
            {upsertMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {isConfigured ? 'Guardar cambios' : 'Asignar precio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
