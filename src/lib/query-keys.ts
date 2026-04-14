/**
 * Query Key Factory
 *
 * Centraliza todas las claves de React Query para evitar colisiones
 * y mantener consistencia en todo el proyecto.
 *

 * Uso:
 *   queryKeys.products.all             → ['products']
 *   queryKeys.products.lists()         → ['products', 'list']
 *   queryKeys.products.detail('123')   → ['products', 'detail', '123']
 *   queryKeys.products.categories()    → ['products', 'categories']
 */

export const queryKeys = {


  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
    category: (id: string) =>
      [...queryKeys.products.categories(), id] as const,
  },



  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.sales.details(), id] as const,
  },



}
