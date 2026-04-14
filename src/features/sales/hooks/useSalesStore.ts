import { create } from 'zustand';
import type { CartItem, SaleProduct, SalesDialog } from '../types/sales';

interface SalesState {
  items: CartItem[];
  cartOpen: boolean;
  activeDialog: SalesDialog;
  // Acciones
  addItem: (product: SaleProduct) => void;
  removeItem: (productId: string) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openDialog: (dialog: Exclude<SalesDialog, null>) => void;
  closeDialog: () => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  items: [],
  cartOpen: false,
  activeDialog: null,

  addItem: (product) =>
    set((state) => {
      const isProductInCart = state.items.some((item) => item.id === product.id);

      if (isProductInCart) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        };
      }

      const newItem: CartItem = { ...product, qty: 1 };
      return { items: [...state.items, newItem] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),

  increaseQty: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? { ...item, qty: item.qty + 1 }
          : item
      ),
    })),

  decreaseQty: (productId) =>
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.id === productId) {
            return { ...item, qty: item.qty - 1 };
          }
          return item;
        })
        //descarta
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
}));
