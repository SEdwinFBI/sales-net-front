import { useEffect, useState, type FC } from "react"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { toast } from "sonner"
import ProductCard from "./ProductCard"
import VariantSelectionDrawer from "./VariantSelectionDrawer"

type Props = {
    onClick: (product: Product, variantId: number) => void
    item: Product
}

const ProductItem: FC<Props> = ({ onClick, item }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [variantSelected, setVariantSelected] = useState<ProductVariant | null>(
        item.variants[0] || null
    )

    useEffect(() => {
        setVariantSelected((current) => {
            if (!current) return item.variants[0] || null

            return item.variants.find((variant) => variant.id === current.id) || item.variants[0] || null
        })
    }, [item.variants])

    const handleAddVariant = () => {
        if (!variantSelected || variantSelected.stock <= 0) return
        onClick(item, variantSelected.id)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name} - ${variantSelected.size}`)
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <ProductCard item={item} />
            </DrawerTrigger>
            <VariantSelectionDrawer
                item={item}
                variantSelected={variantSelected}
                onVariantChange={setVariantSelected}
                onAddToCart={handleAddVariant}
            />
        </Drawer>
    )
}

export default ProductItem
