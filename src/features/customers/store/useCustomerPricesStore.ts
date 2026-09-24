import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CustomerProductPrice } from '../types/customer-prices'

export interface CustomerPricesState {
  /** Diccionario indexado por `${customerId}::${variantId}` */
  prices: Record<string, CustomerProductPrice>

  /** Guarda o actualiza múltiples precios para un cliente */
  savePrices: (items: CustomerProductPrice[]) => void

  /** Elimina un precio guardado para una variante de un cliente */
  removePrice: (customerId: number, variantId: number) => void

  /** Elimina todos los precios guardados de un cliente */
  clearCustomerPrices: (customerId: number) => void

  /** Obtiene la lista de precios pactados de un cliente */
  getCustomerPrices: (customerId: number) => CustomerProductPrice[]

  /** Retorna un mapa `variantId -> precioPactado` para consulta rápida del motor de precios */
  getCustomerPriceMap: (customerId: number) => Record<number, number>
}

export const buildCustomerPriceId = (customerId: number, variantId: number): string =>
  `${customerId}::${variantId}`

export const useCustomerPricesStore = create<CustomerPricesState>()(
  persist(
    (set, get) => ({
      prices: {},

      savePrices: (newItems) =>
        set((state) => {
          const nextPrices = { ...state.prices }
          for (const item of newItems) {
            const id = buildCustomerPriceId(item.customerId, item.variantId)
            nextPrices[id] = { ...item, id }
          }
          return { prices: nextPrices }
        }),

      removePrice: (customerId, variantId) =>
        set((state) => {
          const id = buildCustomerPriceId(customerId, variantId)
          if (!state.prices[id]) return state
          const nextPrices = { ...state.prices }
          delete nextPrices[id]
          return { prices: nextPrices }
        }),

      clearCustomerPrices: (customerId) =>
        set((state) => {
          const prefix = `${customerId}::`
          const nextPrices: Record<string, CustomerProductPrice> = {}
          for (const [key, val] of Object.entries(state.prices)) {
            if (!key.startsWith(prefix)) {
              nextPrices[key] = val
            }
          }
          return { prices: nextPrices }
        }),

      getCustomerPrices: (customerId) => {
        const prefix = `${customerId}::`
        return Object.values(get().prices).filter((p) => p.customerId === customerId || p.id.startsWith(prefix))
      },

      getCustomerPriceMap: (customerId) => {
        const prefix = `${customerId}::`
        const map: Record<number, number> = {}
        for (const [key, item] of Object.entries(get().prices)) {
          if (item.customerId === customerId || key.startsWith(prefix)) {
            map[item.variantId] = item.precioPactado
          }
        }
        return map
      },
    }),
    {
      name: 'sales-customer-prices',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
