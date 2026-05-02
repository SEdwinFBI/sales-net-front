import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useSalesStore } from '../store/useSalesStore'
import { formatCurrency } from '@/helpers/money'
import { selectTotal, selectTotalItems } from '../utils/utilsSales'




const CartButton = () => {
  const openCart = useSalesStore((state) => state.openCart)

  const totalItems = useSalesStore(selectTotalItems)
  const total = useSalesStore(selectTotal)

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
