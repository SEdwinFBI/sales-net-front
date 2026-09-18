

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
import SaleSummaryDialog from "./SaleSummaryDialog"
import BranchAvailabilityDialog from "./BranchAvailabilityDialog"
import CustomerPricesViewDialog from "./CustomerPricesViewDialog"
import ListProduct from "./ListProduct"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Store } from "lucide-react"
import { useAuthStore } from '@/features/core/store/auth-store'
import { useCustomerPricesStore } from '@/features/customers/store/useCustomerPricesStore'
import { usePreciosCliente } from '@/features/customers/hooks/usePreciosCliente'

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
    const openBranchAvailability = useSalesStore((state) => state.openBranchAvailability)
    const customerPricingEnabled = useSalesStore((state) => state.customerPricingEnabled)
    const selectedCustomerId = useSalesStore((state) => state.selectedCustomerId)
    const localPrices = useCustomerPricesStore((state) => state.prices)
    const getCustomerPriceMap = useCustomerPricesStore((state) => state.getCustomerPriceMap)
    const saveLocalPrices = useCustomerPricesStore((state) => state.savePrices)

    // Consulta reactiva de precios del cliente activo
    const activeCustomerIdNum = customerPricingEnabled && selectedCustomerId ? Number(selectedCustomerId) : 0
    const { data: customerPricesData } = usePreciosCliente(activeCustomerIdNum)

    // Sincronizar precios de la API en el store local para respaldo
    useEffect(() => {
        if (customerPricesData && customerPricesData.length > 0 && selectedCustomerId) {
            const configurados = customerPricesData.filter(
                (p) => p.tiene_config && p.precio_cliente !== null
            )
            if (configurados.length > 0) {
                saveLocalPrices(
                    configurados.map((p) => ({
                        id: `${selectedCustomerId}::${p.id_variante}`,
                        customerId: Number(selectedCustomerId),
                        customerName: 'Cliente',
                        variantId: p.id_variante,
                        productId: p.id_articulo,
                        productName: p.articulo,
                        variantSize: p.talla,
                        precioPactado: p.precio_cliente!,
                        precioCatalogo: p.precio_base,
                        descuentoAplicado: Math.max(0, p.precio_base - (p.precio_cliente ?? p.precio_base)),
                        tipoDescuentoOrigen: 'MANUAL',
                        fechaRegistro: p.fecha_actualizacion || new Date().toISOString(),
                    }))
                )
            }
        }
    }, [customerPricesData, selectedCustomerId, saveLocalPrices])

    // Mapa de precios pactados reactivo (API + store local)
    const customerPriceMap = useMemo(() => {
        if (!customerPricingEnabled || !selectedCustomerId) return null
        const map: Record<number, number> = {}

        if (customerPricesData) {
            for (const item of customerPricesData) {
                if (item.tiene_config && item.precio_cliente !== null) {
                    map[item.id_variante] = Number(item.precio_cliente)
                }
            }
        }

        const localMap = getCustomerPriceMap(Number(selectedCustomerId))
        for (const [vidStr, price] of Object.entries(localMap)) {
            const vid = Number(vidStr)
            if (map[vid] === undefined) {
                map[vid] = Number(price)
            }
        }

        return map
    }, [customerPricingEnabled, selectedCustomerId, customerPricesData, localPrices, getCustomerPriceMap])

    // Motor de precios: decide por línea (individual > mayorista > nada)
    // o aplica precio pactado de cliente si está activo.
    const pricing = useMemo(
        () => computeCartPricing(items, pricingConfig, customerPriceMap),
        [items, pricingConfig, customerPriceMap]
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
                <div className="mb-4 flex items-center gap-2 sm:mb-5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Buscar producto por nombre..."
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        title="Consultar existencias en otras tiendas"
                        onClick={() => openBranchAvailability(null)}
                    >
                        <Store className="size-4" />
                        <span className="hidden sm:inline">Existencias en tiendas</span>
                    </Button>
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
                <SaleSummaryDialog />
                <BranchAvailabilityDialog />
                <CustomerPricesViewDialog />
            </Card>
        </>
    )
}

export default Sales
