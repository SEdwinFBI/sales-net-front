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
    list: () => [...queryKeys.products.all, 'list'] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
    category: (id: string) =>
      [...queryKeys.products.categories(), id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: () => [...queryKeys.customers.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.customers.all, 'detail', id] as const,
    abonos: (idCliente: number) => [...queryKeys.customers.all, 'abonos', idCliente] as const,
    compras: (idCliente: number, filters?: Record<string, unknown>) =>
      [...queryKeys.customers.all, 'compras', idCliente, filters] as const,
  },
  sales: {
    all: ['sales'] as const,
    list: () => [...queryKeys.sales.all, 'list'] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.sales.details(), id] as const,
    articles: (page: number, pageSize: number, search?: string) =>
      [...queryKeys.sales.all, 'articles', page, pageSize, search] as const,
    historial: (filters?: Record<string, unknown>) =>
      [...queryKeys.sales.all, 'historial', filters] as const,
  },
  reporting: {
    all: ['reporting'] as const,
    ventas: (filters?: Record<string, unknown>) =>
      [...queryKeys.reporting.all, 'ventas', filters] as const,
    deudores: (filters?: Record<string, unknown>) =>
      [...queryKeys.reporting.all, 'deudores', filters] as const,
  },
  adminUsuarios: {
    all: ['adminUsuarios'] as const,
    list: () => [...queryKeys.adminUsuarios.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.adminUsuarios.all, 'detail', id] as const,
  },
  adminVentas: {
    all: ['adminVentas'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.adminVentas.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.adminVentas.all, 'detail', id] as const,
  },
  adminCatalog: {
    all: ['adminCatalog'] as const,
    articles: {
      all: () => [...queryKeys.adminCatalog.all, 'articles'] as const,
      list: () => [...queryKeys.adminCatalog.articles.all(), 'list'] as const,
      detail: (id: number) => [...queryKeys.adminCatalog.articles.all(), 'detail', id] as const,
    },
    tallas: {
      all: () => [...queryKeys.adminCatalog.all, 'tallas'] as const,
      list: () => [...queryKeys.adminCatalog.tallas.all(), 'list'] as const,
    },
    variantes: {
      all: () => [...queryKeys.adminCatalog.all, 'variantes'] as const,
      list: () => [...queryKeys.adminCatalog.variantes.all(), 'list'] as const,
    },
    stock: {
      all: () => [...queryKeys.adminCatalog.all, 'stock'] as const,
      list: () => [...queryKeys.adminCatalog.stock.all(), 'list'] as const,
    },
    reglasPrecio: {
      all: () => [...queryKeys.adminCatalog.all, 'reglas-precio'] as const,
      list: () => [...queryKeys.adminCatalog.reglasPrecio.all(), 'list'] as const,
    },
    formaPago: {
      all: () => [...queryKeys.adminCatalog.all, 'forma-pago'] as const,
      list: () => [...queryKeys.adminCatalog.formaPago.all(), 'list'] as const,
    },
  },
}
