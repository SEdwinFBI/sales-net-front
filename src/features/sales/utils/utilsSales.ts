import type { SalesState } from "../store/useSalesStore"

export const selectTotalItems = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.qty, 0)

export const selectTotal = (state: SalesState) =>
    state.items.reduce((sum, item) => {
        const precioFinal = item.discount > 0 ? item.price - item.discount : item.price
        return sum + (precioFinal * item.qty)
    }, 0)

export const selectTotalDiscount = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.discount * item.qty, 0)