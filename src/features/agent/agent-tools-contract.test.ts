import { describe, expect, it } from 'vitest'
import { isCredentialKey } from './tool-helpers'
import {
  buildArticuloDialogTools,
  buildArticulosTools,
  type ArticuloDialogAgentContext,
  type ArticulosAgentContext,
} from '@/features/catalog/agent/articulos-tools'
import {
  buildMayoreoEditorTools,
  buildPreciosPageTools,
  buildPricingEditorTools,
  type MayoreoEditorAgentContext,
  type PreciosPageAgentContext,
  type PricingEditorAgentContext,
} from '@/features/catalog/agent/precios-tools'
import {
  buildStockEditorTools,
  buildSucursalPickerTools,
  type StockEditorAgentContext,
  type SucursalPickerAgentContext,
} from '@/features/catalog/agent/stock-tools'
import { buildMovimientosTools, type MovimientosAgentContext } from '@/features/inventario/agent/movimientos-tools'
import { buildResumenTools, type ResumenAgentContext } from '@/features/inventario/agent/resumen-tools'
import { buildArqueosTools, type ArqueosAgentContext } from '@/features/cash/agent/arqueos-tools'
import {
  buildMiCajaTools,
  buildMovimientoDialogTools,
  type MiCajaAgentContext,
  type MovimientoDialogAgentContext,
} from '@/features/cash/agent/mi-caja-tools'
import { buildClienteDialogTools, type ClienteDialogAgentContext } from '@/features/customers/agent/cliente-dialog-tools'
import {
  buildAbonoDialogTools,
  buildAjusteDialogTools,
  buildClienteDetailTools,
  buildVentaClienteDialogTools,
  type AbonoDialogAgentContext,
  type AjusteDialogAgentContext,
  type ClienteDetailAgentContext,
  type VentaClienteDialogAgentContext,
} from '@/features/customers/agent/cliente-detail-tools'
import {
  buildAbonosTools,
  buildComprasTools,
  type AbonosAgentContext,
  type ComprasAgentContext,
} from '@/features/customers/agent/compras-abonos-tools'
import { buildClientesPageTools, type ClientesPageAgentContext } from '@/features/customers/agent/clientes-page-tools'
import {
  buildPrecioDialogTools,
  buildPreciosClienteTools,
  type PrecioDialogAgentContext,
  type PreciosClienteAgentContext,
} from '@/features/customers/agent/precios-cliente-tools'
import {
  buildHistorialPageTools,
  buildHistorialTableTools,
  type HistorialPageAgentContext,
  type HistorialTableAgentContext,
} from '@/features/sales/agent/historial-tools'
import {
  buildCobrosTools,
  buildDashboardTools,
  buildDeudoresTools,
  buildReporteVentasTools,
  type CobrosAgentContext,
  type DashboardAgentContext,
  type DeudoresAgentContext,
  type ReporteVentasAgentContext,
} from '@/features/reporting/agent/reportes-tools'
import {
  buildUsuarioDialogTools,
  buildUsuariosTools,
  type UsuarioDialogAgentContext,
  type UsuariosAgentContext,
} from '@/features/admin/agent/usuarios-tools'
import {
  buildEquipoTools,
  buildSucursalDialogTools,
  buildSucursalesTools,
  type EquipoAgentContext,
  type SucursalDialogAgentContext,
  type SucursalesAgentContext,
} from '@/features/admin/agent/sucursales-tools'
import {
  buildCobrosScheduleTools,
  buildDestinatarioDialogTools,
  buildDestinatariosTools,
  type DestinatarioDialogAgentContext,
  type DestinatariosAgentContext,
  type ScheduleAgentContext,
} from '@/features/admin/agent/notificaciones-tools'
import {
  buildClienteRapidoDialogTools,
  buildClienteRapidoOpenTools,
  buildDisponibilidadOpenTools,
  buildDisponibilidadReadTools,
  buildPreciosClientePosTools,
  buildPreciosVentaTools,
  type ClienteRapidoDialogContext,
  type DisponibilidadAgentContext,
  type DisponibilidadReadContext,
  type PreciosVentaContext,
} from '@/features/sales/agent/pos-dialog-tools'
import { paginationTool, type PaginationCtx } from './pagination-tools'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { getCatalogRoutes } from './route-catalog'
import { validateToolDef, type AgentToolDef } from './registry/agent-tool-registry'

/**
 * Contexto de prueba en el que TODA función responde `true`: sirve para construir las tools y
 * para simular «hay un diálogo abierto» sin armar un contexto a mano por pantalla.
 */
const everythingTrue = <T>() => new Proxy({}, { get: () => () => true }) as unknown as T

/** Tools estáticas del back (`agent/tools.py`): una pantalla no puede usar estos nombres. */
const STATIC_TOOL_NAMES = [
  'navegar', 'leer_estado', 'cambiar_tema', 'cerrar_sesion', 'buscar_articulos', 'agregar_item', 'cambiar_cantidad',
  'quitar_item', 'vaciar_carrito', 'buscar_cliente', 'seleccionar_cliente', 'abrir_carrito', 'cerrar_carrito', 'abrir_checkout',
]

type Screen = { name: string; tools: AgentToolDef[] }

/** Tools que conviven montadas en cada pantalla (página + tabla activa + diálogos abiertos). */
const screens: Screen[] = [
  {
    name: '/clientes/listado (admin)',
    tools: [
      ...buildClientesPageTools(everythingTrue<ClientesPageAgentContext>(), true),
      ...buildClienteDialogTools(everythingTrue<ClienteDialogAgentContext>()),
    ],
  },
  {
    name: '/clientes/listado/:id (todas las pestañas y diálogos)',
    tools: [
      ...buildClienteDetailTools(everythingTrue<ClienteDetailAgentContext>()),
      ...buildComprasTools(everythingTrue<ComprasAgentContext>()),
      ...buildAbonosTools(everythingTrue<AbonosAgentContext>()),
      ...buildPreciosClienteTools(everythingTrue<PreciosClienteAgentContext>(), true),
      ...buildPrecioDialogTools(everythingTrue<PrecioDialogAgentContext>()),
      ...buildAbonoDialogTools(everythingTrue<AbonoDialogAgentContext>()),
      ...buildAjusteDialogTools(everythingTrue<AjusteDialogAgentContext>()),
      ...buildVentaClienteDialogTools(everythingTrue<VentaClienteDialogAgentContext>()),
    ],
  },
  {
    name: '/venta/historial',
    tools: [
      ...buildHistorialPageTools(everythingTrue<HistorialPageAgentContext>()),
      ...buildHistorialTableTools(everythingTrue<HistorialTableAgentContext>()),
    ],
  },
  {
    name: '/caja/mi-caja',
    tools: [
      ...buildMiCajaTools(everythingTrue<MiCajaAgentContext>()),
      ...buildMovimientoDialogTools(everythingTrue<MovimientoDialogAgentContext>()),
    ],
  },
  { name: '/caja/arqueos', tools: buildArqueosTools(everythingTrue<ArqueosAgentContext>()) },
  {
    name: '/catalogo/productos',
    tools: [
      ...buildArticulosTools(everythingTrue<ArticulosAgentContext>()),
      ...buildArticuloDialogTools(everythingTrue<ArticuloDialogAgentContext>()),
    ],
  },
  {
    name: '/catalogo/stock (lista de sucursales)',
    tools: buildSucursalPickerTools(everythingTrue<SucursalPickerAgentContext>(), {
      leer: 'leer_sucursales_stock',
      abrir: 'abrir_stock_sucursal',
      area: 'el stock',
    }),
  },
  { name: '/catalogo/stock (editor)', tools: buildStockEditorTools(everythingTrue<StockEditorAgentContext>()) },
  {
    name: '/catalogo/precios (lista de sucursales)',
    tools: buildSucursalPickerTools(everythingTrue<SucursalPickerAgentContext>(), {
      leer: 'leer_sucursales_precios',
      abrir: 'abrir_precios_sucursal',
      area: 'los precios',
    }),
  },
  {
    name: '/catalogo/precios (sucursal abierta, ambas pestañas)',
    tools: [
      ...buildPreciosPageTools(everythingTrue<PreciosPageAgentContext>()),
      ...buildPricingEditorTools(everythingTrue<PricingEditorAgentContext>()),
      ...buildMayoreoEditorTools(everythingTrue<MayoreoEditorAgentContext>()),
    ],
  },
  { name: '/inventario/movimientos y /por-vendedor', tools: buildMovimientosTools(everythingTrue<MovimientosAgentContext>()) },
  { name: '/inventario/resumen', tools: buildResumenTools(everythingTrue<ResumenAgentContext>()) },
  { name: '/reportes/dashboard', tools: buildDashboardTools(everythingTrue<DashboardAgentContext>()) },
  { name: '/reportes/ventas', tools: buildReporteVentasTools(everythingTrue<ReporteVentasAgentContext>()) },
  { name: '/reportes/deudores', tools: buildDeudoresTools(everythingTrue<DeudoresAgentContext>()) },
  { name: '/reportes/cobros', tools: buildCobrosTools(everythingTrue<CobrosAgentContext>()) },
  {
    name: '/administracion/usuarios',
    tools: [
      ...buildUsuariosTools(everythingTrue<UsuariosAgentContext>()),
      ...buildUsuarioDialogTools(everythingTrue<UsuarioDialogAgentContext>()),
    ],
  },
  {
    name: '/administracion/sucursales',
    tools: [
      ...buildSucursalesTools(everythingTrue<SucursalesAgentContext>()),
      ...buildSucursalDialogTools(everythingTrue<SucursalDialogAgentContext>()),
    ],
  },
  { name: '/administracion/sucursales/:id (equipo)', tools: buildEquipoTools(everythingTrue<EquipoAgentContext>()) },
  {
    name: '/venta/punto-de-venta (diálogos)',
    tools: [
      ...buildDisponibilidadOpenTools(everythingTrue<DisponibilidadAgentContext>()),
      ...buildDisponibilidadReadTools(everythingTrue<DisponibilidadReadContext>()),
      ...buildClienteRapidoOpenTools(everythingTrue<{ bloqueo: () => string | null; open: () => void }>()),
      ...buildClienteRapidoDialogTools(everythingTrue<ClienteRapidoDialogContext>()),
      ...buildPreciosClientePosTools(everythingTrue<{ getCustomerId: () => number; isBusy: () => boolean; open: () => void }>()),
      ...buildPreciosVentaTools(everythingTrue<PreciosVentaContext>()),
      paginationTool('productos', 'los productos del punto de venta', everythingTrue<PaginationCtx>()),
    ],
  },
  {
    name: '/administracion/notificaciones',
    tools: [
      ...buildCobrosScheduleTools(everythingTrue<ScheduleAgentContext>()),
      ...buildDestinatariosTools(everythingTrue<DestinatariosAgentContext>()),
      ...buildDestinatarioDialogTools(everythingTrue<DestinatarioDialogAgentContext>()),
    ],
  },
]

/** Navegación entre listas (no abre diálogos): no tiene sentido pedirles el "diálogo abierto". */
const NAVIGATION_ONLY = ['abrir_stock_sucursal', 'abrir_precios_sucursal', 'abrir_cliente_rapido']

/** Palabras que nunca deben llegar a una tool: el asistente no maneja credenciales. */
const CREDENTIAL_WORDS = /password|contrase|passkey|patron|\bpin\b|clave|secret|token|credencial/i
/** Una mención solo es válida si la frase dice que NO se maneja. */
const NEGATION = /\b(no|nunca|sin|ni)\b/i

/** Claves de propiedades y valores enum de un JSON Schema (recursivo). */
function schemaNames(schema: unknown): { keys: string[]; enums: string[] } {
  const keys: string[] = []
  const enums: string[] = []
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      if (key === 'properties' && value && typeof value === 'object') {
        for (const [name, child] of Object.entries(value)) {
          keys.push(name)
          walk(child)
        }
      } else if (key === 'enum' && Array.isArray(value)) {
        enums.push(...value.filter((v): v is string => typeof v === 'string'))
      } else walk(value)
    }
  }
  walk(schema)
  return { keys, enums }
}

/** Todas las `description` dentro de un JSON Schema. */
function schemaDescriptions(schema: unknown): string[] {
  const found: string[] = []
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      if (key === 'description' && typeof value === 'string') found.push(value)
      else walk(value)
    }
  }
  walk(schema)
  return found
}

/** Código fuente de la app (sin dependencias de node: lo carga Vite como texto). */
const SOURCES = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
/** Módulo de auth completo y las pantallas de passkeys y patrón de acceso. */
const PROTECTED_FILE = /\/features\/auth\/|PatronAccesoPage|PatternSetupForm/

const allTools = screens.flatMap((screen) => screen.tools.map((tool) => ({ screen: screen.name, tool })))

describe('contrato de todas las tools de pantalla', () => {
  it('hay tools en todas las pantallas', () => {
    expect(allTools.length).toBeGreaterThanOrEqual(100)
  })

  it.each(allTools.map(({ screen, tool }) => [`${screen} · ${tool.name}`, tool] as const))(
    '%s cumple las reglas del registro y los límites del back',
    (_label, tool) => {
      expect(validateToolDef(tool)).toBeNull()
      expect(JSON.stringify(tool.parameters).length).toBeLessThanOrEqual(3000)
      expect(tool.description.length).toBeLessThanOrEqual(300)
    },
  )

  it('ninguna pantalla repite un nombre de tool entre las que conviven', () => {
    for (const screen of screens) {
      const names = screen.tools.map((t) => t.name)
      expect(new Set(names).size, `${screen.name}: ${names.join(', ')}`).toBe(names.length)
    }
  })

  it('ninguna tool usa el nombre de una tool estática del back', () => {
    for (const { screen, tool } of allTools) {
      expect(STATIC_TOOL_NAMES, `${screen} · ${tool.name}`).not.toContain(tool.name)
    }
  })

  it('toda tool con confirmación define validar y textoConfirmacion', () => {
    const conConfirmacion = allTools.filter(({ tool }) => tool.requiere_confirmacion)
    expect(conConfirmacion.length).toBeGreaterThan(0)
    for (const { tool } of conConfirmacion) {
      expect(typeof tool.validar, tool.name).toBe('function')
      expect(typeof tool.textoConfirmacion, tool.name).toBe('function')
    }
  })

  it('las tools de abrir diálogos y cambiar de pestaña esperan a la UI nueva (abreUi)', () => {
    const abren = allTools.filter(
      ({ tool }) => tool.name.startsWith('abrir_') && !tool.name.startsWith('abrir_arqueo_'),
    )
    expect(abren.length).toBeGreaterThan(10)
    for (const { tool } of abren) expect(tool.abreUi, tool.name).toBe(true)
    for (const { tool } of allTools.filter(({ tool }) => tool.name.startsWith('cambiar_pestana_'))) {
      expect(tool.abreUi, tool.name).toBe(true)
    }
  })

  it('ninguna tool recibe contraseñas, passkeys, patrones ni PIN: ni en su nombre, ni en sus parámetros', () => {
    for (const { screen, tool } of allTools) {
      const label = `${screen} · ${tool.name}`
      expect(tool.name, label).not.toMatch(CREDENTIAL_WORDS)
      const { keys, enums } = schemaNames(tool.parameters)
      for (const key of keys) expect(isCredentialKey(key), `${label} · parametro ${key}`).toBe(false)
      for (const value of enums) expect(value, `${label} · valor ${value}`).not.toMatch(CREDENTIAL_WORDS)
    }
  })

  it('las descripciones solo mencionan credenciales para decir que NO se manejan', () => {
    let negated = 0
    for (const { screen, tool } of allTools) {
      for (const text of [tool.description, ...schemaDescriptions(tool.parameters)]) {
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          if (!CREDENTIAL_WORDS.test(sentence)) continue
          negated += 1
          expect(sentence, `${screen} · ${tool.name}`).toMatch(NEGATION)
        }
      }
    }
    // Las de usuarios mencionan la contraseña únicamente para negarla (hay al menos una).
    expect(negated).toBeGreaterThan(0)
  })

  it('/administracion/passkeys y /administracion/patron-acceso no registran ninguna tool', () => {
    const sources = Object.entries(SOURCES).filter(([path]) => !/\.test\.tsx?$/.test(path))
    expect(sources.length).toBeGreaterThan(100)

    const protectedFiles = sources.filter(([path]) => PROTECTED_FILE.test(path))
    // La página de passkeys, la del patrón, su formulario y todo el módulo de auth.
    for (const expected of ['PasskeysPage', 'PasskeyManager', 'PatronAccesoPage', 'PatternSetupForm']) {
      expect(protectedFiles.some(([path]) => path.includes(expected)), expected).toBe(true)
    }
    for (const [path, code] of protectedFiles) {
      expect(code, path).not.toMatch(/useAgentTools|features\/agent|\/agent\//)
    }

    // Y el catálogo del agente las lista, así que solo se puede navegar hasta ellas.
    const catalog = getCatalogRoutes(allFeatureRoutes, ['admin']).map((route) => route.path)
    expect(catalog).toContain('/administracion/passkeys')
    expect(catalog).toContain('/administracion/patron-acceso')
  })

  it('ninguna tool se llama como una acción que guarda, envía o borra por su cuenta', () => {
    for (const { screen, tool } of allTools) {
      expect(tool.name, `${screen} · ${tool.name}`).not.toMatch(/^(guardar|enviar|registrar|crear|anular|borrar|confirmar)_/)
    }
    // Las únicas que ejecutan algo irreversible por sí mismas piden confirmación con clic.
    const irreversibles = allTools.filter(({ tool }) => /^(eliminar|restablecer)_/.test(tool.name))
    expect(irreversibles.map(({ tool }) => tool.name).sort()).toEqual(['eliminar_precio_cliente', 'restablecer_precio_variante'])
    expect(irreversibles.every(({ tool }) => tool.requiere_confirmacion === true)).toBe(true)
  })

  it('las tools que cambian datos al instante (equipo y permisos) piden confirmación con clic', () => {
    const porNombre = new Map(allTools.map(({ tool }) => [tool.name, tool]))
    for (const name of ['agregar_vendedor_sucursal', 'quitar_vendedor_sucursal', 'cambiar_permisos_usuario']) {
      expect(porNombre.get(name)?.requiere_confirmacion, name).toBe(true)
    }
    // Las de reportes y administración que solo abren, filtran o editan borradores jamás la piden.
    for (const name of [
      'filtrar_dashboard', 'filtrar_reporte_ventas', 'filtrar_deudores', 'filtrar_cobros', 'descargar_pdf_cobros',
      'abrir_nuevo_usuario', 'abrir_eliminar_usuario', 'abrir_desactivar_sucursal', 'abrir_eliminar_destinatario',
      'editar_programacion_cobros', 'cambiar_preferencias_destinatario',
    ]) {
      expect(porNombre.get(name), name).toBeDefined()
      expect(porNombre.get(name)?.requiere_confirmacion, name).toBeUndefined()
    }
  })

  it('toda tool editar_* solo modifica borradores: lo dice y no pide confirmación (el usuario guarda)', () => {
    const editores = allTools.filter(({ tool }) => tool.name.startsWith('editar_'))
    expect(editores.map(({ tool }) => tool.name).sort()).toEqual([
      'editar_precio_variante',
      'editar_programacion_cobros',
      'editar_rangos_mayoreo',
      'editar_stock',
    ])
    const borradores = [...editores.map(({ tool }) => tool), allTools.find(({ tool }) => tool.name === 'cambiar_preferencias_destinatario')!.tool]
    for (const tool of borradores) {
      expect(tool.description, tool.name).toMatch(/BORRADOR/)
      expect(tool.description, tool.name).toMatch(/Guardar/)
      expect(tool.requiere_confirmacion, tool.name).toBeUndefined()
    }
  })

  it('con un diálogo abierto, toda tool abrir_*, ver_foto_venta y ver_detalle_caja falla en vez de responder "abierto"', async () => {
    const checked = allTools.filter(
      ({ tool }) =>
        (tool.name.startsWith('abrir_') && !NAVIGATION_ONLY.includes(tool.name)) ||
        ['ver_foto_venta', 'ver_detalle_caja', 'ir_a_precios_articulo'].includes(tool.name),
    )
    expect(checked.length).toBeGreaterThan(15)

    for (const { screen, tool } of checked) {
      // Con el contexto "todo responde true": isDialogOpen() es true; los ids que se pasan son válidos.
      const args = { cliente_id: 1, venta_id: 1, abono_id: 1, variante_id: 1, caja_id: 1, sucursal_id: 1, usuario_id: 1, articulo_id: 1, destinatario_id: 1, valores: {} }
      const invalid = tool.validar?.(args)
      const result = invalid ? { ok: false as const, error: invalid } : await tool.run(args)
      expect(result.ok, `${screen} · ${tool.name}`).toBe(false)
      expect('error' in result && result.error, `${screen} · ${tool.name}`).toMatch(/abiert/i)
    }
  })
})
