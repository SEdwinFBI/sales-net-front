import { Minus, Plus, Trash2 } from 'lucide-react'

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

import { useSalesStore } from '../hooks/useSalesStore'
import { formatCurrency } from '@/helpers/money'


const CartDrawer = () => {
  const cartOpen = useSalesStore((state) => state.cartOpen)
  const items = useSalesStore((state) => state.items)
  const openCart = useSalesStore((state) => state.openCart)
  const closeCart = useSalesStore((state) => state.closeCart)
  const openDialog = useSalesStore((state) => state.openDialog)
  const increaseQty = useSalesStore((state) => state.increaseQty)
  const decreaseQty = useSalesStore((state) => state.decreaseQty)
  const removeItem = useSalesStore((state) => state.removeItem)

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

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
      <DrawerContent>
        <DrawerHeader className="mx-auto w-full max-w-2xl">
          <DrawerTitle>Carrito</DrawerTitle>
          <DrawerDescription>
            {totalItems > 0
              ? `${totalItems} item${totalItems === 1 ? '' : 's'} en la venta`
              : 'Tu carrito esta vacio.'}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="mx-auto w-full max-w-2xl pt-2">
          {items.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
              Agrega productos desde la lista para empezar la venta.
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-[1rem] border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category}
                      </p>
                    </div>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => decreaseQty(item.id)}
                      >
                        <Minus />
                      </Button>
                      <span className="min-w-8 text-center font-medium">
                        {item.qty}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => increaseQty(item.id)}
                      >
                        <Plus />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} c/u
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter className="mx-auto w-full max-w-2xl justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(total)}</p>
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
