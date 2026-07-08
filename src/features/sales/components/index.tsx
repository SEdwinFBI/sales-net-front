

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useArticles } from "../hooks/useArticles"
import { useEffectivePricing } from '../hooks/useEffectivePricing'
import { useSalesStore } from '../store/useSalesStore'
import { computeCartPricing } from '../utils/pricing-engine'
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useAuthStore } from '@/features/core/store/auth-store'

const Sales = () => {
    const user = useAuthStore(state => state.user)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const { articles, pagination, isLoading, isPlaceholderData } = useArticles(page, pageSize, debouncedSearch, String(user?.id))
    const { config: pricingConfig, isError: pricingError } = useEffectivePricing()

    const items = useSalesStore((state) => state.items)
    const applyPricing = useSalesStore((state) => state.applyPricing)

    // Motor de precios: decide por línea (individual > mayorista > nada)
    // usando el total de unidades del carrito. Preview en cliente; el
    // servidor recalcula al registrar la venta.
    const pricing = useMemo(
        () => computeCartPricing(items, pricingConfig),
        [items, pricingConfig]
    )

    useEffect(() => {
        const needsUpdate = items.some((item) => {
            const line = pricing.lines[item.id]
            if (!line) return false
            return (
                item.discount !== line.descuentoUnitario ||
                item.discountType !== line.tipo ||
                item.price !== line.precioUnitario
            )
        })
        if (needsUpdate) {
            applyPricing(pricing.lines)
        }
    }, [items, pricing, applyPricing])

    useEffect(() => {
        if (pricingError) {
            toast.error('No se pudo cargar la configuración de precios; se venderá sin descuentos.')
        }
    }, [pricingError])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchInput])

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(1)
    }

    const handleSearchChange = (value: string) => {
        setSearchInput(value)
        setPage(1)
    }

    return (
        <>
            <Card className="flex-1 p-3.5 sm:p-5">
                <div className="relative mb-4 sm:mb-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar producto por nombre..."
                        className="pl-9"
                    />
                </div>
                <ListProduct
                    data={articles}
                    isLoading={isLoading || isPlaceholderData}
                    page={pagination?.page}
                    totalPages={pagination?.total_pages}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                />
                <CartButton />
                <CartDrawer pricing={pricing} />
                <CheckoutDialog />
                <ClearCartDialog />
            </Card>
        </>
    )
}

export default Sales
