import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useSalesStore } from '../hooks/useSalesStore'
import { formatCurrency } from '@/helpers/money'




const CartButton = () => {
  const items = useSalesStore((state) => state.items)
  const openCart = useSalesStore((state) => state.openCart)

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  return (
    <>

      <Button
        className="fixed right-0  max-[420px]:inset-x-0  bottom-0 mx-2 mb-10 flex items-center justify-between rounded-[1rem] px-4"
        size="md"
        onClick={openCart}
      >
        <div className="flex items-center gap-3">
          <span className="relative">
            <ShoppingCart className="font-bold" />
            <span className="absolute -top-2 -right-2 rounded-full bg-green-700 px-1.5 text-xs text-white">
              {totalItems}
            </span>
          </span>

          <span>Carrito ({totalItems} items)</span>
        </div>

        <span className="font-semibold">{formatCurrency(total)}</span>
      </Button>
    </>
  )
}

export default CartButton
