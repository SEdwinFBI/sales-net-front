import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import CheckoutDialog from "./CheckoutDialog"
import ClearCartDialog from "./ClearCartDialog"
import ListProduct from "./ListProduct"


const Sales = () => {
    return (
        <>
            <ListProduct />
            <CartButton />
            <CartDrawer />
            <CheckoutDialog />
            <ClearCartDialog />
        </>
    )
}

export default Sales
