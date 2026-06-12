import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { ShoppingCart } from "lucide-react"
import type { FC } from "react"

type Props = {
    item: Product
    variantSelected: ProductVariant | null
    onVariantChange: (variant: ProductVariant) => void
    onAddToCart: () => void
}

const VariantSelectionDrawer: FC<Props> = ({ item, variantSelected, onVariantChange, onAddToCart }) => {
    return (
        <DrawerContent className="bg-white w-full">
            <DrawerHeader className="mx-auto w-full max-w-md">
                <DrawerTitle>Elige la variante</DrawerTitle>
                <DrawerDescription className="text-center">
                    Cada variante tiene precio y stock diferente
                </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="mx-5 rounded-t-[20px] bg-white pt-2">
                <div className='grid grid-cols-2 gap-4'>
                    <div className="rounded-2xl relative overflow-hidden w-full h-50 lg:h-70 flex items-center justify-center bg-white">
                        <div className="absolute inset-0">
                            <img
                                src={item.image}
                                className="w-full h-full object-cover blur-md opacity-90 transform scale-105"
                                alt=""
                            />
                        </div>
                        <img
                            src={item.image}
                            className="relative w-[90%] h-[97%] rounded-3xl object-cover drop-shadow-md z-10"
                            alt="imagen del producto"
                        />
                    </div>
                    <div>
                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                        <p className="font-medium text-xl mb-1">{item.name}</p>
                        <div className="h-px bg-stone-200 my-2" />
                        <p className="text-2xl font-medium text-primary">Q{variantSelected?.price}</p>
                        <p className="text-sm text-stone-500">
                            {variantSelected ? `Talla: ${variantSelected.size}` : 'Selecciona una talla'}
                        </p>
                        <p className="text-sm text-stone-500">
                            Stock disponible: {variantSelected?.stock ?? '-'} unidades
                        </p>
                        {variantSelected && variantSelected.stock > 0 && variantSelected.stock <= 3 && (
                            <p className="text-xs text-amber-600 font-medium mt-1">Últimas unidades</p>
                        )}
                        {variantSelected && variantSelected.stock <= 0 && (
                            <p className="text-xs text-red-500 font-medium mt-1">Agotado</p>
                        )}
                    </div>
                </div>

                <div className='grid grid-cols-6 gap-3 w-full justify-center items-center mt-4'>
                    {item.variants.map((variant) => (
                        <Badge
                            className="h-10 w-full cursor-pointer flex items-center justify-center"
                            key={variant.id}
                            aria-disabled={variant.stock <= 0}
                            onClick={() => onVariantChange(variant)}
                            variant={variant.id === variantSelected?.id ? 'secondary' : 'default'}
                        >
                            {variant.size}
                        </Badge>
                    ))}
                </div>
                {item.variants.filter(v => v.stock > 0).length === 0 && (
                    <p className="text-xs text-red-500 text-center mt-2">Ninguna variante disponible. Producto agotado.</p>
                )}
                {item.variants.filter(v => v.stock <= 0).length > 0 && (
                    <p className="text-xs text-stone-400 mt-2">Algunas variantes no tienen stock disponible.</p>
                )}
            </DrawerBody>
            <DrawerFooter className="mx-5 flex flex-col items-center justify-center">
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
