import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/features/core/store/auth-store'
import { useSalesStore } from '@/features/sales/store/useSalesStore'
import type { CartItem } from '@/features/sales/types/sales'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { buildContextSnapshot } from './context-snapshot'
import { getCatalogRoutes } from './route-catalog'

// El store de ventas persiste en localStorage, que no existe en Node: se simula antes de importarlo.
vi.hoisted(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  })
})

const vendedor: AuthUser = {
  id: 1,
  fullName: 'V',
  username: 'v',
  role: 'vendedor',
  permissions: ['vendedor'],
  puede_anular: false,
  sucursalActual: null,
}

const linea = (n: number, over: Partial<CartItem> = {}): CartItem => ({
  id: `${n}::${n}`,
  productId: n,
  name: `Art ${n}`,
  category: 'c',
  image: null,
  variantId: n,
  size: 'M',
  price: 100,
  stock: 10,
  qty: 2,
  discount: 0,
  discountType: 'NINGUNO',
  ...over,
})

const snapshot = () =>
  buildContextSnapshot({
    pathname: '/venta/punto-de-venta',
    user: vendedor,
    sales: useSalesStore.getState(),
    catalog: getCatalogRoutes(allFeatureRoutes, vendedor.permissions),
  })

beforeEach(() => {
  useSalesStore.setState({ items: [], cartOpen: false, activeDialog: null, selectedCustomerId: '' })
})

describe('context-snapshot', () => {
  it('arma ruta, rol, permisos y solo las rutas permitidas sin parámetros', () => {
    const ctx = snapshot()
    expect(ctx).toMatchObject({
      route: '/venta/punto-de-venta',
      role: 'vendedor',
      permissions: ['vendedor'],
      puede_anular: false,
    })
    const paths = ctx.routes.map((r) => r.path)
    expect(paths).toContain('/venta/punto-de-venta')
    expect(paths).not.toContain('/reportes/dashboard')
    expect(paths.every((p) => !p.includes(':'))).toBe(true)
    // Las fichas de cliente viajan como plantilla {id}.
    expect(ctx.routes).toContainEqual(expect.objectContaining({ path: '/clientes/listado/{id}', plantilla: true }))
  })

  it('puede_anular: solo un false explícito lo quita (undefined lo conserva, como la UI)', () => {
    const contexto = (user: AuthUser) =>
      buildContextSnapshot({ pathname: '/', user, sales: useSalesStore.getState(), catalog: [] })

    expect(contexto({ ...vendedor, puede_anular: false }).puede_anular).toBe(false)
    expect(contexto({ ...vendedor, puede_anular: true }).puede_anular).toBe(true)
    expect(contexto({ ...vendedor, puede_anular: undefined }).puede_anular).toBe(true)
  })

  it('resume el carrito con el total considerando descuentos y el cliente', () => {
    useSalesStore.setState({
      items: [linea(1), linea(2, { price: 50, discount: 10, qty: 3 })],
      selectedCustomerId: '12',
    })
    const { cart } = snapshot()
    expect(cart.items[0]).toEqual({
      articulo_id: 1,
      variante_id: 1,
      nombre: 'Art 1',
      talla: 'M',
      cantidad: 2,
      precio: 100,
    })
    expect(cart.total).toBe(2 * 100 + 3 * (50 - 10))
    expect(cart.customerId).toBe('12')
  })

  it('acota las líneas del carrito que se envían', () => {
    useSalesStore.setState({ items: Array.from({ length: 50 }, (_, i) => linea(i + 1)) })
    expect(snapshot().cart.items).toHaveLength(30)
  })

  it('refleja el diálogo activo o el carrito abierto', () => {
    expect(snapshot().activeDialog).toBeNull()
    useSalesStore.setState({ cartOpen: true })
    expect(snapshot().activeDialog).toBe('cart')
    useSalesStore.setState({ cartOpen: false, activeDialog: 'checkout' })
    expect(snapshot().activeDialog).toBe('checkout')
  })
})
