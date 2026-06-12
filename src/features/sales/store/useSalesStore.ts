import { create } from 'zustand';
import type { CartItem, Product, SalesDialog } from '../types/sales';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SalesState {
  items: CartItem[];
  cartOpen: boolean;
  activeDialog: SalesDialog;
  addItem: (product: Product, variantId: string) => void;
  removeItem: (itemId: string) => void;
  increaseQty: (itemId: string) => void;
  decreaseQty: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openDialog: (dialog: Exclude<SalesDialog, null>) => void;
  closeDialog: () => void;
}

function buildCartItemId(productId: string, variantId: string): string {
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
          return {
            items: state.items.map((item) =>
              item.id === cartItemId
                ? { ...item, qty: item.qty + 1 }
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
            ? { ...item, qty: item.qty + 1 }
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
