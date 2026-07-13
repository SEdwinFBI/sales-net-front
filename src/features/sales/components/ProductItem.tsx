import { useEffect, useState, type FC } from "react"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import type { Product, ProductVariant } from "@/features/sales/types/sales"
import { toast } from "sonner"
import ProductCard from "./ProductCard"
import VariantSelectionDrawer from "./VariantSelectionDrawer"
import { useSalesStore } from "../store/useSalesStore"

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

    const openBranchAvailability = useSalesStore((state) => state.openBranchAvailability)

    const handleAddVariant = () => {
        if (!variantSelected || variantSelected.stock <= 0) return
        onClick(item, variantSelected.id)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name} - ${variantSelected.size}`)
    }

    // Cierra el drawer antes de abrir el dialog: vaul aplica scroll-lock al
    // body que dejaría inerte el dialog si quedaran ambos abiertos.
    const handleCheckOtherStores = () => {
        setIsOpen(false)
        openBranchAvailability(item.id, variantSelected?.id ?? null)
    }

    return (
        <Drawer shouldScaleBackground={false} open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <ProductCard item={item} />
            </DrawerTrigger>
            <VariantSelectionDrawer
                item={item}
                variantSelected={variantSelected}
                onVariantChange={setVariantSelected}
                onAddToCart={handleAddVariant}
                onCheckOtherStores={handleCheckOtherStores}
            />
        </Drawer>
    )
}

export default ProductItem
