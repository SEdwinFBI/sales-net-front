import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/features/core/store/auth-store'
import { useSalesStore } from '@/features/sales/store/useSalesStore'
import type { Product } from '@/features/sales/types/sales'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { POS_PATH, createAgentActions, type AgentDeps } from './agent-actions'
import type { CloseDialogOutcome } from './dialog-control'
import { useAgentToolRegistry, type AgentToolDef } from './registry/agent-tool-registry'
import type { ToolResult } from './types'

// El store de ventas persiste en localStorage, que no existe en Node: se simula antes de importarlo.
vi.hoisted(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  })
})

const camisa: Product = {
  id: 7,
  name: 'Camisa',
  category: 'Ropa',
  image: null,
  variants: [
    { id: 71, size: 'M', stock: 3, price: 100 },
    { id: 72, size: 'L', stock: 0, price: 100 },
  ],
}

const usuario = (role: 'admin' | 'vendedor'): AuthUser => ({
  id: 1,
  fullName: 'Test',
  username: 'test',
  role,
  permissions: [role],
  sucursalActual: null,
})

/** Esperas del registro acortadas: en los tests no hay rutas lazy que montar. */
const FAST_REGISTRY_WAIT = { quietMs: 1, settleMs: 1, pollMs: 1, timeoutMs: 100 }

function setup(
  role: 'admin' | 'vendedor' = 'vendedor',
  startPath = '/home',
  routes = allFeatureRoutes,
  overrides: Partial<AgentDeps> = {},
) {
  let path = startPath
  const navigate = vi.fn((to: string) => {
    path = to
  })
  const searchArticles = vi.fn(async () => [camisa])
  const searchClients = vi.fn(async () => [{ id: 12, nombre: 'Juan Pérez', permiteCredito: true }])
  const searchCatalog = vi.fn(async () => [
    { id: 7, nombre: 'Camisa', variantes: [{ id: 71, talla: 'M', precio: 100 }] },
  ])
  const logout = vi.fn()
  const setTheme = vi.fn()
  const requestConfirmation = vi.fn<(texto: string, timeoutMs?: number) => Promise<boolean>>(async () => true)
  const deps: AgentDeps = {
    navigate,
    getPathname: () => path,
    getUser: () => usuario(role),
    getSales: () => useSalesStore.getState(),
    routes,
    searchArticles,
    searchClients,
    searchCatalog,
    logout,
    setTheme,
    requestConfirmation,
    getRegisteredTools: () => useAgentToolRegistry.getState().getAll(),
    getRegistryVersion: () => useAgentToolRegistry.getState().version,
    registryWait: FAST_REGISTRY_WAIT,
    pollMs: 1,
    ...overrides,
  }
  return {
    actions: createAgentActions(deps),
    navigate,
    searchArticles,
    searchClients,
    searchCatalog,
    logout,
    setTheme,
    requestConfirmation,
  }
}

const registrar = (scopeId: string, ...defs: AgentToolDef[]) =>
  useAgentToolRegistry.getState().register(scopeId, defs)

const herramienta = (name: string, run: AgentToolDef['run'] = async () => ({ ok: true, data: {} }), extra: Partial<AgentToolDef> = {}): AgentToolDef => ({
  name,
  description: `Tool de prueba ${name}`,
  parameters: { type: 'object', properties: {} },
  run,
  ...extra,
})

const sales = () => useSalesStore.getState()

beforeEach(() => {
  useAgentToolRegistry.setState({ tools: new Map(), version: 0 })
  useSalesStore.setState({
    items: [],
    cartOpen: false,
    activeDialog: null,
    lastSale: null,
    selectedCustomerId: '',
    customerPricingEnabled: false,
  })
})

describe('navegar', () => {
  it('rechaza una ruta no permitida para el rol', async () => {
    const { actions, navigate } = setup('vendedor')
    const result = await actions.execute('navegar', { ruta: '/reportes/dashboard' })
    expect(result.ok).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navega a una ruta permitida', async () => {
    const { actions, navigate } = setup('vendedor')
    expect(await actions.execute('navegar', { ruta: '/venta/historial' })).toEqual({
      ok: true,
      data: { ruta: '/venta/historial' },
    })
    expect(navigate).toHaveBeenCalledWith('/venta/historial')
  })

  it('el admin sí puede ir al dashboard', async () => {
    const { actions } = setup('admin')
    expect((await actions.execute('navegar', { ruta: '/reportes/dashboard' })).ok).toBe(true)
  })

  it('una ruta de detalle solo con un id de cliente obtenido de buscar_cliente', async () => {
    const { actions, navigate } = setup('vendedor')
    expect((await actions.execute('navegar', { ruta: '/clientes/listado/12' })).ok).toBe(false)
    await actions.execute('buscar_cliente', { texto: 'juan' })
    expect((await actions.execute('navegar', { ruta: '/clientes/listado/12' })).ok).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/clientes/listado/12')
  })
})

describe('agregar_item', () => {
  it('acota la cantidad al stock: stock 3 y cantidad 5 → 3', async () => {
    const { actions } = setup()
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    const result = await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 5 })

    expect(result).toMatchObject({ ok: true, data: { cantidad_en_carrito: 3, ajustado_por_stock: true } })
    expect(sales().items).toHaveLength(1)
    expect(sales().items[0]).toMatchObject({ id: '7::71', qty: 3, stock: 3 })
  })

  it('suma sobre lo que ya hay en el carrito', async () => {
    const { actions } = setup()
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 1 })
    const result = await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 2 })

    expect(result).toMatchObject({ ok: true, data: { cantidad_en_carrito: 3, ajustado_por_stock: false } })
    expect(sales().items[0].qty).toBe(3)
  })

  it('rechaza un artículo que no está en la caché de búsquedas', async () => {
    const { actions } = setup()
    const result = await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 1 })
    expect(result.ok).toBe(false)
    expect(sales().items).toHaveLength(0)
  })

  it('rechaza variantes ajenas al artículo, sin stock o argumentos inválidos', async () => {
    const { actions } = setup()
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    for (const args of [
      { articulo_id: 7, variante_id: 999, cantidad: 1 },
      { articulo_id: 7, variante_id: 72, cantidad: 1 },
      { articulo_id: 7, variante_id: 71, cantidad: 0 },
      { articulo_id: 7, variante_id: 71, cantidad: 1.5 },
      { articulo_id: '7', variante_id: 71, cantidad: 1 },
      { articulo_id: 7, variante_id: 71, cantidad: 100000 },
    ]) {
      expect((await actions.execute('agregar_item', args)).ok).toBe(false)
    }
    expect(sales().items).toHaveLength(0)
  })
})

describe('carrito', () => {
  async function conUnItem() {
    const ctx = setup()
    await ctx.actions.execute('buscar_articulos', { texto: 'camisa' })
    await ctx.actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 1 })
    return ctx
  }

  it('cambia la cantidad (acotada al stock) y quita el item', async () => {
    const { actions } = await conUnItem()
    expect(await actions.execute('cambiar_cantidad', { articulo_id: 7, variante_id: 71, cantidad: 9 })).toMatchObject({
      ok: true,
      data: { cantidad_en_carrito: 3, ajustado_por_stock: true },
    })
    expect((await actions.execute('quitar_item', { articulo_id: 7, variante_id: 71 })).ok).toBe(true)
    expect(sales().items).toHaveLength(0)
  })

  it('rechaza cambiar o quitar algo que no está en el carrito', async () => {
    const { actions } = setup()
    expect((await actions.execute('cambiar_cantidad', { articulo_id: 7, variante_id: 71, cantidad: 2 })).ok).toBe(false)
    expect((await actions.execute('quitar_item', { articulo_id: 7, variante_id: 71 })).ok).toBe(false)
  })

  it('vaciar_carrito solo abre el diálogo de confirmación', async () => {
    const { actions } = await conUnItem()
    expect((await actions.execute('vaciar_carrito', {})).ok).toBe(true)
    expect(sales().activeDialog).toBe('clear-cart')
    expect(sales().items).toHaveLength(1)
  })
})

describe('cliente', () => {
  it('selecciona solo un cliente que buscar_cliente devolvió', async () => {
    const { actions } = setup()
    expect((await actions.execute('seleccionar_cliente', { cliente_id: 12 })).ok).toBe(false)
    expect(sales().selectedCustomerId).toBe('')

    await actions.execute('buscar_cliente', { texto: 'juan' })
    expect(await actions.execute('seleccionar_cliente', { cliente_id: 12 })).toMatchObject({
      ok: true,
      data: { cliente_id: 12, nombre: 'Juan Pérez' },
    })
    expect(sales().selectedCustomerId).toBe('12')
  })

  it('no cambia el modo de precios por cliente (ni activándolo ni desactivándolo)', async () => {
    const { actions } = setup()
    await actions.execute('buscar_cliente', { texto: 'juan' })

    expect(await actions.execute('seleccionar_cliente', { cliente_id: 12 })).toMatchObject({
      data: { precios_por_cliente: false },
    })
    expect(sales().customerPricingEnabled).toBe(false)

    useSalesStore.setState({ customerPricingEnabled: true })
    expect(await actions.execute('seleccionar_cliente', { cliente_id: 12 })).toMatchObject({
      data: { precios_por_cliente: true },
    })
    expect(sales().customerPricingEnabled).toBe(true)
  })
})

describe('carrito y cobro requieren el punto de venta', () => {
  it('abrir_carrito navega primero al POS y luego abre el carrito', async () => {
    const { actions, navigate } = setup('vendedor', '/venta/historial')
    expect((await actions.execute('abrir_carrito', {})).ok).toBe(true)
    expect(navigate).toHaveBeenCalledWith(POS_PATH)
    expect(sales().cartOpen).toBe(true)
  })

  it('ya en el POS no navega', async () => {
    const { actions, navigate } = setup('vendedor', POS_PATH)
    await actions.execute('abrir_carrito', {})
    expect(navigate).not.toHaveBeenCalled()
  })

  it('si la navegación no se completa, falla y no abre nada', async () => {
    const { actions, navigate } = setup('vendedor', '/venta/historial')
    navigate.mockImplementation(() => undefined) // el router nunca llega a la ruta
    vi.useFakeTimers()
    try {
      const pending = actions.execute('abrir_carrito', {})
      await vi.advanceTimersByTimeAsync(4000)
      expect((await pending).ok).toBe(false)
      expect(sales().cartOpen).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('abrir_checkout deja el cobro listo pero nunca envía la venta', async () => {
    const { actions, navigate } = setup('vendedor', '/home')
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 1 })

    const result = await actions.execute('abrir_checkout', {})
    expect(result.ok).toBe(true)
    expect(navigate).toHaveBeenCalledWith(POS_PATH)
    expect(sales().activeDialog).toBe('checkout')
    expect(sales().items).toHaveLength(1) // el carrito sigue intacto
    expect(sales().lastSale).toBeNull()
  })

  it('abrir_checkout con el carrito vacío falla', async () => {
    const { actions } = setup()
    expect((await actions.execute('abrir_checkout', {})).ok).toBe(false)
    expect(sales().activeDialog).toBeNull()
  })

  it('el admin no tiene acceso al POS: ninguna tool de venta funciona', async () => {
    const { actions, searchArticles, navigate } = setup('admin')
    for (const [name, args] of [
      ['abrir_carrito', {}],
      ['abrir_checkout', {}],
      ['seleccionar_cliente', { cliente_id: 12 }],
    ] as const) {
      expect((await actions.execute(name, args)).ok).toBe(false)
    }
    expect(searchArticles).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe('buscar_articulos', () => {
  it('con POS busca en el POS (con stock)', async () => {
    const { actions, searchArticles, searchCatalog } = setup('vendedor')
    const result = await actions.execute('buscar_articulos', { texto: 'camisa' })
    expect(result).toMatchObject({
      ok: true,
      data: [{ id: 7, variantes: expect.arrayContaining([expect.objectContaining({ id: 71, stock: 3 })]) }],
    })
    expect(searchArticles).toHaveBeenCalled()
    expect(searchCatalog).not.toHaveBeenCalled()
  })

  it('sin POS pero con acceso al catálogo usa el catálogo, sin stock', async () => {
    const { actions, searchArticles, searchCatalog } = setup('admin')
    const result = await actions.execute('buscar_articulos', { texto: 'camisa' })
    expect(result).toEqual({
      ok: true,
      data: [{ id: 7, nombre: 'Camisa', variantes: [{ id: 71, talla: 'M', precio: 100 }] }],
    })
    expect(searchCatalog).toHaveBeenCalledWith('camisa')
    expect(searchArticles).not.toHaveBeenCalled()
  })

  it('lo que devuelve el catálogo no sirve para agregar_item', async () => {
    const { actions } = setup('admin')
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    expect((await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 1 })).ok).toBe(false)
    expect(sales().items).toHaveLength(0)
  })

  it('sin POS ni catálogo falla', async () => {
    const { actions, searchArticles, searchCatalog } = setup('vendedor', '/home', [])
    expect(await actions.execute('buscar_articulos', { texto: 'x' })).toEqual({
      ok: false,
      error: 'Tu rol no tiene acceso a articulos.',
    })
    expect(searchArticles).not.toHaveBeenCalled()
    expect(searchCatalog).not.toHaveBeenCalled()
  })
})

describe('sugerencias por parecido (errores de dictado)', () => {
  const marcador = { ...camisa, id: 9, name: 'Marcador con Brich', variants: camisa.variants.map((v) => ({ ...v, id: 91 })) }

  it('con resultado exacto no pide sugerencias', async () => {
    const suggestArticles = vi.fn(async () => [marcador])
    const { actions } = setup('vendedor', '/home', allFeatureRoutes, { suggestArticles })
    expect(await actions.execute('buscar_articulos', { texto: 'camisa' })).toMatchObject({ ok: true, data: [{ id: 7 }] })
    expect(suggestArticles).not.toHaveBeenCalled()
  })

  it('sin resultado exacto devuelve sugerencias con aviso y sirven para agregar_item', async () => {
    const suggestArticles = vi.fn(async () => [marcador])
    const { actions } = setup('vendedor', '/home', allFeatureRoutes, { searchArticles: vi.fn(async () => []), suggestArticles })
    const result = await actions.execute('buscar_articulos', { texto: 'marcador con bridge' })
    expect(result).toMatchObject({ ok: true, data: { aviso: expect.stringMatching(/pregunta/), sugerencias: [{ id: 9, nombre: 'Marcador con Brich' }] } })
    expect(suggestArticles).toHaveBeenCalledWith('marcador con bridge')
    expect((await actions.execute('agregar_item', { articulo_id: 9, variante_id: 91, cantidad: 1 })).ok).toBe(true)
  })

  it('sin resultado ni sugerencias devuelve la lista vacia', async () => {
    const { actions } = setup('vendedor', '/home', allFeatureRoutes, {
      searchArticles: vi.fn(async () => []),
      suggestArticles: vi.fn(async () => []),
    })
    expect(await actions.execute('buscar_articulos', { texto: 'zzz' })).toEqual({ ok: true, data: [] })
  })

  it('el catalogo (admin) tambien sugiere', async () => {
    const suggestCatalog = vi.fn(async () => [{ id: 9, nombre: 'Marcador con Brich', variantes: [] }])
    const { actions } = setup('admin', '/home', allFeatureRoutes, { searchCatalog: vi.fn(async () => []), suggestCatalog })
    expect(await actions.execute('buscar_articulos', { texto: 'bridge' })).toMatchObject({
      ok: true,
      data: { sugerencias: [{ id: 9 }] },
    })
  })

  it('buscar_cliente sugiere y el id sugerido queda conocido para navegar a su ficha', async () => {
    const { actions, navigate } = setup('admin', '/home', allFeatureRoutes, {
      searchClients: vi.fn(async () => []),
      suggestClients: vi.fn(async () => [{ id: 33, nombre: 'Manuelito Perez' }]),
    })
    expect(await actions.execute('buscar_cliente', { texto: 'manuelito peres' })).toMatchObject({
      ok: true,
      data: { sugerencias: [{ id: 33, nombre: 'Manuelito Perez' }] },
    })
    await actions.execute('navegar', { ruta: '/clientes/listado/33' })
    expect(navigate).toHaveBeenCalledWith('/clientes/listado/33')
  })
})

describe('cambiar_tema y cerrar_sesion', () => {
  it('cambia el tema', async () => {
    const { actions, setTheme } = setup()
    expect((await actions.execute('cambiar_tema', { tema: 'oscuro' })).ok).toBe(true)
    expect(setTheme).toHaveBeenLastCalledWith('dark')
    await actions.execute('cambiar_tema', { tema: 'claro' })
    expect(setTheme).toHaveBeenLastCalledWith('light')
  })

  it('rechaza un tema inválido', async () => {
    const { actions, setTheme } = setup()
    for (const tema of ['dark', '', 3, undefined]) {
      expect((await actions.execute('cambiar_tema', { tema })).ok).toBe(false)
    }
    expect(setTheme).not.toHaveBeenCalled()
  })

  it('cerrar_sesion pide confirmación y solo cierra si el usuario confirma', async () => {
    const { actions, logout, requestConfirmation } = setup()
    expect((await actions.execute('cerrar_sesion', {})).ok).toBe(true)
    expect(requestConfirmation).toHaveBeenCalledOnce()
    expect(logout).toHaveBeenCalledOnce()
  })

  it('si el usuario cancela, no cierra la sesión', async () => {
    const { actions, logout, requestConfirmation } = setup()
    requestConfirmation.mockResolvedValueOnce(false)
    expect(await actions.execute('cerrar_sesion', {})).toEqual({ ok: false, error: 'El usuario canceló la acción.' })
    expect(logout).not.toHaveBeenCalled()
  })
})

describe('cerrar_dialogo', () => {
  const conCierre = (resultado: CloseDialogOutcome['resultado'], titulo?: string) =>
    vi.fn(async (): Promise<CloseDialogOutcome> => ({ resultado, titulo }))

  it('cierra el diálogo y espera a que la pantalla actualice sus tools', async () => {
    const closeDialog = conCierre('cerrado', 'Nuevo cliente')
    const { actions } = setup('vendedor', '/home', allFeatureRoutes, { closeDialog })
    expect(await actions.execute('cerrar_dialogo', {})).toEqual({
      ok: true,
      data: { mensaje: 'Dialogo "Nuevo cliente" cerrado sin guardar.' },
    })
    expect(closeDialog).toHaveBeenCalledOnce()
  })

  it.each([
    ['sin_dialogo', 'No hay ningun dialogo abierto.'],
    ['ocupado', 'El dialogo esta procesando; espera a que termine.'],
    ['no_cerro', 'El dialogo no se cerro; pidele al usuario que lo cierre.'],
  ] as const)('%s se informa como fallo', async (resultado, error) => {
    const { actions } = setup('vendedor', '/home', allFeatureRoutes, { closeDialog: conCierre(resultado) })
    expect(await actions.execute('cerrar_dialogo', {})).toEqual({ ok: false, error })
  })

  it('sin control de diálogos (entorno sin DOM) falla en vez de fingir que cerró', async () => {
    const { actions } = setup()
    expect((await actions.execute('cerrar_dialogo', {})).ok).toBe(false)
  })
})

describe('tools registradas por las pantallas', () => {
  it('ejecuta una tool del registro y devuelve su resultado', async () => {
    const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: { hecho: true } }))
    registrar('pantalla', herramienta('filtrar_cosas', run))
    const { actions } = setup()
    expect(await actions.execute('filtrar_cosas', { texto: 'a' })).toEqual({ ok: true, data: { hecho: true } })
    expect(run).toHaveBeenCalledWith({ texto: 'a' })
  })

  it('validar también corta las tools sin confirmación, antes de ejecutar', async () => {
    const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
    registrar('pantalla', herramienta('abrir_algo', run, { validar: () => 'No existe ese elemento.' }))
    const { actions } = setup()
    expect(await actions.execute('abrir_algo', {})).toEqual({ ok: false, error: 'No existe ese elemento.' })
    expect(run).not.toHaveBeenCalled()
  })

  it('una tool que ya no está registrada se rechaza', async () => {
    registrar('pantalla', herramienta('filtrar_cosas'))
    const { actions } = setup()
    useAgentToolRegistry.getState().unregister('pantalla')
    expect((await actions.execute('filtrar_cosas', {})).ok).toBe(false)
  })

  it('una pantalla no puede pisar una tool global', async () => {
    const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
    registrar('pantalla', herramienta('cambiar_tema', run))
    const { actions, setTheme } = setup()
    await actions.execute('cambiar_tema', { tema: 'oscuro' })
    expect(run).not.toHaveBeenCalled()
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('un error dentro de la tool se devuelve como fallo', async () => {
    registrar('pantalla', herramienta('rompe_todo', async () => { throw new Error('boom') }))
    const { actions } = setup()
    expect(await actions.execute('rompe_todo', {})).toEqual({ ok: false, error: 'La accion fallo. Intenta de nuevo.' })
  })

  describe('requiere_confirmacion', () => {
    const borrar = (run: AgentToolDef['run'], extra: Partial<AgentToolDef> = {}) =>
      herramienta('borrar_precio', run, {
        requiere_confirmacion: true,
        // La variante "existe" solo si es un entero positivo (en las pantallas reales, si está en la lista cargada).
        validar: (args) =>
          Number.isInteger(args.variante_id) && (args.variante_id as number) > 0 ? null : 'variante_id invalido.',
        textoConfirmacion: (args) => `Eliminar el precio de la variante ${String(args.variante_id)}`,
        ...extra,
      })

    it('no ejecuta nada si el usuario cancela', async () => {
      const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
      registrar('pantalla', borrar(run))
      const { actions, requestConfirmation } = setup()
      requestConfirmation.mockResolvedValueOnce(false)

      expect(await actions.execute('borrar_precio', { variante_id: 5 })).toEqual({
        ok: false,
        error: 'El usuario canceló la acción.',
      })
      expect(run).not.toHaveBeenCalled()
    })

    it('ejecuta solo tras la confirmación, mostrando el texto armado con datos reales', async () => {
      const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: { borrado: true } }))
      registrar('pantalla', borrar(run))
      const { actions, requestConfirmation } = setup()

      const result = await actions.execute('borrar_precio', { variante_id: 5 })
      expect(requestConfirmation).toHaveBeenCalledWith('Eliminar el precio de la variante 5', undefined)
      expect(result).toEqual({ ok: true, data: { borrado: true } })
      expect(run).toHaveBeenCalledOnce()
    })

    it('con argumentos inválidos NO se pide confirmación ni se ejecuta', async () => {
      const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
      registrar('pantalla', borrar(run))
      const { actions, requestConfirmation } = setup()

      expect(await actions.execute('borrar_precio', { variante_id: 'x' })).toEqual({
        ok: false,
        error: 'variante_id invalido.',
      })
      expect(await actions.execute('borrar_precio', {})).toEqual({ ok: false, error: 'variante_id invalido.' })
      expect(requestConfirmation).not.toHaveBeenCalled()
      expect(run).not.toHaveBeenCalled()
    })

    it('el texto de la confirmación solo se arma tras validar (no se llama con argumentos inválidos)', async () => {
      const textoConfirmacion = vi.fn(() => 'texto')
      registrar('pantalla', borrar(async () => ({ ok: true, data: {} }), { textoConfirmacion }))
      const { actions } = setup()
      await actions.execute('borrar_precio', { variante_id: 'x' })
      expect(textoConfirmacion).not.toHaveBeenCalled()
      await actions.execute('borrar_precio', { variante_id: 3 })
      expect(textoConfirmacion).toHaveBeenCalledOnce()
    })

    it('si no se puede armar el texto, no se pide confirmación a ciegas', async () => {
      registrar('pantalla', borrar(async () => ({ ok: true, data: {} }), { textoConfirmacion: () => '' }))
      const { actions, requestConfirmation } = setup()
      expect((await actions.execute('borrar_precio', { variante_id: 3 })).ok).toBe(false)
      expect(requestConfirmation).not.toHaveBeenCalled()
    })

    it('una tool con confirmación pero sin validar queda descartada del registro', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      registrar('pantalla', borrar(async () => ({ ok: true, data: {} }), { validar: undefined }))
      const { actions, requestConfirmation } = setup()
      expect(useAgentToolRegistry.getState().getAll()).toEqual([])
      expect((await actions.execute('borrar_precio', { variante_id: 3 })).ok).toBe(false)
      expect(requestConfirmation).not.toHaveBeenCalled()
    })

    it('la confirmación se pide antes de ejecutar, no después', async () => {
      const orden: string[] = []
      registrar('pantalla', borrar(async () => { orden.push('run'); return { ok: true, data: {} } }))
      const { actions, requestConfirmation } = setup()
      requestConfirmation.mockImplementationOnce(async () => { orden.push('confirmar'); return true })
      await actions.execute('borrar_precio', { variante_id: 5 })
      expect(orden).toEqual(['confirmar', 'run'])
    })

    it('la tarjeta caduca antes de que el back deje de esperar', async () => {
      registrar('pantalla', borrar(async () => ({ ok: true, data: {} })))
      const { actions, requestConfirmation } = setup()
      await actions.execute('borrar_precio', { variante_id: 5 }, { confirmTimeoutMs: 90_000 })
      expect(requestConfirmation).toHaveBeenLastCalledWith('Eliminar el precio de la variante 5', 87_000)
      await actions.execute('borrar_precio', { variante_id: 5 }, { confirmTimeoutMs: 1000 })
      expect(requestConfirmation).toHaveBeenLastCalledWith('Eliminar el precio de la variante 5', 5000)
    })

    it('si el diálogo se cerró mientras el usuario confirmaba, no se ejecuta', async () => {
      const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
      registrar('pantalla', borrar(run))
      const { actions, requestConfirmation } = setup()
      requestConfirmation.mockImplementationOnce(async () => {
        useAgentToolRegistry.getState().unregister('pantalla')
        return true
      })
      expect(await actions.execute('borrar_precio', { variante_id: 5 })).toEqual({
        ok: false,
        error: 'La pantalla cambio mientras se confirmaba; la accion no se ejecuto.',
      })
      expect(run).not.toHaveBeenCalled()
    })

    it('se vuelve a validar tras la confirmación (los datos pudieron cambiar)', async () => {
      const run = vi.fn(async (): Promise<ToolResult> => ({ ok: true, data: {} }))
      let existe = true
      registrar('pantalla', borrar(run, { validar: () => (existe ? null : 'Ya no existe esa variante.') }))
      const { actions, requestConfirmation } = setup()
      requestConfirmation.mockImplementationOnce(async () => {
        existe = false
        return true
      })
      expect(await actions.execute('borrar_precio', { variante_id: 5 })).toEqual({ ok: false, error: 'Ya no existe esa variante.' })
      expect(run).not.toHaveBeenCalled()
    })
  })

  describe('espera de la UI nueva', () => {
    const LAZY_WAIT = { quietMs: 1000, settleMs: 20, pollMs: 5, timeoutMs: 3000 }

    it('navegar espera a que la pantalla nueva registre sus tools', async () => {
      const { actions } = setup('admin', '/home', allFeatureRoutes, {
        registryWait: LAZY_WAIT,
        navigate: (to) => {
          // la ruta es lazy: primero cambia la URL y un instante después se monta y registra
          currentPath = to
          setTimeout(() => registrar('clientes', herramienta('leer_clientes')), 30)
        },
        getPathname: () => currentPath,
      })
      let currentPath = '/home'
      await actions.execute('navegar', { ruta: '/clientes/listado' })

      expect(useAgentToolRegistry.getState().getAll().map((t) => t.name)).toEqual(['leer_clientes'])
      const estado = await actions.execute('leer_estado', {})
      expect(estado).toMatchObject({ ok: true, data: { herramientas_de_pantalla: ['leer_clientes'] } })
    })

    it('una tool con abreUi espera a que el diálogo que abrió registre las suyas', async () => {
      registrar(
        'pantalla',
        herramienta(
          'abrir_nuevo_cosa',
          async () => {
            setTimeout(() => registrar('dialogo', herramienta('llenar_formulario_cosa')), 30)
            return { ok: true, data: {} }
          },
          { abreUi: true },
        ),
      )
      const { actions } = setup('vendedor', '/home', allFeatureRoutes, { registryWait: LAZY_WAIT })
      await actions.execute('abrir_nuevo_cosa', {})
      expect(useAgentToolRegistry.getState().getAll().map((t) => t.name)).toContain('llenar_formulario_cosa')
    })

    it('si la ruta nunca llega, navegar falla', async () => {
      const { actions } = setup('vendedor', '/home', allFeatureRoutes, {
        navigate: () => undefined,
        registryWait: LAZY_WAIT,
      })
      vi.useFakeTimers()
      try {
        const pending = actions.execute('navegar', { ruta: '/venta/historial' })
        await vi.advanceTimersByTimeAsync(4000)
        expect((await pending).ok).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

describe('admin: sin POS pero con acceso a clientes', () => {
  it('puede buscar clientes', async () => {
    const { actions, searchClients } = setup('admin')
    expect(await actions.execute('buscar_cliente', { texto: 'maria' })).toMatchObject({
      ok: true,
      data: [{ id: 12, nombre: 'Juan Pérez' }],
    })
    expect(searchClients).toHaveBeenCalledWith('maria')
  })

  it('tras buscar, puede abrir la ficha del cliente con el id devuelto', async () => {
    const { actions, navigate } = setup('admin')
    expect((await actions.execute('navegar', { ruta: '/clientes/listado/12' })).ok).toBe(false)
    await actions.execute('buscar_cliente', { texto: 'juan' })
    expect((await actions.execute('navegar', { ruta: '/clientes/listado/12' })).ok).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/clientes/listado/12')
  })

  it('no puede seleccionar el cliente de la venta (requiere el POS)', async () => {
    const { actions } = setup('admin')
    await actions.execute('buscar_cliente', { texto: 'juan' })
    expect((await actions.execute('seleccionar_cliente', { cliente_id: 12 })).ok).toBe(false)
    expect(sales().selectedCustomerId).toBe('')
  })

  it('sin acceso a clientes ni al POS, buscar_cliente falla', async () => {
    const { actions, searchClients } = setup('vendedor', '/home', [])
    expect(await actions.execute('buscar_cliente', { texto: 'x' })).toEqual({
      ok: false,
      error: 'Tu rol no tiene acceso a clientes.',
    })
    expect(searchClients).not.toHaveBeenCalled()
  })
})

describe('leer_estado y robustez', () => {
  it('devuelve ruta, carrito y diálogo', async () => {
    const { actions } = setup('vendedor', POS_PATH)
    await actions.execute('buscar_articulos', { texto: 'camisa' })
    await actions.execute('agregar_item', { articulo_id: 7, variante_id: 71, cantidad: 2 })
    await actions.execute('abrir_carrito', {})

    const result = await actions.execute('leer_estado', {})
    expect(result).toMatchObject({
      ok: true,
      data: { ruta: POS_PATH, carrito_abierto: true, dialogo: null, carrito: { total: 200 } },
    })
  })

  it('rechaza acciones desconocidas (incluidas las heredadas del prototipo)', async () => {
    const { actions } = setup()
    expect((await actions.execute('borrar_todo', {})).ok).toBe(false)
    expect((await actions.execute('constructor', {})).ok).toBe(false)
    expect((await actions.execute('toString', {})).ok).toBe(false)
  })

  it('un error en la búsqueda se devuelve como fallo, no como excepción', async () => {
    const { actions, searchArticles } = setup()
    searchArticles.mockRejectedValueOnce(new Error('red caida'))
    const result = await actions.execute('buscar_articulos', { texto: 'camisa' })
    expect(result).toEqual({ ok: false, error: 'La accion fallo. Intenta de nuevo.' })
  })

  it('sin sesión no ejecuta nada', async () => {
    let path = '/home'
    const actions = createAgentActions({
      navigate: (p) => {
        path = p
      },
      getPathname: () => path,
      getUser: () => null,
      getSales: () => useSalesStore.getState(),
      routes: allFeatureRoutes,
      searchArticles: async () => [],
      searchClients: async () => [],
      searchCatalog: async () => [],
      logout: () => undefined,
      setTheme: () => undefined,
      requestConfirmation: async () => true,
      getRegisteredTools: () => [],
      getRegistryVersion: () => 0,
    })
    expect((await actions.execute('leer_estado', {})).ok).toBe(false)
  })
})
