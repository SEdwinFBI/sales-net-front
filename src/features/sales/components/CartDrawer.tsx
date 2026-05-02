

import { Button } from '@/components/ui/button'
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
  const removeItem = useSalesStore((state) => state.removeItem)



  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)

  return (
    <Drawer
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
              : 'El carrito esta vacio.'}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="mx-auto w-full max-w-2xl pt-2 overflow-y-auto max-h-[calc(100vh-15rem)]">
          {items.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
              Agrega productos para empezar la venta.
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onIncrease={increaseQty}
                  onDecrease={decreaseQty}
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


