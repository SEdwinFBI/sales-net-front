

import { PackageOpen, ShoppingCart, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { formatCurrency } from '@/helpers/money'
import CartItemComponent from './CartItemComponent'
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

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)
  const totalDiscount = useSalesStore(selectTotalDiscount)

  const activeTier = pricing?.activeTier ?? null
  const nextTierHint = pricing?.nextTierHint ?? null

  return (
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

        <DrawerBody className="mx-auto w-full max-w-2xl pt-2 overflow-y-auto max-h-[calc(100dvh-16rem)] min-h-[6rem]">
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
  )
}

export default CartDrawer
