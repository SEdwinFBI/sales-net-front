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
    const [checkedVariantIds, setCheckedVariantIds] = useState<number[]>([])
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
    const cartItems = useSalesStore((state) => state.items)
    const availableItem = {
        ...item,
        variants: item.variants.map((variant) => ({
            ...variant,
            stock: Math.max(0, variant.stock - (cartItems.find((line) =>
                line.productId === item.id && line.variantId === variant.id)?.qty ?? 0)),
        })),
    }
    const availableSelected = availableItem.variants.find((variant) =>
        variant.id === variantSelected?.id && variant.stock > 0) ?? null

    const handleAddVariant = () => {
        if (checkedVariantIds.length > 0) {
            const variants = availableItem.variants.filter((variant) => checkedVariantIds.includes(variant.id) && variant.stock > 0)
            if (variants.length === 0) return
            variants.forEach((variant) => onClick(item, variant.id))
            setCheckedVariantIds([])
            setIsOpen(false)
            toast.info(`Se agregó al carrito ${item.name} - ${variants.map((variant) => variant.size).join(', ')}`)
            return
        }
        if (!availableSelected) return
        onClick(item, availableSelected.id)
        setIsOpen(false)
        toast.info(`se agrego al carrito ${item.name} - ${availableSelected.size}`)
    }

    // Cierra el drawer antes de abrir el dialog: vaul aplica scroll-lock al
    // body que dejaría inerte el dialog si quedaran ambos abiertos.
    const handleCheckOtherStores = () => {
        setIsOpen(false)
        openBranchAvailability(item.id, variantSelected?.id ?? null)
    }

    return (
        <Drawer shouldScaleBackground={false} open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            setCheckedVariantIds([])
        }}>
            <DrawerTrigger asChild>
                <ProductCard item={item} />
            </DrawerTrigger>
            <VariantSelectionDrawer
                item={availableItem}
                variantSelected={availableSelected}
                onVariantChange={(variant) => {
                    if (variant.stock <= 0) return
                    setVariantSelected(variant)
                    setCheckedVariantIds([])
                }}
                checkedVariantIds={checkedVariantIds}
                onVariantCheck={(variant) => {
                    if (variant.stock <= 0) return
                    setVariantSelected(variant)
                    setCheckedVariantIds((current) => current.includes(variant.id)
                        ? current.filter((id) => id !== variant.id)
                        : [...current, variant.id])
                }}
                onAddToCart={handleAddVariant}
                onCheckOtherStores={handleCheckOtherStores}
            />
        </Drawer>
    )
}

export default ProductItem
