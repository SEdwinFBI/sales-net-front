

import { useState, useEffect } from 'react'
import { useArticles } from "../hooks/useArticles"
import { useReglasPrecio } from '@/features/catalog/hooks/useReglasPrecio'
import { useSalesStore } from '../store/useSalesStore'
import type { ReglaPrecio } from '@/features/catalog/types/admin-catalog-types'
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useAuthStore } from '@/features/core/store/auth-store'

function getDiscountFromRules(qty: number, rules: ReglaPrecio[]): number {
    const sorted = [...rules].sort((a, b) => a.cantidad_min - b.cantidad_min)
    const rule = sorted.find(r => qty >= r.cantidad_min && qty <= r.cantidad_max)
    return rule ? Number(rule.descuento) : 0
}

const Sales = () => {
    const user = useAuthStore(state => state.user)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const { articles, pagination, isLoading, isPlaceholderData } = useArticles(page, pageSize, debouncedSearch, String(user?.id))
    const { data: rules = [] } = useReglasPrecio()

    const items = useSalesStore((state) => state.items)
    const setDiscount = useSalesStore((state) => state.setDiscount)

    useEffect(() => {
        for (const item of items) {
            const discount = getDiscountFromRules(item.qty, rules)
            if (item.discount !== discount) {
                setDiscount(item.id, discount)
            }
        }
    }, [items, rules, setDiscount])

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
            <Card className="flex-1 p-3">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar producto por nombre..."
                        className="h-9 pl-9"
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
                <CartDrawer />
                <CheckoutDialog />
                <ClearCartDialog />
            </Card>
        </>
    )
}

export default Sales

