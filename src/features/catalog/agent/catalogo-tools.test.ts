import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { formatCurrency } from '@/helpers/money'
import type { Article } from '../types/article-types'
import type { ArticleVariant } from '../types/article-variant-types'
import type { UserVariantPricing } from '../types/pricing-types'
import type { DraftRow, TierRow } from '../utils/pricing-draft'
import {
  DEFAULT_SIZES,
  buildArticuloDialogTools,
  buildArticulosTools,
  sanitizeArticuloValues,
  type ArticulosAgentContext,
} from './articulos-tools'
import {
  buildMayoreoEditorTools,
  buildPreciosPageTools,
  buildPricingEditorTools,
  type MayoreoEditorAgentContext,
  type PricingEditorAgentContext,
} from './precios-tools'
import {
  buildStockEditorTools,
  buildSucursalPickerTools,
  planStockChanges,
  type StockEditorAgentContext,
  type SucursalPickerAgentContext,
} from './stock-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
/** Ejecuta como execute(): validar → (confirmación) → run. */
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>, confirma = true) {
  const invalid = def.validar?.(args)
  if (invalid) return { ok: false as const, error: invalid, confirmo: false }
  let confirmo = false
  if (def.requiere_confirmacion) {
    confirmo = true
    if (!confirma) return { ok: false as const, error: 'El usuario canceló la acción.', confirmo }
  }
  return { ...(await def.run(args)), confirmo }
}

// -- fixtures -----------------------------------------------------------------------------------

const article = (id: number, title: string): Article => ({ id, title, image: null })
const variant = (id: number, articleId: number, size: string, price = 100): ArticleVariant => ({
  id,
  articleId,
  size,
  sizeId: id,
  price,
})

const ARTICLES = [article(1, 'Camisa Polo'), article(2, 'Pantalón Jeans'), article(3, 'Gorra')]
const VARIANTS = [variant(11, 1, 'M', 100), variant(12, 1, 'L', 110), variant(21, 2, '32', 200)]

// -- artículos ----------------------------------------------------------------------------------

describe('sanitizeArticuloValues', () => {
  it('acepta título y precios por talla', () => {
    expect(sanitizeArticuloValues({ titulo: ' Faja ', precios: { 1: 125, '2': 130.5 } }, DEFAULT_SIZES)).toEqual({
      values: { titulo: 'Faja', precios: { '1': 125, '2': 130.5 } },
      ignorados: [],
      errores: [],
    })
  })

  it('rechaza tallas que el formulario no tiene y precios inválidos, sin aplicar parcialmente lo malo', () => {
    const r = sanitizeArticuloValues({ precios: { '7': 10, '1': -5, '2': 'x', '3': 20 } }, DEFAULT_SIZES)
    expect(r.values.precios).toEqual({ '3': 20 })
    expect(r.errores).toHaveLength(3)
  })

  it('reporta campos ajenos (la imagen no se puede subir por aquí) y entradas que no son objeto', () => {
    expect(sanitizeArticuloValues({ titulo: 'Faja', imagen: 'x.png' }, DEFAULT_SIZES).ignorados).toEqual(['imagen'])
    expect(sanitizeArticuloValues('x', DEFAULT_SIZES).errores).toHaveLength(1)
    expect(sanitizeArticuloValues({ precios: [1] }, DEFAULT_SIZES).errores).toHaveLength(1)
    expect(sanitizeArticuloValues({ titulo: '  ' }, DEFAULT_SIZES).errores).toHaveLength(1)
  })

  it('el formulario nuevo trae las tallas 1 a 6', () => {
    expect(DEFAULT_SIZES).toEqual(['1', '2', '3', '4', '5', '6'])
  })
})

function articulosCtx(overrides: Partial<ArticulosAgentContext> = {}) {
  return {
    getFilters: vi.fn(() => ({ texto: '', talla: 'todas', estado_tallas: 'todos' as const })),
    setFilters: vi.fn(),
    getSizes: () => ['32', 'L', 'M'],
    isLoading: () => false,
    getFiltered: () => [
      { article: ARTICLES[0], tallas: [{ talla: 'M', precio: 100 }, { talla: 'L', precio: 110 }] },
      { article: ARTICLES[2], tallas: [] },
    ],
    getArticle: (id: number) => ARTICLES.find((a) => a.id === id),
    getArticleSizes: (id: number) => VARIANTS.filter((v) => v.articleId === id).map((v) => v.size),
    isDialogOpen: vi.fn(() => false),
    isDeleteOpen: vi.fn(() => false),
    openNew: vi.fn(),
    openEdit: vi.fn(),
    openDelete: vi.fn(),
    goToPrecios: vi.fn(),
    ...overrides,
  } satisfies ArticulosAgentContext
}

describe('tools de /catalogo/productos', () => {
  describe('filtrar_articulos y leer_articulos', () => {
    it('aplica texto, talla y estado de tallas', async () => {
      const ctx = articulosCtx()
      const result = await ejecutar(tool(buildArticulosTools(ctx), 'filtrar_articulos'), {
        texto: ' polo ',
        talla: 'm',
        estado_tallas: 'con_tallas',
      })
      expect(result.ok).toBe(true)
      expect(ctx.setFilters).toHaveBeenCalledWith({ texto: 'polo', talla: 'M', estado_tallas: 'con_tallas' })
    })

    it("'todas' quita el filtro de talla", async () => {
      const ctx = articulosCtx()
      await ejecutar(tool(buildArticulosTools(ctx), 'filtrar_articulos'), { talla: 'todas' })
      expect(ctx.setFilters).toHaveBeenCalledWith({ talla: 'all' })
    })

    it('rechaza tallas que no existen, estados inválidos o ningún filtro', async () => {
      const ctx = articulosCtx()
      const def = tool(buildArticulosTools(ctx), 'filtrar_articulos')
      for (const args of [{}, { talla: 'XXL' }, { estado_tallas: 'raro' }, { texto: 5 }]) {
        expect((await ejecutar(def, args)).ok, JSON.stringify(args)).toBe(false)
      }
      expect(ctx.setFilters).not.toHaveBeenCalled()
    })

    it('leer_articulos resume id, título y tallas', async () => {
      const result = await tool(buildArticulosTools(articulosCtx()), 'leer_articulos').run({})
      expect(result).toMatchObject({
        ok: true,
        data: {
          total: 2,
          articulos: [
            { id: 1, titulo: 'Camisa Polo', precio_desde: 100, tallas: [{ talla: 'M', precio: 100 }, { talla: 'L', precio: 110 }] },
            { id: 3, titulo: 'Gorra', tallas: [] },
          ],
        },
      })
    })
  })

  describe('abrir_nuevo_articulo', () => {
    it('abre el formulario precargado y SIEMPRE avisa que la imagen la elige el usuario', async () => {
      const ctx = articulosCtx()
      const result = await ejecutar(tool(buildArticulosTools(ctx), 'abrir_nuevo_articulo'), {
        valores: { titulo: 'Faja cruceta', precios: { '1': 125 } },
      })
      expect(ctx.openNew).toHaveBeenCalledWith({ titulo: 'Faja cruceta', precios: { '1': 125 } })
      expect(result).toMatchObject({ ok: true, data: { imagen: expect.stringContaining('selecciona el usuario') } })
    })

    it('el aviso de la imagen también va cuando se abre vacío', async () => {
      const ctx = articulosCtx()
      const result = await ejecutar(tool(buildArticulosTools(ctx), 'abrir_nuevo_articulo'), {})
      expect(ctx.openNew).toHaveBeenCalledWith(undefined)
      expect(result).toMatchObject({ data: { imagen: expect.stringContaining('selecciona el usuario') } })
    })

    it('valida las tallas contra las 6 del formulario nuevo', async () => {
      const ctx = articulosCtx()
      expect((await ejecutar(tool(buildArticulosTools(ctx), 'abrir_nuevo_articulo'), { valores: { precios: { M: 10 } } })).ok).toBe(false)
      expect(ctx.openNew).not.toHaveBeenCalled()
    })
  })

  describe('abrir_editar_articulo', () => {
    it('abre el formulario del artículo con precios por SUS tallas', async () => {
      const ctx = articulosCtx()
      const result = await ejecutar(tool(buildArticulosTools(ctx), 'abrir_editar_articulo'), {
        articulo_id: 1,
        valores: { titulo: 'Camisa Polo Pro', precios: { m: 120 } },
      })
      expect(result.ok).toBe(true)
      expect(ctx.openEdit).toHaveBeenCalledWith(ARTICLES[0], { titulo: 'Camisa Polo Pro', precios: { M: 120 } })
    })

    it('una talla que el artículo no tiene se rechaza (las de otros artículos no valen)', async () => {
      const ctx = articulosCtx()
      expect((await ejecutar(tool(buildArticulosTools(ctx), 'abrir_editar_articulo'), { articulo_id: 1, valores: { precios: { '32': 10 } } })).ok).toBe(false)
      expect((await ejecutar(tool(buildArticulosTools(ctx), 'abrir_editar_articulo'), { articulo_id: 999 })).ok).toBe(false)
      expect(ctx.openEdit).not.toHaveBeenCalled()
    })
  })

  it('abrir_eliminar_articulo solo abre la confirmación existente', async () => {
    const ctx = articulosCtx()
    const result = await ejecutar(tool(buildArticulosTools(ctx), 'abrir_eliminar_articulo'), { articulo_id: 2 })
    expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('debe presionar Eliminar') } })
    expect(ctx.openDelete).toHaveBeenCalledWith(ARTICLES[1])
    expect((await ejecutar(tool(buildArticulosTools(ctx), 'abrir_eliminar_articulo'), { articulo_id: 999 })).ok).toBe(false)
  })

  describe('ir_a_precios_articulo', () => {
    it('navega como el botón actual y avisa que hay que elegir la sucursal', async () => {
      const ctx = articulosCtx()
      const result = await ejecutar(tool(buildArticulosTools(ctx), 'ir_a_precios_articulo'), { articulo_id: 1 })
      expect(ctx.goToPrecios).toHaveBeenCalledWith(1)
      expect(result).toMatchObject({ ok: true, data: { aviso: expect.stringContaining('elegir primero la sucursal') } })
    })

    it('un artículo inexistente no navega', async () => {
      const ctx = articulosCtx()
      expect((await ejecutar(tool(buildArticulosTools(ctx), 'ir_a_precios_articulo'), { articulo_id: 999 })).ok).toBe(false)
      expect(ctx.goToPrecios).not.toHaveBeenCalled()
    })
  })

  describe('con un diálogo ya abierto', () => {
    const FORM = 'El formulario ya está abierto: usa llenar_formulario_articulo para cambiar campos.'
    const GENERICO = 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.'

    it('el formulario abierto apunta a llenar_formulario_articulo (nuevo y editar)', async () => {
      const ctx = articulosCtx({ isDialogOpen: () => true })
      expect(await ejecutar(tool(buildArticulosTools(ctx), 'abrir_nuevo_articulo'), {})).toMatchObject({ ok: false, error: FORM })
      expect(await ejecutar(tool(buildArticulosTools(ctx), 'abrir_editar_articulo'), { articulo_id: 1 })).toMatchObject({ ok: false, error: FORM })
      expect(ctx.openNew).not.toHaveBeenCalled()
      expect(ctx.openEdit).not.toHaveBeenCalled()
    })

    it('con la confirmación de eliminar abierta, ninguna abre otro diálogo ni navega', async () => {
      const ctx = articulosCtx({ isDeleteOpen: () => true })
      for (const [name, args] of [
        ['abrir_nuevo_articulo', {}],
        ['abrir_editar_articulo', { articulo_id: 1 }],
        ['abrir_eliminar_articulo', { articulo_id: 1 }],
        ['ir_a_precios_articulo', { articulo_id: 1 }],
      ] as const) {
        expect(await ejecutar(tool(buildArticulosTools(ctx), name), args), name).toMatchObject({ ok: false, error: GENERICO })
      }
    })
  })

  describe('llenar_formulario_articulo (dentro del diálogo)', () => {
    const dialog = (setValues = vi.fn()) =>
      buildArticuloDialogTools({
        getSizes: () => ['M', 'L'],
        getValues: () => ({ titulo: 'Camisa', precios: { M: '100', L: '110' } }),
        setValues,
      })[0]

    it('escribe título y precios, no guarda y recuerda lo de la imagen', async () => {
      const setValues = vi.fn()
      const result = await dialog(setValues).run({ titulo: 'Camisa Pro', precios: { M: 120 } })
      expect(setValues).toHaveBeenCalledWith({ titulo: 'Camisa Pro', precios: { M: 120 } })
      expect(result).toMatchObject({ ok: true, data: { imagen: expect.stringContaining('selecciona el usuario'), mensaje: expect.stringContaining('guardar') } })
    })

    it('rechaza tallas ajenas y no aplica nada si no hay campos válidos', async () => {
      const setValues = vi.fn()
      expect((await dialog(setValues).run({ precios: { XL: 5 } })).ok).toBe(false)
      expect(await dialog(setValues).run({ imagen: 'x' })).toEqual({ ok: false, error: 'No hay ningun campo valido para llenar.' })
      expect(setValues).not.toHaveBeenCalled()
    })
  })
})

// -- sucursales (stock y precios) ---------------------------------------------------------------

describe('tools de la lista de sucursales', () => {
  const picker = (overrides: Partial<SucursalPickerAgentContext> = {}) => ({
    getSucursales: () => [{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Norte' }],
    isLoading: () => false,
    select: vi.fn(),
    ...overrides,
  })
  const names = { leer: 'leer_sucursales_stock', abrir: 'abrir_stock_sucursal', area: 'el stock' }

  it('lee las sucursales con su id', async () => {
    const result = await tool(buildSucursalPickerTools(picker(), names), 'leer_sucursales_stock').run({})
    expect(result).toMatchObject({ ok: true, data: { total: 2, sucursales: [{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Norte' }] } })
  })

  it('abre una sucursal de la lista y rechaza ids ajenos', async () => {
    const ctx = picker()
    const def = tool(buildSucursalPickerTools(ctx, names), 'abrir_stock_sucursal')
    expect((await ejecutar(def, { sucursal_id: 2 })).ok).toBe(true)
    expect(ctx.select).toHaveBeenCalledWith(2)
    for (const id of [99, 0, 'x', undefined]) expect((await ejecutar(def, { sucursal_id: id })).ok, String(id)).toBe(false)
    expect(ctx.select).toHaveBeenCalledTimes(1)
  })

  it('abreUi para esperar a que el editor registre sus tools; los nombres cambian según la pantalla', () => {
    const precios = buildSucursalPickerTools(picker(), { leer: 'leer_sucursales_precios', abrir: 'abrir_precios_sucursal', area: 'los precios' })
    expect(precios.map((t) => t.name)).toEqual(['leer_sucursales_precios', 'abrir_precios_sucursal'])
    expect(precios[1].abreUi).toBe(true)
  })
})

// -- stock --------------------------------------------------------------------------------------

describe('planStockChanges', () => {
  const saved: Record<number, number> = { 11: 10, 12: 0, 21: 5 }
  const draft: Record<number, number> = { 11: 10, 12: 3, 21: 5 }
  const q = { saved: (id: number) => saved[id] ?? 0, draft: (id: number) => draft[id] ?? 0 }
  const plan = (raw: unknown) => planStockChanges(raw, VARIANTS, ARTICLES, q)

  it('arma los cambios con artículo, talla, lo guardado y lo del borrador', () => {
    expect(plan([{ variante_id: 11, cantidad: 7 }])).toEqual({
      changes: [{ variantId: 11, articleId: 1, articulo: 'Camisa Polo', talla: 'M', guardado: 10, borradorAntes: 10, cantidad: 7 }],
    })
  })

  it('acepta 0 y rechaza negativos, decimales, textos y exceso', () => {
    expect('changes' in plan([{ variante_id: 11, cantidad: 0 }])).toBe(true)
    for (const cantidad of [-1, 1.5, '5', NaN, 2_000_000, null]) {
      expect('errores' in plan([{ variante_id: 11, cantidad }]), String(cantidad)).toBe(true)
    }
  })

  it('variantes ajenas, repetidas o entradas mal formadas: todo o nada', () => {
    expect('errores' in plan([{ variante_id: 999, cantidad: 1 }])).toBe(true)
    expect('errores' in plan([{ variante_id: 11, cantidad: 1 }, { variante_id: 11, cantidad: 2 }])).toBe(true)
    expect('errores' in plan([{ variante_id: 11, cantidad: 1 }, { variante_id: 999, cantidad: 2 }])).toBe(true)
    for (const raw of [[], null, 'x', {}, [null], Array.from({ length: 51 }, () => ({ variante_id: 11, cantidad: 1 }))]) {
      expect('errores' in plan(raw), JSON.stringify(raw)?.slice(0, 30)).toBe(true)
    }
  })
})

function stockCtx(overrides: Partial<StockEditorAgentContext> = {}) {
  const saved: Record<number, number> = { 11: 10, 12: 0, 21: 5 }
  const draft: Record<number, number> = { ...saved }
  return {
    getSucursalName: () => 'Centro',
    isLoading: () => false,
    getArticles: () => ARTICLES,
    getVariants: () => VARIANTS,
    getSaved: (id: number) => saved[id] ?? 0,
    getDraft: (id: number) => draft[id] ?? 0,
    hasUnsavedChanges: vi.fn(() => false),
    applyDraft: vi.fn(),
    goBack: vi.fn(),
    ...overrides,
  } satisfies StockEditorAgentContext
}

describe('tools del editor de stock', () => {
  it('leer_stock devuelve guardado y borrador por talla, y filtra por texto sin acentos', async () => {
    const todo = await tool(buildStockEditorTools(stockCtx()), 'leer_stock').run({})
    expect(todo).toMatchObject({
      ok: true,
      data: {
        sucursal: 'Centro',
        cambios_sin_guardar: false,
        articulos: [
          { articulo: 'Camisa Polo', variantes: [{ variante_id: 12, talla: 'L', guardado: 0, borrador: 0 }, { variante_id: 11, talla: 'M', guardado: 10, borrador: 10 }] },
          { articulo: 'Pantalón Jeans' },
        ],
      },
    })
    const filtrado = await tool(buildStockEditorTools(stockCtx()), 'leer_stock').run({ texto: 'pantalon' })
    expect((filtrado as { data: { articulos: unknown[] } }).data.articulos).toHaveLength(1)
  })

  describe('editar_stock', () => {
    it('modifica SOLO el borrador, expande los artículos afectados y dice que hay que guardar', async () => {
      const ctx = stockCtx()
      const result = await ejecutar(tool(buildStockEditorTools(ctx), 'editar_stock'), {
        cambios: [{ variante_id: 12, cantidad: 4 }, { variante_id: 11, cantidad: 12 }],
      })
      expect(ctx.applyDraft).toHaveBeenCalledWith(
        [{ variantId: 12, cantidad: 4 }, { variantId: 11, cantidad: 12 }],
        [1], // ambos son del mismo artículo: se expande una vez
      )
      expect(result).toMatchObject({
        ok: true,
        data: { mensaje: 'Solo se modifico el borrador. Presiona Guardar para aplicar.' },
      })
      expect(result).not.toMatchObject({ data: { aviso: expect.anything() } })
    })

    it('avisa del AJUSTE de inventario cuando una cantidad queda por debajo de la guardada', async () => {
      const ctx = stockCtx()
      const result = await ejecutar(tool(buildStockEditorTools(ctx), 'editar_stock'), {
        cambios: [{ variante_id: 11, cantidad: 4 }, { variante_id: 21, cantidad: 9 }],
      })
      expect(result).toMatchObject({
        ok: true,
        data: { aviso: expect.stringMatching(/AJUSTE de inventario.*Camisa Polo talla M baja de 10 a 4/) },
      })
      expect((result as { data: { aviso: string } }).data.aviso).not.toMatch(/Pantalón/) // la que sube no se menciona
    })

    it('comparar contra lo GUARDADO, no contra el borrador (subir y volver a bajar sigue siendo un ajuste)', async () => {
      const ctx = stockCtx({ getDraft: () => 50 }) // el borrador ya tenía 50 en todo
      const result = await ejecutar(tool(buildStockEditorTools(ctx), 'editar_stock'), { cambios: [{ variante_id: 11, cantidad: 20 }] })
      expect(result).not.toMatchObject({ data: { aviso: expect.anything() } }) // 20 > 10 guardado: no baja
    })

    it('un cambio inválido no aplica NINGUNO', async () => {
      const ctx = stockCtx()
      const def = tool(buildStockEditorTools(ctx), 'editar_stock')
      expect((await ejecutar(def, { cambios: [{ variante_id: 11, cantidad: 3 }, { variante_id: 999, cantidad: 1 }] })).ok).toBe(false)
      expect((await ejecutar(def, { cambios: [{ variante_id: 11, cantidad: -3 }] })).ok).toBe(false)
      expect(ctx.applyDraft).not.toHaveBeenCalled()
    })
  })

  describe('volver_stock', () => {
    it('vuelve a la lista cuando no hay cambios', async () => {
      const ctx = stockCtx()
      expect((await ejecutar(tool(buildStockEditorTools(ctx), 'volver_stock'), {})).ok).toBe(true)
      expect(ctx.goBack).toHaveBeenCalledOnce()
    })

    it('no descarta en silencio un borrador sin guardar', async () => {
      const ctx = stockCtx({ hasUnsavedChanges: () => true })
      expect(await ejecutar(tool(buildStockEditorTools(ctx), 'volver_stock'), {})).toMatchObject({
        ok: false,
        error: expect.stringContaining('cambios sin guardar'),
      })
      expect(ctx.goBack).not.toHaveBeenCalled()
    })
  })
})

// -- precios y mayoreo --------------------------------------------------------------------------

const pricing = (id: number, articleId: number, articulo: string, talla: string, extra: Partial<UserVariantPricing> = {}): UserVariantPricing => ({
  id_variante: id,
  id_articulo: articleId,
  articulo,
  id_talla: id,
  talla,
  precio_base: 100,
  precio_override: null,
  precio_efectivo: 100,
  individual_tiers: [],
  descuento_mayorista: null,
  tiene_config: false,
  es_default: true,
  ...extra,
})

const filaVacia = (): DraftRow => ({ precio: '', descuentoMayorista: '', tiers: [{ desde: '3', hasta: '', descuento: '' }] })

function pricingCtx(overrides: Partial<PricingEditorAgentContext> = {}) {
  const variants = [
    pricing(11, 1, 'Camisa Polo', 'M', { tiene_config: true, es_default: false, precio_override: 90 }),
    pricing(12, 1, 'Camisa Polo', 'L'),
    pricing(21, 2, 'Pantalón Jeans', '32', { precio_base: 200, precio_efectivo: 200 }),
  ]
  const server: Record<number, DraftRow> = {
    11: { precio: '90', descuentoMayorista: '', tiers: [{ desde: '3', hasta: '', descuento: '' }] },
    12: filaVacia(),
    21: filaVacia(),
  }
  const drafts: Record<number, DraftRow> = {}
  return {
    getSucursalName: () => 'Centro',
    isLoading: () => false,
    getVariants: () => variants,
    getRow: (id: number) => drafts[id] ?? server[id],
    getServerRow: (id: number) => server[id],
    dirtyCount: vi.fn(() => 0),
    setRow: vi.fn((id: number, row: DraftRow) => { drafts[id] = row }),
    resetVariant: vi.fn(async () => true),
    ...overrides,
  } satisfies PricingEditorAgentContext
}

describe('tools de precios por artículo (/catalogo/precios)', () => {
  it('leer_precios_sucursal muestra precio, descuento, rangos y si está modificada', async () => {
    const ctx = pricingCtx()
    await ejecutar(tool(buildPricingEditorTools(ctx), 'editar_precio_variante'), { variante_id: 12, precio: 80 })
    const result = await tool(buildPricingEditorTools(ctx), 'leer_precios_sucursal').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        sucursal: 'Centro',
        total: 3,
        variantes: [
          { variante_id: 12, articulo: 'Camisa Polo', talla: 'L', precio: 80, modificada: true, personalizada: false },
          { variante_id: 11, talla: 'M', precio: 90, modificada: false, personalizada: true },
          { variante_id: 21, articulo: 'Pantalón Jeans', precio: null },
        ],
      },
    })
  })

  describe('editar_precio_variante', () => {
    const def = (ctx = pricingCtx()) => tool(buildPricingEditorTools(ctx), 'editar_precio_variante')

    it('modifica SOLO el borrador, expande el artículo y dice que hay que guardar', async () => {
      const ctx = pricingCtx()
      const result = await ejecutar(def(ctx), { variante_id: 12, precio: 75.5, descuento_mayorista: 5, rangos: [{ desde: 2, hasta: 3, descuento: 4 }] })
      expect(ctx.setRow).toHaveBeenCalledWith(12, { precio: '75.5', descuentoMayorista: '5', tiers: [{ desde: '2', hasta: '3', descuento: '4' }] }, 1)
      expect(result).toMatchObject({
        ok: true,
        data: { mensaje: 'Solo se modifico el borrador. Presiona Guardar para aplicar.', variante: { precio: 75.5, modificada: true } },
      })
      expect(ctx.resetVariant).not.toHaveBeenCalled()
    })

    it('devuelve los errores de variantPricingRowSchema/validateTiers y no toca el borrador', async () => {
      const ctx = pricingCtx()
      const caro = await ejecutar(def(ctx), { variante_id: 12, descuento_mayorista: 150 }) // precio base 100
      expect(caro).toMatchObject({ ok: false, error: expect.stringMatching(/descuento_mayorista: El descuento no puede superar el precio/) })
      const solapa = await ejecutar(def(ctx), { variante_id: 12, rangos: [{ desde: 1, hasta: 5, descuento: 2 }, { desde: 3, descuento: 2 }] })
      expect(solapa).toMatchObject({ ok: false, error: expect.stringMatching(/Se solapa/) })
      expect(ctx.setRow).not.toHaveBeenCalled()
    })

    it('rechaza variantes ajenas y llamadas sin ningún cambio', async () => {
      const ctx = pricingCtx()
      expect((await ejecutar(def(ctx), { variante_id: 999, precio: 5 })).ok).toBe(false)
      expect((await ejecutar(def(ctx), { variante_id: 12 })).ok).toBe(false)
      expect(ctx.setRow).not.toHaveBeenCalled()
    })
  })

  describe('restablecer_precio_variante [confirmación]', () => {
    const def = (ctx = pricingCtx()) => tool(buildPricingEditorTools(ctx), 'restablecer_precio_variante')

    it('declara confirmación con validar y textoConfirmacion', () => {
      expect(def().requiere_confirmacion).toBe(true)
      expect(typeof def().validar).toBe('function')
      expect(typeof def().textoConfirmacion).toBe('function')
    })

    it('el texto sale de la variante real (con su precio guardado), no del modelo', () => {
      expect(def().textoConfirmacion?.({ variante_id: 11, texto: 'inventado' })).toBe(
        `Restablecer Camisa Polo talla M en Centro: se borra su configuracion guardada (precio ${formatCurrency(90)}) y vuelve a heredar los valores por defecto`,
      )
    })

    it('con confirmación borra la configuración guardada', async () => {
      const ctx = pricingCtx()
      const result = await ejecutar(def(ctx), { variante_id: 11 })
      expect(result).toMatchObject({ ok: true, confirmo: true })
      expect(ctx.resetVariant).toHaveBeenCalledOnce()
    })

    it('cancelado no borra nada', async () => {
      const ctx = pricingCtx()
      expect((await ejecutar(def(ctx), { variante_id: 11 }, false)).ok).toBe(false)
      expect(ctx.resetVariant).not.toHaveBeenCalled()
    })

    it('valida ANTES de pedir confirmación: ajena o sin configuración guardada', async () => {
      const ctx = pricingCtx()
      for (const args of [{ variante_id: 999 }, { variante_id: 12 /* sin config */ }, { variante_id: 'x' }, {}]) {
        const result = await ejecutar(def(ctx), args)
        expect(result.ok, JSON.stringify(args)).toBe(false)
        expect(result.confirmo, JSON.stringify(args)).toBe(false)
      }
      expect(ctx.resetVariant).not.toHaveBeenCalled()
    })

    it('si el servidor falla lo dice', async () => {
      const ctx = pricingCtx({ resetVariant: vi.fn(async () => false) })
      expect(await ejecutar(def(ctx), { variante_id: 11 })).toMatchObject({ ok: false, error: 'No se pudo restablecer la variante.' })
    })
  })
})

describe('cambiar_pestana_precios', () => {
  it('cambia entre precios y mayoreo y rechaza otras', async () => {
    const setTab = vi.fn()
    const def = tool(buildPreciosPageTools({ getTab: () => 'precios', setTab }), 'cambiar_pestana_precios')
    expect((await ejecutar(def, { pestana: 'mayoreo' })).ok).toBe(true)
    expect(setTab).toHaveBeenCalledWith('mayoreo')
    expect((await ejecutar(def, { pestana: 'otra' })).ok).toBe(false)
    expect(setTab).toHaveBeenCalledTimes(1)
    expect(def.abreUi).toBe(true)
  })
})

describe('tools de mayoreo', () => {
  const rows: TierRow[] = [
    { min: '2', max: '2', sinLimite: false, modo: 'DERIVADO', factor: '50' },
    { min: '3', max: '', sinLimite: true, modo: 'DERIVADO', factor: '100' },
  ]
  const ctx = (overrides: Partial<MayoreoEditorAgentContext> = {}) =>
    ({
      getSucursalName: () => 'Centro',
      isLoading: () => false,
      getRows: () => rows,
      isDirty: () => false,
      isDefault: () => true,
      setRows: vi.fn(),
      ...overrides,
    }) satisfies MayoreoEditorAgentContext

  it('leer_mayoreo devuelve los rangos con el factor en porcentaje', async () => {
    const result = await tool(buildMayoreoEditorTools(ctx()), 'leer_mayoreo').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        es_default: true,
        cambios_sin_guardar: false,
        rangos: [{ min: 2, max: 2, modo: 'DERIVADO', factor_porcentaje: 50 }, { min: 3, max: null, modo: 'DERIVADO', factor_porcentaje: 100 }],
      },
    })
  })

  it('editar_rangos_mayoreo cambia SOLO el borrador y dice que hay que guardar', async () => {
    const c = ctx()
    const result = await ejecutar(tool(buildMayoreoEditorTools(c), 'editar_rangos_mayoreo'), {
      rangos: [{ min: 2, max: 4, modo: 'DERIVADO', factor: 40 }, { min: 5, modo: 'MONTO_ARTICULO' }],
    })
    expect(c.setRows).toHaveBeenCalledWith([
      { min: '2', max: '4', sinLimite: false, modo: 'DERIVADO', factor: '40' },
      { min: '5', max: '', sinLimite: true, modo: 'MONTO_ARTICULO', factor: '100' },
    ])
    expect(result).toMatchObject({ ok: true, data: { mensaje: 'Solo se modifico el borrador. Presiona Guardar cambios para aplicar.' } })
  })

  it('devuelve los errores de mayoreoTiersSchema y no cambia nada', async () => {
    const c = ctx()
    const def = tool(buildMayoreoEditorTools(c), 'editar_rangos_mayoreo')
    expect(await ejecutar(def, { rangos: [{ min: 2, max: 5, modo: 'DERIVADO' }, { min: 4, modo: 'DERIVADO' }] })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/se solapan/),
    })
    expect((await ejecutar(def, { rangos: [{ min: 2, modo: 'DERIVADO', factor: 300 }] })).ok).toBe(false)
    expect((await ejecutar(def, { rangos: [] })).ok).toBe(false)
    expect(c.setRows).not.toHaveBeenCalled()
  })
})
