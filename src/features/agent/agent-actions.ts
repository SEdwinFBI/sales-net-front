import { getArticles as getCatalogArticles } from '@/features/catalog/services/articles-service'
import { getArticleVariants } from '@/features/catalog/services/article-variants-service'
import { getClientes } from '@/features/customers/services/clientes-service'
import type { AuthUser } from '@/features/core/store/auth-store'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useThemeStore } from '@/features/core/store/theme-store'
import { getArticles } from '@/features/sales/services/products-service'
import { useSalesStore, type SalesState } from '@/features/sales/store/useSalesStore'
import type { Product } from '@/features/sales/types/sales'
import type { AppRoute } from '@/lib/app-routes'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { searchCatalogArticles, type CatalogSearchResult } from './catalog-search'
import { buildCartSnapshot } from './context-snapshot'
import {
  useAgentToolRegistry,
  waitForRegistryChange,
  type AgentToolDef,
} from './registry/agent-tool-registry'
import { getCatalogRoutes, resolveNavigation, type CatalogRoute } from './route-catalog'
import { useAgentStore } from './store/useAgentStore'
import type { ToolResult } from './types'

export const POS_PATH = '/venta/punto-de-venta'
const CLIENTES_PATH = '/clientes/listado'
const CATALOGO_ARTICULOS_PATH = '/catalogo/productos'
const CANCELLED = 'El usuario canceló la acción.'

/** Tools globales que piden confirmación con un clic en el widget antes de ejecutarse. */
const GLOBAL_CONFIRMATION: Record<string, string> = {
  cerrar_sesion: '¿Cerrar la sesión?',
}

/** Máximo de unidades que el agente agrega en una sola acción (evita errores de dictado como "mil"). */
const MAX_QTY_PER_ACTION = 999
const NAVIGATION_TIMEOUT_MS = 3000

export type AgentClient = { id: number; nombre: string; telefono?: string; permiteCredito?: boolean }

/** Dependencias externas de las acciones; se inyectan para poder probarlas sin red ni router. */
export type AgentDeps = {
  navigate: (path: string) => void
  getPathname: () => string
  getUser: () => AuthUser | null
  getSales: () => SalesState
  searchArticles: (text: string) => Promise<Product[]>
  searchClients: (text: string) => Promise<AgentClient[]>
  /** Búsqueda en el catálogo de administración (sin stock), para roles sin acceso al POS. */
  searchCatalog: (text: string) => Promise<CatalogSearchResult[]>
  routes: AppRoute[]
  logout: () => void
  setTheme: (theme: 'light' | 'dark') => void
  /** Muestra la tarjeta «Confirmar / Cancelar» del widget; true solo si el usuario hizo clic en Confirmar. */
  requestConfirmation: (texto: string) => Promise<boolean>
  getRegisteredTools: () => AgentToolDef[]
  getRegistryVersion: () => number
  /** Opciones de la espera del registro tras navegar o abrir UI (los tests acortan los tiempos). */
  registryWait?: Parameters<typeof waitForRegistryChange>[2]
  /** Espera entre sondeos de la ruta tras navegar (ms). */
  pollMs?: number
}

export function createDefaultDeps(
  navigate: (path: string) => void,
  getPathname: () => string,
  logout: () => void,
): AgentDeps {
  return {
    navigate,
    getPathname,
    logout,
    getUser: () => useAuthStore.getState().user,
    getSales: () => useSalesStore.getState(),
    routes: allFeatureRoutes,
    setTheme: (theme) => useThemeStore.getState().setTheme(theme),
    requestConfirmation: (texto) => useAgentStore.getState().requestConfirmation(texto),
    getRegisteredTools: () => useAgentToolRegistry.getState().getAll(),
    getRegistryVersion: () => useAgentToolRegistry.getState().version,
    searchCatalog: async (text) => {
      const [articles, variants] = await Promise.all([getCatalogArticles(), getArticleVariants()])
      return searchCatalogArticles(articles, variants, text)
    },
    searchArticles: async (text) => (await getArticles(1, 10, text)).data,
    searchClients: async (text) => {
      const { results } = await getClientes(1, 10, text, true)
      return results.map((c) => ({
        id: c.id,
        nombre: c.nombre_completo,
        telefono: c.telefono,
        permiteCredito: c.permitir_credito,
      }))
    },
  }
}

type Args = Record<string, unknown>
type Action = (args: Args) => Promise<ToolResult>

const fail = (error: string): ToolResult => ({ ok: false, error })
const ok = (data: unknown): ToolResult => ({ ok: true, data })

function positiveInt(args: Args, key: string): number | null {
  const value = args[key]
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function textArg(args: Args, key: string): string | null {
  const value = args[key]
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : null
}

const itemKey = (productId: number, variantId: number) => `${productId}::${variantId}`

/**
 * Registro de acciones del agente (`nombre de tool → ejecución`). Cada acción
 * valida permisos y argumentos aquí, en el front: lo que llega del modelo no
 * es confiable. Guarda una caché de artículos/clientes vistos para que el
 * modelo solo pueda actuar sobre ids que las búsquedas realmente devolvieron.
 */
export function createAgentActions(deps: AgentDeps) {
  const productCache = new Map<number, Product>()
  const knownClients = new Map<number, string>()
  const pollMs = deps.pollMs ?? 50

  const catalog = (): CatalogRoute[] => {
    const user = deps.getUser()
    return user ? getCatalogRoutes(deps.routes, user.permissions) : []
  }

  const canAccess = (path: string) => catalog().some((r) => r.path === path)
  const canUsePos = () => canAccess(POS_PATH)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  async function waitForPath(path: string): Promise<boolean> {
    const deadline = Date.now() + NAVIGATION_TIMEOUT_MS
    while (deps.getPathname() !== path) {
      if (Date.now() >= deadline) return false
      await sleep(pollMs)
    }
    return true
  }

  /**
   * Las rutas son lazy: tras cambiar de pantalla, la nueva registra sus tools un instante después.
   * Se espera a que el registro cambie y se estabilice para que el back vea la lista nueva.
   */
  const settleRegistry = (before: number) =>
    waitForRegistryChange(deps.getRegistryVersion, before, deps.registryWait)

  /** CartDrawer y los diálogos de cobro solo existen montados en el POS. */
  async function ensureOnPos(): Promise<ToolResult | null> {
    if (deps.getPathname() === POS_PATH) return null
    const before = deps.getRegistryVersion()
    deps.navigate(POS_PATH)
    if (!(await waitForPath(POS_PATH))) return fail('No se pudo abrir el punto de venta.')
    await settleRegistry(before)
    return null
  }

  /** Todas las tools de venta exigen acceso a la pantalla del punto de venta. */
  const posGuard = (): ToolResult | null =>
    canUsePos() ? null : fail('Tu rol no tiene acceso al punto de venta.')

  const cartLine = (productId: number, variantId: number) =>
    deps.getSales().items.find((item) => item.id === itemKey(productId, variantId))

  const readState = () => {
    const sales = deps.getSales()
    return {
      ruta: deps.getPathname(),
      carrito: buildCartSnapshot(sales),
      carrito_abierto: sales.cartOpen,
      dialogo: sales.activeDialog,
      precios_por_cliente: sales.customerPricingEnabled,
      herramientas_de_pantalla: deps.getRegisteredTools().map((tool) => tool.name),
    }
  }

  const actions: Record<string, Action> = {
    async navegar(args) {
      const resolved = resolveNavigation(args.ruta, catalog(), new Set(knownClients.keys()))
      if (!resolved.ok) return fail(resolved.error)
      const before = deps.getRegistryVersion()
      deps.navigate(resolved.path)
      if (!(await waitForPath(resolved.path))) return fail('No se pudo completar la navegacion.')
      await settleRegistry(before)
      return ok({ ruta: resolved.path })
    },

    async leer_estado() {
      return ok(readState())
    },

    async cambiar_tema(args) {
      const tema = args.tema
      if (tema !== 'claro' && tema !== 'oscuro') return fail("El tema debe ser 'claro' u 'oscuro'.")
      deps.setTheme(tema === 'oscuro' ? 'dark' : 'light')
      return ok({ tema })
    },

    async cerrar_sesion() {
      // La confirmación con clic ya se pidió en execute(): aquí solo se cierra la sesión.
      deps.logout()
      return ok({ mensaje: 'Sesion cerrada.' })
    },

    async buscar_articulos(args) {
      const texto = textArg(args, 'texto')
      if (!texto) return fail('Indica el texto a buscar.')

      // Sin POS (p. ej. el admin) se busca en el catálogo de administración, que no trae stock
      // ni sirve para agregar_item: eso solo se hace con artículos de la búsqueda del POS.
      if (!canUsePos()) {
        if (!canAccess(CATALOGO_ARTICULOS_PATH)) return fail('Tu rol no tiene acceso a articulos.')
        return ok(await deps.searchCatalog(texto))
      }

      const products = (await deps.searchArticles(texto)).slice(0, 10)
      products.forEach((product) => productCache.set(product.id, product))
      return ok(
        products.map((p) => ({
          id: p.id,
          nombre: p.name,
          categoria: p.category,
          variantes: p.variants.map((v) => ({ id: v.id, talla: v.size, stock: v.stock, precio: v.price })),
        })),
      )
    },

    async agregar_item(args) {
      const blocked = posGuard()
      if (blocked) return blocked
      const productId = positiveInt(args, 'articulo_id')
      const variantId = positiveInt(args, 'variante_id')
      const cantidad = positiveInt(args, 'cantidad')
      if (!productId || !variantId || !cantidad) return fail('Argumentos invalidos.')
      if (cantidad > MAX_QTY_PER_ACTION) return fail(`La cantidad maxima por accion es ${MAX_QTY_PER_ACTION}.`)

      const product = productCache.get(productId)
      if (!product) return fail('Articulo desconocido: busca primero con buscar_articulos.')
      const variant = product.variants.find((v) => v.id === variantId)
      if (!variant) return fail('Esa variante no pertenece al articulo.')
      if (variant.stock <= 0) return fail(`${product.name} talla ${variant.size} no tiene stock.`)

      const sales = deps.getSales()
      const previous = cartLine(productId, variantId)?.qty ?? 0
      // addItem exige el Product y suma de 1 en 1: crea la linea y setQty fija el total pedido.
      if (!previous) sales.addItem(product, variantId)
      const target = previous + cantidad
      deps.getSales().setQty(itemKey(productId, variantId), target)

      const line = cartLine(productId, variantId)
      if (!line) return fail('No se pudo agregar al carrito.')
      return ok({
        articulo: product.name,
        talla: line.size,
        cantidad_en_carrito: line.qty,
        ajustado_por_stock: line.qty < target,
        stock: line.stock,
      })
    },

    async cambiar_cantidad(args) {
      const blocked = posGuard()
      if (blocked) return blocked
      const productId = positiveInt(args, 'articulo_id')
      const variantId = positiveInt(args, 'variante_id')
      const cantidad = positiveInt(args, 'cantidad')
      if (!productId || !variantId || !cantidad) return fail('Argumentos invalidos.')
      if (cantidad > MAX_QTY_PER_ACTION) return fail(`La cantidad maxima por accion es ${MAX_QTY_PER_ACTION}.`)
      if (!cartLine(productId, variantId)) return fail('Ese item no esta en el carrito.')

      deps.getSales().setQty(itemKey(productId, variantId), cantidad)
      const line = cartLine(productId, variantId)
      return ok({ cantidad_en_carrito: line?.qty ?? 0, ajustado_por_stock: (line?.qty ?? 0) < cantidad })
    },

    async quitar_item(args) {
      const blocked = posGuard()
      if (blocked) return blocked
      const productId = positiveInt(args, 'articulo_id')
      const variantId = positiveInt(args, 'variante_id')
      if (!productId || !variantId) return fail('Argumentos invalidos.')
      if (!cartLine(productId, variantId)) return fail('Ese item no esta en el carrito.')

      deps.getSales().removeItem(itemKey(productId, variantId))
      return ok({ quitado: true })
    },

    async vaciar_carrito() {
      const blocked = posGuard()
      if (blocked) return blocked
      if (deps.getSales().items.length === 0) return fail('El carrito ya esta vacio.')
      const moved = await ensureOnPos()
      if (moved) return moved

      // El dialogo existente pide confirmacion: el agente no vacia el carrito por si solo.
      deps.getSales().openDialog('clear-cart')
      return ok({ mensaje: 'Se abrio la confirmacion para vaciar el carrito; el usuario debe aceptarla.' })
    },

    async buscar_cliente(args) {
      // Buscar clientes no exige el POS: basta poder ver el listado de clientes (p. ej. el admin).
      if (!canUsePos() && !canAccess(CLIENTES_PATH)) return fail('Tu rol no tiene acceso a clientes.')
      const texto = textArg(args, 'texto')
      if (!texto) return fail('Indica el nombre a buscar.')

      const clients = (await deps.searchClients(texto)).slice(0, 10)
      clients.forEach((c) => knownClients.set(c.id, c.nombre))
      return ok(
        clients.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          ...(c.telefono ? { telefono: c.telefono } : {}),
          ...(c.permiteCredito !== undefined ? { permite_credito: c.permiteCredito } : {}),
        })),
      )
    },

    async seleccionar_cliente(args) {
      const blocked = posGuard()
      if (blocked) return blocked
      const clienteId = positiveInt(args, 'cliente_id')
      if (!clienteId) return fail('Argumentos invalidos.')
      const nombre = knownClients.get(clienteId)
      if (nombre === undefined) return fail('Cliente desconocido: busca primero con buscar_cliente.')

      // No se toca el modo de precios por cliente: activarlo cambiaria los precios del carrito
      // y el usuario no lo pidio. El cobro usa este cliente igual (CheckoutDialog lee el store).
      const sales = deps.getSales()
      sales.setSelectedCustomerId(String(clienteId))
      return ok({ cliente_id: clienteId, nombre, precios_por_cliente: sales.customerPricingEnabled })
    },

    async abrir_carrito() {
      const blocked = posGuard()
      if (blocked) return blocked
      const moved = await ensureOnPos()
      if (moved) return moved
      deps.getSales().openCart()
      return ok({ carrito_abierto: true })
    },

    async cerrar_carrito() {
      const blocked = posGuard()
      if (blocked) return blocked
      deps.getSales().closeCart()
      return ok({ carrito_abierto: false })
    },

    async abrir_checkout() {
      const blocked = posGuard()
      if (blocked) return blocked
      if (deps.getSales().items.length === 0) return fail('El carrito esta vacio.')
      const moved = await ensureOnPos()
      if (moved) return moved

      // Solo abre el cobro: la venta la confirma el usuario con el boton del dialogo.
      deps.getSales().openDialog('checkout')
      return ok({ mensaje: 'Cobro abierto. El usuario debe confirmar la venta con el boton del dialogo.' })
    },
  }

  return {
    async execute(name: string, rawArgs: Args): Promise<ToolResult> {
      if (!deps.getUser()) return fail('No hay una sesion activa.')
      const args: Args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {}

      try {
        // Las globales van primero: una pantalla no puede pisarlas.
        const action = Object.hasOwn(actions, name) ? actions[name] : undefined
        if (action) {
          const question = GLOBAL_CONFIRMATION[name]
          if (question && !(await deps.requestConfirmation(question))) return fail(CANCELLED)
          return await action(args)
        }

        const def = deps.getRegisteredTools().find((tool) => tool.name === name)
        if (!def) return fail(`Accion desconocida: ${name}`)

        // Primero se valida: el usuario nunca debe confirmar algo que va a fallar por argumentos
        // inválidos o por una entidad que no existe.
        const invalid = def.validar?.(args)
        if (invalid) return fail(invalid)

        if (def.requiere_confirmacion) {
          // Solo el clic del usuario en el widget confirma; el modelo y la voz no pueden.
          const texto = def.textoConfirmacion?.(args)
          if (!texto) return fail('No se pudo preparar la confirmacion de esta accion.')
          if (!(await deps.requestConfirmation(texto))) return fail(CANCELLED)
        }

        const before = deps.getRegistryVersion()
        const result = await def.run(args)
        if (result.ok && def.abreUi) await settleRegistry(before)
        return result
      } catch {
        return fail('La accion fallo. Intenta de nuevo.')
      }
    },
  }
}

export type AgentActions = ReturnType<typeof createAgentActions>
