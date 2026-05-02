import type { SalesState } from "../store/useSalesStore"

export const selectTotalItems = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.qty, 0)

export const selectTotal = (state: SalesState) =>
    state.items.reduce((sum, item) => sum + item.qty * item.price, 0)