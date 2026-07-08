import { create } from 'zustand';
import type { CartItem, Product, SalesDialog } from '../types/sales';
import type { LineDiscount } from '../utils/pricing-engine';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SalesState {
  items: CartItem[];
  cartOpen: boolean;
  activeDialog: SalesDialog;
  addItem: (product: Product, variantId: number) => void;
  removeItem: (itemId: string) => void;
  increaseQty: (itemId: string) => void;
  decreaseQty: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  applyPricing: (lines: Record<string, LineDiscount>) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openDialog: (dialog: Exclude<SalesDialog, null>) => void;
  closeDialog: () => void;
}

function buildCartItemId(productId: number, variantId: number): string {
  return `${productId}::${variantId}`
}

export const useSalesStore = create<SalesState>()(
  persist((set) => ({
    items: [],
    cartOpen: false,
    activeDialog: null,

    addItem: (product, variantId) =>
      set((state) => {
        const cartItemId = buildCartItemId(product.id, variantId)
        const variant = product.variants.find((v) => v.id === variantId)
        if (!variant) return state

        const existing = state.items.find((item) => item.id === cartItemId)
        if (existing) {
          if (existing.qty >= variant.stock) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId
                  ? { ...item, stock: variant.stock, price: variant.price }
                  : item
              ),
            }
          }

          return {
            items: state.items.map((item) =>
              item.id === cartItemId
                ? { ...item, qty: item.qty + 1, stock: variant.stock, price: variant.price }
                : item
            ),
          }
        }

        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          image: product.image,
          variantId,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
          qty: 1,
          discount: 0,
          discountType: 'NINGUNO',
        }
        return { items: [...state.items, newItem] }
      }),

    removeItem: (itemId) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
      })),

    increaseQty: (itemId) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId
            ? { ...item, qty: Math.min(item.stock, item.qty + 1) }
            : item
        ),
      })),

    decreaseQty: (itemId) =>
      set((state) => ({
        items: state.items
          .map((item) => {
            if (item.id === itemId) {
              return { ...item, qty: item.qty - 1 }
            }
            return item
          })
          .filter((item) => item.qty > 0),
      })),

    setQty: (itemId, qty) =>
      set((state) => ({
        items: state.items.map((item) => {
          if (item.id !== itemId || !Number.isFinite(qty)) return item

          const normalizedQty = Math.trunc(qty)
          const nextQty = Math.max(1, Math.min(item.stock, normalizedQty))

          return { ...item, qty: nextQty }
        }),
      })),

    // Aplica el resultado del motor de precios a todo el carrito en un solo
    // set (precio efectivo, descuento y tipo por línea).
    applyPricing: (lines) =>
      set((state) => ({
        items: state.items.map((item) => {
          const line = lines[item.id]
          if (!line) return item
          if (
            item.discount === line.descuentoUnitario &&
            item.discountType === line.tipo &&
            item.price === line.precioUnitario
          ) {
            return item
          }
          return {
            ...item,
            price: line.precioUnitario,
            discount: line.descuentoUnitario,
            discountType: line.tipo,
          }
        }),
      })),

    clearCart: () => set({ items: [] }),

    openCart: () => set({ cartOpen: true }),

    closeCart: () => set({ cartOpen: false }),

    openDialog: (dialogName) =>
      set({
        cartOpen: false,
        activeDialog: dialogName,
      }),

    closeDialog: () =>
      set({
        cartOpen: true,
        activeDialog: null,
      }),
  }),
    {
      name: 'sales-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartOpen: state.cartOpen,
      }),
    }
  ))
