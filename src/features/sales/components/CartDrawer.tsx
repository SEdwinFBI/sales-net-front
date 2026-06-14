

import { ShoppingCart } from 'lucide-react'
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
import { selectTotal, selectTotalItems } from '../utils/utilsSales'


const CartDrawer = () => {
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
              ? `${totalItems} item${totalItems === 1 ? '' : 's'} en la venta`
              : 'El carrito está vacío.'}
          </DrawerDescription>
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

        <DrawerFooter className="mx-auto w-full max-w-2xl justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl  text-primary font-bold">{formatCurrency(total)}</p>
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


