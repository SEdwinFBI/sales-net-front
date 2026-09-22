

import { useState, useEffect, useDeferredValue } from 'react'
import { PackageOpen, ShoppingCart, Sparkles, UserCheck, Tag, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

import { useSalesStore } from '../store/useSalesStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { formatCurrency } from '@/helpers/money'
import CartItemComponent from './CartItemComponent'
import CustomerSelect from './CustomerSelect'
import { useCustomers } from '@/features/customers'
import { useCustomerPricesStore } from '@/features/customers/store/useCustomerPricesStore'
import { usePreciosCliente } from '@/features/customers/hooks/usePreciosCliente'
import QuickClienteDialog from '@/features/customers/components/QuickClienteDialog'
import { selectTotal, selectTotalDiscount, selectTotalItems } from '../utils/utilsSales'
import type { CartPricingResult } from '../utils/pricing-engine'

type Props = {
  pricing?: CartPricingResult
}

const CartDrawer = ({ pricing }: Props) => {
  const cartOpen = useSalesStore((state) => state.cartOpen)
  const items = useSalesStore((state) => state.items)
  const openCart = useSalesStore((state) => state.openCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const openDialog = useSalesStore((state) => state.openDialog)
  const increaseQty = useSalesStore((state) => state.increaseQty)
  const decreaseQty = useSalesStore((state) => state.decreaseQty)
  const setQty = useSalesStore((state) => state.setQty)
  const removeItem = useSalesStore((state) => state.removeItem)
  const setVoiceTranscript = useSalesStore((state) => state.setVoiceTranscript)
  const registerVoiceReset = useSalesStore((state) => state.registerVoiceReset)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const totalDiscount = useSalesStore(selectTotalDiscount)

  const activeTier = pricing?.activeTier ?? null
  const nextTierHint = pricing?.nextTierHint ?? null

  const customerPricingEnabled = useSalesStore((state) => state.customerPricingEnabled)
  const setCustomerPricingEnabled = useSalesStore((state) => state.setCustomerPricingEnabled)
  const selectedCustomerId = useSalesStore((state) => state.selectedCustomerId)
  const setSelectedCustomerId = useSalesStore((state) => state.setSelectedCustomerId)

  const [customerSearch, setCustomerSearch] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const handleOpenQuickCreate = () => {
    closeCart()
    setQuickCreateOpen(true)
  }

  const handleCloseQuickCreate = () => {
    setQuickCreateOpen(false)
    openCart()
  }

  const handleSuccessQuickCreate = (newC: { id: number | string }) => {
    setSelectedCustomerId(String(newC.id))
    setQuickCreateOpen(false)
    openCart()
  }

  const deferredCustomerSearch = useDeferredValue(customerSearch.trim())
  const { data: customers, isLoading: loadingCustomers } = useCustomers({
    search: deferredCustomerSearch,
    activeOnly: true,
    pageSize: 50,
  })

  const getCustomerPrices = useCustomerPricesStore((state) => state.getCustomerPrices)
  const saveLocalPrices = useCustomerPricesStore((state) => state.savePrices)
  const customerPricesList = selectedCustomerId
    ? getCustomerPrices(Number(selectedCustomerId))
    : []

  const selectedCustomerObj = customers?.find((c) => String(c.id) === selectedCustomerId)
  const itemsWithCustomerPriceCount = items.filter((item) => item.discountType === 'CLIENTE').length

  // Sincronizar precios configurados en backend para este cliente
  const { data: remoteCustomerPrices, isLoading: loadingCustomerPrices } = usePreciosCliente(
    customerPricingEnabled && selectedCustomerId ? Number(selectedCustomerId) : 0
  )

  useEffect(() => {
    if (remoteCustomerPrices && remoteCustomerPrices.length > 0 && selectedCustomerId) {
      const configurados = remoteCustomerPrices.filter(
        (p) => p.tiene_config && p.precio_cliente !== null
      )
      if (configurados.length > 0) {
        saveLocalPrices(
          configurados.map((p) => ({
            id: `${selectedCustomerId}::${p.id_variante}`,
            customerId: Number(selectedCustomerId),
            customerName: selectedCustomerObj?.name ?? 'Cliente',
            variantId: p.id_variante,
            productId: p.id_articulo,
            productName: p.articulo,
            variantSize: p.talla,
            precioPactado: Number(p.precio_cliente!),
            precioCatalogo: Number(p.precio_base),
            descuentoAplicado: Math.max(0, Number(p.precio_base) - Number(p.precio_cliente ?? p.precio_base)),
            tipoDescuentoOrigen: 'MANUAL',
            fechaRegistro: p.fecha_actualizacion || new Date().toISOString(),
          }))
        )
      }
    }
  }, [remoteCustomerPrices, selectedCustomerId, selectedCustomerObj, saveLocalPrices])

  const speech = useSpeechRecognition({ enabled: cartOpen })

  useEffect(() => {
    setVoiceTranscript(speech.transcript)
  }, [speech.transcript, setVoiceTranscript])

  useEffect(() => {
    registerVoiceReset(speech.resetTranscript)
    return () => registerVoiceReset(null)
  }, [speech.resetTranscript, registerVoiceReset])

  return (
    <>
      <Drawer
      shouldScaleBackground={false}
      open={cartOpen}
      onOpenChange={(open) => {
        if (open) {
          openCart()
          return
        }

        closeCart()
      }}
    >
      <DrawerContent className='w-full'>
        <DrawerHeader className="mx-auto w-full max-w-2xl">
          <DrawerTitle>Carrito de Compras</DrawerTitle>
          <DrawerDescription>
            {totalItems > 0
              ? `${totalItems} unidad${totalItems === 1 ? '' : 'es'} en la venta`
              : 'El carrito está vacío.'}
          </DrawerDescription>
          {activeTier && (
            <Badge className="w-fit border-transparent bg-warning/10 text-warning">
              <PackageOpen className="size-3.5" />
              Mayoreo activo: {activeTier.unidades_min}
              {activeTier.unidades_max === null
                ? '+ unidades'
                : activeTier.unidades_max === activeTier.unidades_min
                  ? ' unidades'
                  : `–${activeTier.unidades_max} unidades`}
            </Badge>
          )}
        </DrawerHeader>

        {/* Transcripción  */}
        {/* {speech.isSupported && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-1">
            <SpeechTranscriptBox
              transcript={speech.transcript}
              interimTranscript={speech.interimTranscript}
              isListening={speech.isListening}
              error={speech.error}
              isSupported={speech.isSupported}
              audioLevel={speech.audioLevel}
              isAtLimit={speech.isAtLimit}
              onReset={speech.resetTranscript}
              onStart={speech.startListening}
            />
          </div>
        )} */}

        <DrawerBody className="mx-auto w-full max-w-2xl pt-2 overflow-y-auto max-h-[calc(100dvh-16rem)] min-h-[6rem]">
          {/* Panel: Aplicar precios de cliente */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5 mb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-primary" />
                <span className="text-sm font-medium">Usar precios del cliente</span>
              </div>
              <Switch
                checked={customerPricingEnabled}
                onCheckedChange={setCustomerPricingEnabled}
              />
            </div>

            {customerPricingEnabled && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <CustomerSelect
                  customers={customers ?? []}
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  onSearch={setCustomerSearch}
                  loading={loadingCustomers}
                  onQuickCreate={handleOpenQuickCreate}
                />

                {selectedCustomerId ? (
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    {loadingCustomerPrices ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin text-primary" />
                        Cargando precios...
                      </span>
                    ) : (
                      <span>
                        {itemsWithCustomerPriceCount > 0 ? (
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {itemsWithCustomerPriceCount} artículo{itemsWithCustomerPriceCount === 1 ? '' : 's'} con precio del cliente
                          </strong>
                        ) : (
                          'Ningún artículo del carrito tiene precio personalizado.'
                        )}
                      </span>
                    )}
                    {customerPricesList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openDialog('customer-prices')}
                        className="text-primary hover:underline text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                      >
                        <Tag className="size-3" />
                        Ver precios ({customerPricesList.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-warning px-1">
                    Selecciona un cliente para usar sus precios.
                  </p>
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState icon={ShoppingCart} size="sm" title="Agrega productos para empezar la venta." />
          ) : (
            <div className="grid gap-2">
              {items.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onIncrease={increaseQty}
                  onDecrease={decreaseQty}
                  onSetQty={setQty}
                />
              ))}
            </div>
          )}
        </DrawerBody>

        {nextTierHint && items.length > 0 && (
          <div
            aria-live="polite"
            className="mx-auto w-full max-w-2xl px-4"
          >
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
              <Sparkles className="size-4 shrink-0" />
              <span>
                Agrega {nextTierHint.unitsMissing} unidad{nextTierHint.unitsMissing === 1 ? '' : 'es'} más
                y activas el descuento mayorista.
              </span>
            </div>
          </div>
        )}

        <DrawerFooter className="mx-auto w-full max-w-2xl justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl  text-primary font-bold">{formatCurrency(total)}</p>
            {totalDiscount > 0 && (
              <p className="text-xs font-medium text-successful">
                Ahorro total: −{formatCurrency(totalDiscount)}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openDialog('clear-cart')}
              disabled={items.length === 0}
            >
              Vaciar
            </Button>
            <Button
              onClick={() => openDialog('checkout')}
              disabled={items.length === 0}
            >
              Cobrar
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <QuickClienteDialog
      open={quickCreateOpen}
      onClose={handleCloseQuickCreate}
      onSuccess={handleSuccessQuickCreate}
    />
  </>
  )
}

export default CartDrawer
