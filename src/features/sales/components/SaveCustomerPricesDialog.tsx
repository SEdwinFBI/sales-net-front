import { useState, useDeferredValue, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/helpers/money'
import { useCustomerPricesStore } from '@/features/customers/store/useCustomerPricesStore'
import type { CustomerProductPrice } from '@/features/customers/types/customer-prices'
import type { LastSale } from '../types/sales'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/features/core/store/auth-store'
import CustomerSelect from './CustomerSelect'
import { useCustomers } from '@/features/customers'
import { savePreciosPostVenta } from '@/features/customers/services/clientePreciosService'
import QuickClienteDialog from '@/features/customers/components/QuickClienteDialog'
import { toast } from 'sonner'
import { BookmarkCheck, Check, Sparkles, UserPlus } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  lastSale: LastSale
}

export default function SaveCustomerPricesDialog({ open, onClose, lastSale }: Props) {
  const queryClient = useQueryClient()
  const sucursalId = useAuthStore((state) => state.user?.sucursalActual?.id)
  const savePrices = useCustomerPricesStore((state) => state.savePrices)

  const initialCustomerId = lastSale.customerId ? String(lastSale.customerId) : ''
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId)
  const [customerSearch, setCustomerSearch] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  const deferredCustomerSearch = useDeferredValue(customerSearch.trim())
  const { data: customers, isLoading: loadingCustomers } = useCustomers({
    search: deferredCustomerSearch,
    activeOnly: true,
    pageSize: 50,
  })

  // Por defecto, preseleccionamos todos los artículos que tuvieron descuento en la venta
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const item of lastSale.items) {
      if (item.discount > 0) {
        set.add(item.id)
      }
    }
    // Si ninguno tuvo descuento, seleccionamos todos para permitir guardar precios normales si se desea
    if (set.size === 0) {
      for (const item of lastSale.items) {
        set.add(item.id)
      }
    }
    return set
  })

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const selectedCustomerObj = customers?.find((c) => String(c.id) === selectedCustomerId)
  const currentCustomerName = selectedCustomerObj?.name ?? lastSale.customerName ?? 'Cliente'

  const handleSave = () => {
    if (!selectedCustomerId) {
      toast.warning('Selecciona o crea un cliente para guardar los precios.')
      return
    }

    const customerIdNum = Number(selectedCustomerId)
    if (!customerIdNum) {
      toast.error('Identificador de cliente no válido.')
      return
    }

    const itemsToSave: CustomerProductPrice[] = lastSale.items
      .filter((item) => selectedItemIds.has(item.id))
      .map((item) => {
        const precioPactado = item.price - item.discount
        return {
          id: `${customerIdNum}::${item.variantId}`,
          customerId: customerIdNum,
          customerName: currentCustomerName,
          variantId: item.variantId,
          productId: item.productId,
          productName: item.name,
          variantSize: item.size,
          precioPactado,
          precioCatalogo: item.basePrice ?? item.price,
          descuentoAplicado: item.discount > 0 ? item.discount : Math.max(0, (item.basePrice ?? item.price) - precioPactado),
          tipoDescuentoOrigen:
            item.discountType === 'INDIVIDUAL'
              ? 'INDIVIDUAL'
              : item.discountType === 'MAYORISTA'
                ? 'MAYORISTA'
                : 'MANUAL',
          fechaRegistro: new Date().toISOString(),
          idVenta: lastSale.idVenta,
        }
      })

    if (itemsToSave.length === 0) {
      toast.warning('Selecciona al menos un artículo para guardar.')
      return
    }

    // Persistir localmente para disponibilidad inmediata en el POS
    savePrices(itemsToSave)

    // Persistir en base de datos backend
    const apiItems = itemsToSave.map((it) => ({
      id_variante: it.variantId,
      precio: it.precioPactado,
    }))
    savePreciosPostVenta(customerIdNum, apiItems, sucursalId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.precios(customerIdNum) })
      })
      .catch((err) => {
        console.warn('Error al persistir precios pactados en backend:', err)
      })

    setHasSaved(true)
    toast.success(
      `Se guardaron ${itemsToSave.length} precios para ${currentCustomerName}.`
    )
    setTimeout(() => {
      onClose()
    }, 900)
  }

  const baseInputId = useId()

  return (
    <>
      <Dialog
        open={open && !quickCreateOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !quickCreateOpen) onClose()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookmarkCheck className="size-5" />
              </div>
              <div>
                <DialogTitle>Guardar precios para el cliente</DialogTitle>
                <DialogDescription>
                  Selecciona los artículos cuyos precios quieres guardar para próximas compras.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-1 py-2">
            {/* Selección de cliente */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${baseInputId}-customer`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </label>
                <button
                  type="button"
                  onClick={() => setQuickCreateOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <UserPlus className="size-3.5" />
                  Nuevo cliente
                </button>
              </div>

              <CustomerSelect
                customers={customers ?? []}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                onSearch={setCustomerSearch}
                loading={loadingCustomers}
                onQuickCreate={() => setQuickCreateOpen(true)}
              />

              {selectedCustomerId ? (
                <p className="text-xs text-muted-foreground">
                  Guardar para: <strong className="text-foreground">{currentCustomerName}</strong>
                </p>
              ) : (
                <p className="text-xs text-warning">
                  Selecciona o crea un cliente.
                </p>
              )}
            </div>

            {/* Listado de artículos de la venta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Artículos de la venta ({lastSale.items.length})</span>
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden bg-card">
                {lastSale.items.map((item) => {
                  const isChecked = selectedItemIds.has(item.id)
                  const precioFinal = item.price - item.discount
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/40 ${
                        isChecked ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="size-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.name} <span className="text-xs text-muted-foreground font-normal">({item.size})</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <span>Precio antes del descuento: {formatCurrency(item.price)}</span>
                            {item.discount > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-emerald-300 bg-emerald-50 text-emerald-700">
                                −{formatCurrency(item.discount)} ({item.discountType})
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Precio a guardar</p>
                        <p className="text-base font-bold text-primary tabular-nums">
                          {formatCurrency(precioFinal)}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} disabled={hasSaved}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedCustomerId || selectedItemIds.size === 0 || hasSaved}
              className="gap-1.5"
            >
              {hasSaved ? (
                <>
                  <Check className="size-4" />
                  Precios guardados
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Guardar precios ({selectedItemIds.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickClienteDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(nuevoCliente) => {
          setSelectedCustomerId(String(nuevoCliente.id))
          setQuickCreateOpen(false)
        }}
      />
    </>
  )
}
