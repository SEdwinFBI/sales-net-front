

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { useProduct } from "../hooks/useProduct"
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"


const Sales = () => {
    const { data: dataProducts, isLoading: isLoadingProducts } = useProduct();
    return (
        <>
            <ExampleCombobox />
            <ListProduct data={dataProducts} isLoading={isLoadingProducts} />
            <CartButton />
            <CartDrawer />
            <CheckoutDialog />
            <ClearCartDialog />
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