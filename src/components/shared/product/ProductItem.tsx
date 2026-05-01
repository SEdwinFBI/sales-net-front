import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, type FC } from "react"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = {
    onClick: (product: Product, variantId: string) => void;
    item: Product
}
const ProductItem: FC<Props> = ({ onClick, item }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [variantSelected, setVariantSelected] = useState<ProductVariant | null>(item.variants[0] || null)

    const handeClick = (variantId: string) => {
        const variant = item.variants.find((v) => v.id === variantId)
        if (!variant || variant.stock <= 0) return
        onClick(item, variantId)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name} - ${variant.size}`)
    }
    return (
        <>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <Card className="bg-white" onClick={() => setIsOpen(true)}>
                        <img

                            className="h-40 lg:h-50 w-full object-cover object-center  "
                            src={item.image}
                        />
                        <CardHeader>
                            <Badge variant={"secondary"}>
                                {item.category}
                            </Badge>

                            <CardTitle>
                                {item.name}
                            </CardTitle>
                            <CardDescription className="h-10">
                                <div>
                                    <div className="flex items-center gap-2 text-xs">

                                        <small className="text-stone-400"><>Desde Q.{item.variants[0]?.price} </>
                                            {item.variants.length > 1 && item.variants[0]?.price !== Math.max(...item.variants.map(v => v.price)) && (
                                                <> a Q.{Math.max(...item.variants.map(v => v.price))} </>
                                            )}
                                            en stock  {item.variants.reduce((s, v) => s + v.stock, 0)} </small>
                                    </div>


                                    <div className='grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-1 mt-1'>
                                        {item.variants.map((variant) => (
                                            <Badge
                                                key={variant.id}
                                                variant={variant.stock > 0 ? 'default' : 'secondary'}
                                            >
                                                {variant.size}
                                            </Badge>
                                        ))}
                                    </div>

                                </div>
                            </CardDescription>
                        </CardHeader>

                    </Card>
                </DrawerTrigger>
                <DrawerContent className="bg-white w-full ">
                    <DrawerHeader className="mx-auto w-full max-w-md">
                        <DrawerTitle >Elige la variante</DrawerTitle>
                        <DrawerDescription className="text-center">
                            Cada variante tiene precio y stock diferente
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody className="mx-auto w-full  rounded-t-[20px] bg-white pt-2">
                        <div className='grid grid-cols-2 gap-4'>
                            <div className=" rounded-2xl relative overflow-hidden w-full h-64 flex items-center justify-center bg-white ">
                                <div className="absolute inset-0">
                                    <img
                                        src={item.image}
                                        className=" a w-full h-full object-cover blur-md opacity-90 transform scale-105"
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

                        <div className='grid grid-cols-4 gap-3 w-full justify-center items-center mt-4'>
                            {item.variants.map((variant) => (
                                <Badge
                                    className="h-10 w-full cursor-pointer flex items-center justify-center"
                                    key={variant.id}
                                    aria-disabled={variant.stock <= 0}
                                    onClick={() => setVariantSelected(variant)}
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
                    <DrawerFooter className="flex flex-col items-center justify-center">
                        <Button
                            size={"default"}
                            className="w-full "
                            disabled={!variantSelected || variantSelected.stock <= 0}
                            onClick={() => handeClick(variantSelected?.id ?? '')}
                        >Agregar al carrito</Button>
                        <p className="text-xs text-stone-400 text-center mt-2">Revisa la variante y cantidad antes de confirmar</p>
                    </DrawerFooter>
                </DrawerContent>

            </Drawer>
        </>
    )
}

export default ProductItem
