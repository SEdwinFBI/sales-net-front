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
    <Button
      className="fixed inset-x-3 bottom-4 z-30 mx-auto flex h-13 w-auto max-w-md items-center justify-between rounded-2xl px-4 shadow-elevated transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:min-w-76"
      size="md"
      onClick={openCart}
      aria-label={`Abrir carrito con ${totalItems} items por ${formatCurrency(total)}`}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-8 items-center justify-center rounded-xl bg-white/15">
          <ShoppingCart className="size-4.5" aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-5 text-white tabular-nums shadow-xs ring-2 ring-primary">
            {totalItems}
          </span>
        </span>

        <div className="text-left leading-tight">
          <span className="block text-sm font-semibold">Ver carrito</span>
          <span className="block text-[11px] font-normal text-primary-foreground/80 tabular-nums">
            {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}
          </span>
        </div>
      </div>

      <span className="rounded-xl bg-white/15 px-3 py-1 font-heading text-base font-bold tabular-nums">
        {formatCurrency(total)}
      </span>
    </Button>
  )
}

export default CartButton
