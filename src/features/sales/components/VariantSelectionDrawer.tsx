import { useCallback } from 'react'
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { ShoppingCart } from "lucide-react"
import type { FC } from "react"
import imageUrl from '@/assets/img.jpg'
import { cn } from '@/lib/utils'
import { getStockBadgeClassDrawer, getStockStatus, getStockTextClass } from '@/lib/stock-status'

type Props = {
    item: Product
    variantSelected: ProductVariant | null
    onVariantChange: (variant: ProductVariant) => void
    onAddToCart: () => void
}

const VariantSelectionDrawer: FC<Props> = ({ item, variantSelected, onVariantChange, onAddToCart }) => {
    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = imageUrl
    }, [])
    const selectedStockStatus = variantSelected ? getStockStatus(variantSelected.stock) : null

    return (
        <DrawerContent className="w-full bg-white sm:max-w-md">
            <DrawerHeader className="mx-auto w-full max-w-md">
                <DrawerTitle>Elige la variante</DrawerTitle>
                <DrawerDescription className="text-center">
                    Cada variante tiene precio y stock diferente
                </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="mx-2 flex-1 rounded-t-[20px] bg-white pt-2 sm:mx-5">
                <div className='grid flex-1 grid-cols-1 gap-4 min-[430px]:grid-cols-2'>
                    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-white min-[430px]:aspect-auto">
                        <div className="absolute inset-0 ">
                            <img
                                src={item.image ?? imageUrl}
                                className="w-full h-full object-cover blur-md opacity-90 transform scale-105 "
                                alt=""
                                onError={handleImageError}
                            />
                        </div>
                        <img
                            src={item.image ?? imageUrl}
                            className="relative z-10 h-[97%] w-[90%] rounded-3xl object-cover drop-shadow-md"
                            alt="imagen del producto"
                            onError={handleImageError}
                        />
                    </div>
                    <div>
                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                        <p className="mb-1 text-lg font-medium leading-tight sm:text-xl">{item.name}</p>
                        <div className="h-px bg-stone-200 my-2" />
                        <p className="text-2xl font-medium text-primary">Q{variantSelected?.price}</p>
                        <p className="text-sm text-stone-500">
                            {variantSelected ? `Talla: ${variantSelected.size}` : 'Selecciona una talla'}
                        </p>
                        <p className={cn("text-sm", variantSelected ? getStockTextClass(variantSelected.stock) : "text-stone-500")}>
                            Stock disponible: {variantSelected?.stock ?? '-'} unidades
                        </p>
                        {selectedStockStatus === 'low' && (
                            <p className="text-xs text-yellow-700 font-medium mt-1">Últimas unidades</p>
                        )}
                        {selectedStockStatus === 'out' && (
                            <p className="text-xs text-destructive font-medium mt-1">Agotado</p>
                        )}
                    </div>
                </div>

                <div className='mt-4 grid w-full grid-cols-[repeat(auto-fit,minmax(3rem,1fr))] items-center justify-center gap-2 sm:gap-3'>
                    {item.variants.map((variant) => (
                        <button
                            type="button"
                            className={cn(
                                badgeVariants({ variant: variant.id !== variantSelected?.id ? 'secondary' : 'default' }),
                                "flex h-10 w-full cursor-pointer items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60",
                                getStockBadgeClassDrawer(variant.stock)
                            )}
                            key={variant.id}
                            aria-label={`Seleccionar talla ${variant.size}, stock ${variant.stock}`}
                            aria-pressed={variant.id === variantSelected?.id}
                            disabled={variant.stock <= 0}
                            onClick={() => onVariantChange(variant)}
                        >
                            {variant.size}
                        </button>
                    ))}
                </div>
                {item.variants.filter(v => v.stock > 0).length === 0 && (
                    <p className="text-xs text-destructive text-center mt-2">Ninguna variante disponible. Producto agotado.</p>
                )}
                {item.variants.filter(v => v.stock <= 0).length > 0 && (
                    <p className="text-xs text-stone-400 mt-2">Algunas variantes no tienen stock disponible.</p>
                )}
            </DrawerBody>
            <DrawerFooter className="mx-2 flex flex-col items-center justify-center sm:mx-5">
                <Button
                    size={"lg"}
                    className="w-full"
                    disabled={!variantSelected || variantSelected.stock <= 0}
                    onClick={onAddToCart}
                >
                    <ShoppingCart className="w-5! h-10!" size={30} strokeWidth={3} />
                    <p className="font-bold">Agregar al carrito</p>
                </Button>
                <p className="text-xs text-stone-400 text-center mt-2">Revisa la variante y cantidad antes de confirmar</p>
            </DrawerFooter>
        </DrawerContent>
    )
}

export default VariantSelectionDrawer
