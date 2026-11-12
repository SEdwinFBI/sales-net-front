import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { CREDENTIAL_NOTICE, NO_PARAMS, cleanText, fail, isCredentialKey, ok, positiveInt } from '@/features/agent/tool-helpers'
import type { BranchAvailability, CartItem } from '../types/sales'

// -- Existencias en otras tiendas ---------------------------------------------------------------

export type DisponibilidadAgentContext = {
  isOpen: () => boolean
  /** Otro diálogo del punto de venta (cobro, resumen...) está abierto. */
  isBusy: () => boolean
  open: (articuloId: number) => void
}

/** Abre el diálogo «Existencias en tiendas» de un artículo. */
export function buildDisponibilidadOpenTools(ctx: DisponibilidadAgentContext): AgentToolDef[] {
  return [
    {
      name: 'ver_disponibilidad_sucursales',
      description:
        'Abre las existencias por talla de un articulo en cada sucursal (id de buscar_articulos). Despues usa leer_disponibilidad_sucursales.',
      parameters: {
        type: 'object',
        properties: { articulo_id: { type: 'integer' } },
        required: ['articulo_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isOpen() || ctx.isBusy()) return dialogAlreadyOpenError()
        return positiveInt(args.articulo_id) === null ? 'articulo_id debe ser un entero positivo (ver buscar_articulos).' : null
      },
      run: async (args) => {
        ctx.open(args.articulo_id as number)
        return ok({ mensaje: 'Existencias abiertas. Usa leer_disponibilidad_sucursales para leerlas.' })
      },
    },
  ]
}

export type DisponibilidadReadContext = {
  getAvailability: () => BranchAvailability | undefined
  isLoading: () => boolean
  isError: () => boolean
}

/** Lee la matriz tallas × sucursales del diálogo abierto. */
export function buildDisponibilidadReadTools(ctx: DisponibilidadReadContext): AgentToolDef[] {
  return [
    {
      name: 'leer_disponibilidad_sucursales',
      description: 'Lee las existencias del articulo abierto: por cada sucursal, las unidades de cada talla y el total.',
      parameters: NO_PARAMS,
      run: async () => {
        const data = ctx.getAvailability()
        if (!data) {
          return fail(ctx.isLoading() ? 'Las existencias aun estan cargando; intenta de nuevo.' : 'No se pudieron cargar las existencias de ese articulo.')
        }
        return ok({
          articulo: data.articulo.nombre,
          tallas: data.tallas.map((t) => ({ variante_id: t.id_variante, talla: t.talla, precio: t.precio })),
          sucursales: data.sucursales.slice(0, 30).map((s) => ({
            sucursal: s.nombre,
            es_la_mia: s.es_propia,
            total: s.total,
            // Solo tallas con existencia, igual que el dato del servidor.
            por_talla: Object.fromEntries(
              data.tallas.filter((t) => (s.existencias[String(t.id_variante)] ?? 0) > 0).map((t) => [t.talla, s.existencias[String(t.id_variante)]]),
            ),
          })),
        })
      },
    },
  ]
}

// -- Cliente rápido -------------------------------------------------------------------------------

export type ClienteRapidoValues = { nombre_completo: string; telefono: string; direccion: string; permitir_credito: boolean }

export type SanitizedClienteRapido = {
  values: Partial<ClienteRapidoValues>
  ignorados: string[]
  credenciales: string[]
  errores: string[]
}

/** Mismos límites que el formulario: nombre de 3+ caracteres y teléfono de 8+ dígitos. */
export function sanitizeClienteRapido(raw: unknown): SanitizedClienteRapido {
  const result: SanitizedClienteRapido = { values: {}, ignorados: [], credenciales: [], errores: [] }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result
  for (const [key, value] of Object.entries(raw)) {
    if (isCredentialKey(key)) {
      result.credenciales.push(key)
      continue
    }
    switch (key) {
      case 'nombre_completo': {
        const nombre = cleanText(value, 150)
        if (nombre === null || nombre.length < 3) result.errores.push('nombre_completo debe tener al menos 3 caracteres.')
        else result.values.nombre_completo = nombre
        break
      }
      case 'telefono': {
        const telefono = typeof value === 'number' && Number.isInteger(value) ? String(value) : cleanText(value, 20)
        if (telefono === null || telefono.replace(/\D/g, '').length < 8) result.errores.push('telefono debe tener al menos 8 digitos.')
        else result.values.telefono = telefono
        break
      }
      case 'direccion': {
        const direccion = cleanText(value, 200)
        if (direccion === null) result.errores.push('direccion debe ser un texto no vacio.')
        else result.values.direccion = direccion
        break
      }
      case 'permitir_credito':
        if (typeof value !== 'boolean') result.errores.push('permitir_credito debe ser true o false.')
        else result.values.permitir_credito = value
        break
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

const CLIENTE_RAPIDO_PROPS = {
  nombre_completo: { type: 'string' },
  telefono: { type: 'string', description: 'Al menos 8 digitos.' },
  direccion: { type: 'string' },
  permitir_credito: { type: 'boolean' },
} as const

/** Abre el formulario «Nuevo cliente» del carrito o del cobro. */
export function buildClienteRapidoOpenTools(ctx: { bloqueo: () => string | null; open: () => void }): AgentToolDef[] {
  return [
    {
      name: 'abrir_cliente_rapido',
      description:
        'Abre el formulario de nuevo cliente del punto de venta (nombre, telefono, direccion, credito). No guarda: despues usa llenar_cliente_rapido.',
      parameters: NO_PARAMS,
      abreUi: true,
      validar: () => ctx.bloqueo(),
      run: async () => {
        ctx.open()
        return ok({ mensaje: 'Formulario de nuevo cliente abierto. Usa llenar_cliente_rapido; el usuario presiona Crear cliente.' })
      },
    },
  ]
}

export type ClienteRapidoDialogContext = {
  getValues: () => ClienteRapidoValues
  setValues: (values: Partial<ClienteRapidoValues>) => void
}

/** Tool que existe mientras el formulario de cliente rápido está abierto. */
export function buildClienteRapidoDialogTools(ctx: ClienteRapidoDialogContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_cliente_rapido',
      description: 'Llena el formulario de nuevo cliente abierto en el punto de venta. No guarda: el usuario presiona Crear cliente.',
      parameters: { type: 'object', properties: { ...CLIENTE_RAPIDO_PROPS }, additionalProperties: false },
      run: async (args) => {
        const sanitized = sanitizeClienteRapido(args)
        if (Object.keys(sanitized.values).length === 0) {
          return fail(sanitized.errores.length ? sanitized.errores.join(' ') : 'No hay ningun campo valido para llenar.')
        }
        ctx.setValues(sanitized.values)
        return ok({
          aplicado: sanitized.values,
          ...(sanitized.errores.length ? { errores: sanitized.errores } : {}),
          ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
          ...(sanitized.credenciales.length ? { credenciales_descartadas: sanitized.credenciales, aviso: CREDENTIAL_NOTICE } : {}),
          valores_actuales: ctx.getValues(),
          mensaje: 'Campos llenados. El usuario debe revisar y presionar Crear cliente.',
        })
      },
    },
  ]
}

// -- Precios del cliente desde el punto de venta --------------------------------------------------

/** Abre el diálogo «Precios del cliente» del cliente seleccionado en la venta. */
export function buildPreciosClientePosTools(ctx: { getCustomerId: () => number; isBusy: () => boolean; open: () => void }): AgentToolDef[] {
  return [
    {
      name: 'abrir_precios_cliente_pos',
      description:
        'Abre los precios especiales del cliente seleccionado en la venta. Dentro se usan leer_precios_cliente y abrir_editar_precio_cliente (tambien para asignar un precio nuevo).',
      parameters: NO_PARAMS,
      abreUi: true,
      validar: () => {
        if (ctx.isBusy()) return dialogAlreadyOpenError()
        return ctx.getCustomerId() > 0 ? null : 'Primero hay que seleccionar un cliente (buscar_cliente y seleccionar_cliente).'
      },
      run: async () => {
        ctx.open()
        return ok({ mensaje: 'Precios del cliente abiertos.' })
      },
    },
  ]
}

// -- Guardar los precios de la venta para el cliente ----------------------------------------------

export type PreciosVentaContext = {
  getItems: () => CartItem[]
  getSelectedIds: () => ReadonlySet<string>
  setSelectedIds: (ids: Set<string>) => void
  getCustomerId: () => string
  /** Clientes cargados en el selector del diálogo. */
  getCustomers: () => { id: number | string; name: string }[]
  setCustomerId: (id: string) => void
  hasSaved: () => boolean
}

/** Tools del diálogo «Guardar precios» que aparece tras una venta. Solo eligen; guardar lo hace el usuario. */
export function buildPreciosVentaTools(ctx: PreciosVentaContext): AgentToolDef[] {
  const describe = () => {
    const selected = ctx.getSelectedIds()
    const customerId = ctx.getCustomerId()
    return {
      cliente: ctx.getCustomers().find((c) => String(c.id) === customerId)?.name ?? null,
      cliente_id: customerId ? Number(customerId) : null,
      ya_guardado: ctx.hasSaved(),
      articulos: ctx.getItems().map((item) => ({
        variante_id: item.variantId,
        articulo: item.name,
        talla: item.size,
        precio_catalogo: item.basePrice ?? item.price,
        precio_a_guardar: item.price - item.discount,
        marcado: selected.has(item.id),
      })),
    }
  }

  const parse = (args: Record<string, unknown>): { ids?: Set<string>; customerId?: string } | { error: string } => {
    if (!('variante_ids' in args) && !('cliente_id' in args)) return { error: 'Indica variante_ids y/o cliente_id.' }
    if (ctx.hasSaved()) return { error: 'Los precios de esta venta ya se guardaron.' }
    const plan: { ids?: Set<string>; customerId?: string } = {}
    if ('variante_ids' in args) {
      const raw = args.variante_ids
      if (!Array.isArray(raw) || !raw.every((id) => positiveInt(id) !== null)) return { error: 'variante_ids debe ser una lista de ids de variante (ver leer_precios_venta).' }
      const items = ctx.getItems()
      const desconocidas = (raw as number[]).filter((id) => !items.some((item) => item.variantId === id))
      if (desconocidas.length) return { error: `Estas variantes no son de la venta: ${desconocidas.join(', ')}.` }
      plan.ids = new Set(items.filter((item) => (raw as number[]).includes(item.variantId)).map((item) => item.id))
    }
    if ('cliente_id' in args) {
      const id = positiveInt(args.cliente_id)
      if (id === null || !ctx.getCustomers().some((c) => Number(c.id) === id)) {
        return { error: 'cliente_id no esta entre los clientes cargados en el dialogo (ver buscar_cliente).' }
      }
      plan.customerId = String(id)
    }
    return plan
  }

  return [
    {
      name: 'leer_precios_venta',
      description: 'Lee el dialogo Guardar precios de la venta: cliente elegido y, por articulo, el precio que se guardaria y si esta marcado.',
      parameters: NO_PARAMS,
      run: async () => ok(describe()),
    },
    {
      name: 'elegir_precios_venta',
      description:
        'En el dialogo Guardar precios elige que articulos se guardan (variante_ids reemplaza la seleccion) y/o para que cliente. No guarda: el usuario presiona Guardar.',
      parameters: {
        type: 'object',
        properties: {
          variante_ids: { type: 'array', items: { type: 'integer' } },
          cliente_id: { type: 'integer' },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parse(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return fail(parsed.error)
        if (parsed.ids) ctx.setSelectedIds(parsed.ids)
        if (parsed.customerId) ctx.setCustomerId(parsed.customerId)
        return ok({ mensaje: 'Seleccion actualizada. El usuario debe presionar Guardar.', articulos_marcados: parsed.ids?.size })
      },
    },
  ]
}
