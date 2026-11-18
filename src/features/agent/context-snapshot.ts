import type { AuthUser } from '@/features/core/store/auth-store'
import type { SalesState } from '@/features/sales/store/useSalesStore'
import { selectTotal } from '@/features/sales/utils/utilsSales'
import { getListedRoutes, type CatalogRoute } from './route-catalog'
import type { AgentContext } from './types'

/** Tope de líneas del carrito que se envían al modelo, para acotar el contexto. */
const MAX_CART_LINES = 30

type CartSnapshot = AgentContext['cart']

export function buildCartSnapshot(sales: SalesState): CartSnapshot {
  return {
    items: sales.items.slice(0, MAX_CART_LINES).map((item) => ({
      articulo_id: item.productId,
      variante_id: item.variantId,
      nombre: item.name,
      talla: item.size,
      cantidad: item.qty,
      precio: item.price,
    })),
    total: selectTotal(sales),
    customerId: sales.selectedCustomerId || null,
  }
}

/** Foto del estado del front que se manda con cada mensaje del usuario. */
export function buildContextSnapshot(input: {
  pathname: string
  user: AuthUser
  sales: SalesState
  catalog: CatalogRoute[]
}): AgentContext {
  const { pathname, user, sales, catalog } = input
  return {
    route: pathname,
    role: user.role,
    permissions: user.permissions,
    // Igual que la UI: solo `false` explícito quita el permiso; `undefined` (login antiguo) lo conserva.
    puede_anular: user.puede_anular !== false,
    cart: buildCartSnapshot(sales),
    activeDialog: sales.activeDialog ?? (sales.cartOpen ? 'cart' : null),
    routes: getListedRoutes(catalog),
  }
}
