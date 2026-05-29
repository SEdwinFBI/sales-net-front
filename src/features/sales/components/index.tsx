

import { useState } from 'react'
import { useArticles } from "../hooks/useArticles"
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"
import { Card } from "@/components/ui/card"


const Sales = () => {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const { articles, pagination, isLoading, isPlaceholderData } = useArticles(page, pageSize)

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(1)
    }

    return (
        <>
            <Card className="flex-1 p-3">
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

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export function ExampleCombobox() {
    return (
        <Combobox items={frameworks}>
            <ComboboxInput placeholder="Select a framework" />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}