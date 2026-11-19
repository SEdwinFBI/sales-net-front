import { useState, type FC } from 'react'
import type { CartItem } from '../types/sales'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/helpers/money'

type CartItemProps = {
  item: CartItem
  onRemove: (id: string) => void
  onIncrease: (id: string) => void
  onDecrease: (id: string) => void
  onSetQty: (id: string, qty: number) => void
}

const CartItemComponent: FC<CartItemProps> = ({ item, onRemove, onIncrease, onDecrease, onSetQty }) => {
  const [isQtyEmpty, setIsQtyEmpty] = useState(false)
  const isSpecialCustomerPrice = item.discountType === 'CLIENTE'
  const precioBase = item.basePrice ?? item.price
  const precioFinal = item.discount > 0 ? item.price - item.discount : item.price
  const subtotal = precioFinal * item.qty
  const ahorroCliente = isSpecialCustomerPrice && precioBase > item.price ? precioBase - item.price : 0

  const handleQtyChange = (value: string) => {
    setIsQtyEmpty(value === '')
    if (value === '') return

    const nextQty = Number(value)
    if (!Number.isFinite(nextQty)) return

    onSetQty(item.id, nextQty)
  }

  return (
    <div
      key={item.id}
      className="grid gap-3 rounded-2xl border border-border/75 bg-card p-3.5 shadow-2xs transition-colors hover:border-border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-heading text-sm font-semibold text-foreground">
              {item.name}
            </p>
            <Badge variant="secondary" className="px-2 py-0 text-[10.5px] tabular-nums">
              Talla {item.size}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
        </div>

        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Quitar ${item.name} talla ${item.size}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Disminuir cantidad de ${item.name}`}
            onClick={() => onDecrease(item.id)}
          >
            <Minus />
          </Button>
          <Input
            aria-label={`Cantidad de ${item.name}`}
            className="h-7 w-14 rounded-lg border-transparent bg-card px-1.5 text-center text-xs font-semibold tabular-nums shadow-none"
            type="number"
            inputMode="numeric"
            min={1}
            max={item.stock}
            step={1}
            value={isQtyEmpty ? '' : item.qty}
            onChange={(event) => handleQtyChange(event.target.value)}
            onBlur={() => setIsQtyEmpty(false)}
          />
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`Aumentar cantidad de ${item.name}`}
            onClick={() => onIncrease(item.id)}
            disabled={item.qty >= item.stock}
          >
            <Plus />
          </Button>
        </div>

        <div className="text-left min-[420px]:text-right">
          {isSpecialCustomerPrice ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5 min-[420px]:justify-end">
                <Badge className="border-indigo-500/25 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300">
                  Precio cliente {ahorroCliente > 0 ? `−${formatCurrency(ahorroCliente)} c/u` : ''}
                </Badge>
                {ahorroCliente > 0 && (
                  <p className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatCurrency(precioBase)}
                  </p>
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-successful tabular-nums">
                {formatCurrency(precioFinal)} c/u
              </p>
            </>
          ) : item.discount > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5 min-[420px]:justify-end">
                {item.discountType === 'INDIVIDUAL' && (
                  <Badge className="border-primary/25 bg-primary/10 text-primary">
                    Individual −{formatCurrency(item.discount)} c/u
                  </Badge>
                )}
                {item.discountType === 'MAYORISTA' && (
                  <Badge className="border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-300">
                    Mayorista −{formatCurrency(item.discount)} c/u
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatCurrency(item.price)}
                </p>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-successful tabular-nums">
                {formatCurrency(precioFinal)} c/u
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(item.price)} c/u
            </p>
          )}
          <p className="mt-0.5 font-heading text-base font-bold text-primary tabular-nums">
            {formatCurrency(subtotal)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CartItemComponent
