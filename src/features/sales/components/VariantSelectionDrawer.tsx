import { useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Product, ProductVariant } from '@/features/sales/types/sales'
import { Check, ShoppingCart, Store } from 'lucide-react'
import type { FC } from 'react'
import imageUrl from '@/assets/img.jpg'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/helpers/money'
import { getStockBadgeClassDrawer, getStockStatus, getStockTextClass } from '@/lib/stock-status'
import StockLevelMeter from './StockLevelMeter'

type Props = {
  showStockMeter?: boolean
  item: Product
  variantSelected: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
  checkedVariantIds: number[]
  onVariantCheck: (variant: ProductVariant) => void
  onAddToCart: () => void
  onCheckOtherStores: () => void
}

const VariantSelectionDrawer: FC<Props> = ({
  showStockMeter = false,
  item,
  variantSelected,
  onVariantChange,
  checkedVariantIds,
  onVariantCheck,
  onAddToCart,
  onCheckOtherStores,
}) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = imageUrl
  }, [])
  const selectedStockStatus = variantSelected ? getStockStatus(variantSelected.stock) : null

  return (
    <DrawerContent className="w-full sm:max-w-md">
      <DrawerHeader className="text-center">
        <DrawerTitle>Elige la variante</DrawerTitle>
        <DrawerDescription>
          Cada talla cuenta con su propio precio y stock disponible
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border/70 bg-muted/30 p-3 min-[430px]:grid-cols-[0.95fr_1.15fr]">
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-card min-[430px]:aspect-square">
            <img
              src={item.image ?? imageUrl}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-md"
              alt=""
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
            <img
              src={item.image ?? imageUrl}
              className="relative z-10 h-[92%] w-[92%] rounded-xl object-cover shadow-md"
              alt={item.name}
              decoding="async"
              onError={handleImageError}
            />
          </div>
          <div className="flex flex-col justify-between py-0.5">
            <div>
              <Badge variant="secondary" className="mb-1.5 text-[10.5px]">
                {item.category}
              </Badge>
              <p className="font-heading text-base font-bold leading-snug text-foreground sm:text-lg">
                {item.name}
              </p>
            </div>

            <div className="mt-3 space-y-1 border-t border-border/60 pt-2.5">
              <p className="font-heading text-2xl font-bold text-primary tabular-nums">
                {variantSelected ? formatCurrency(variantSelected.price) : '—'}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {variantSelected ? `Talla seleccionada: ${variantSelected.size}` : 'Selecciona una talla'}
              </p>
              <p className={cn('text-xs font-semibold tabular-nums', variantSelected ? getStockTextClass(variantSelected.stock) : 'text-muted-foreground')}>
                Stock disponible: {variantSelected?.stock ?? '—'} unidades
              </p>
              {selectedStockStatus === 'low' && (
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Últimas unidades disponibles
                </p>
              )}
              {selectedStockStatus === 'out' && (
                <p className="text-[11px] font-semibold text-destructive">Agotado</p>
              )}
            </div>
          </div>
        </div>

        {showStockMeter && <StockLevelMeter quantity={item.variants.reduce((sum, variant) => sum + variant.stock, 0)} />}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Tallas disponibles</span>
            {checkedVariantIds.length > 0 && (
              <span className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary tabular-nums">
                {checkedVariantIds.length} seleccionadas
              </span>
            )}
          </div>

          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(3.6rem,1fr))] gap-2">
            {item.variants.map((variant) => {
              const isSelected =
                checkedVariantIds.length > 0
                  ? checkedVariantIds.includes(variant.id)
                  : variant.id === variantSelected?.id
              const isChecked = checkedVariantIds.includes(variant.id)

              return (
                <div key={variant.id} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={cn(
                      'flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.06]',
                      getStockBadgeClassDrawer(variant.stock),
                    )}
                    aria-label={`Seleccionar talla ${variant.size}, stock ${variant.stock}`}
                    aria-pressed={isSelected}
                    disabled={variant.stock <= 0}
                    onClick={() => onVariantChange(variant)}
                  >
                    {variant.size}
                  </button>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    aria-label={`Agregar talla ${variant.size} a la selección múltiple`}
                    disabled={variant.stock <= 0}
                    onClick={() => onVariantCheck(variant)}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full border transition-colors',
                        isChecked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/45 bg-card hover:border-primary/60',
                      )}
                    >
                      {isChecked && <Check className="size-3" aria-hidden="true" />}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {item.variants.filter((v) => v.stock > 0).length === 0 && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-medium text-destructive">
            Ninguna variante disponible. Producto agotado.
          </p>
        )}
        {item.variants.filter((v) => v.stock <= 0).length > 0 && item.variants.some((v) => v.stock > 0) && (
          <p className="text-xs text-muted-foreground">
            Algunas tallas no tienen stock disponible en esta sucursal.
          </p>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={onCheckOtherStores}
        >
          <Store className="size-4 text-primary" />
          Ver existencias en otras tiendas
        </Button>
      </DrawerBody>

      <DrawerFooter>
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={
            checkedVariantIds.length > 0
              ? !item.variants.some((variant) => checkedVariantIds.includes(variant.id) && variant.stock > 0)
              : !variantSelected || variantSelected.stock <= 0
          }
          onClick={onAddToCart}
        >
          <ShoppingCart className="size-5" aria-hidden="true" />
          <span>
            {checkedVariantIds.length > 1
              ? `Agregar ${checkedVariantIds.length} tallas al carrito`
              : 'Agregar al carrito'}
          </span>
        </Button>
      </DrawerFooter>
    </DrawerContent>
  )
}

export default VariantSelectionDrawer
