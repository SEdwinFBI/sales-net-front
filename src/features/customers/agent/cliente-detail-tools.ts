import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { NO_PARAMS, fail, ok } from '@/features/agent/tool-helpers'
import type { ToolResult } from '@/features/agent/types'
import type { Venta } from '@/features/sales/types/sales'
import type { Cliente, ComprasData } from '../types/clientes'
import {
  FORMAS_PAGO_VENTA,
  sanitizeAbonoValues,
  sanitizeAjusteValues,
  sanitizeVentaClienteValues,
  type AbonoFormValues,
  type AjusteFormValues,
  type Sanitized,
  type VentaClienteFormValues,
} from './cliente-detail-forms'

export type ClienteTab = 'movimientos' | 'abonos' | 'compras' | 'precios'

const ALL_TABS: ReadonlyArray<ClienteTab> = ['movimientos', 'abonos', 'compras', 'precios']
/** Un cliente sin crédito solo tiene estas pestañas (igual que la UI). */
const CASH_ONLY_TABS: ReadonlyArray<ClienteTab> = ['compras', 'precios']

export const availableTabs = (cliente: Pick<Cliente, 'permitir_credito'>): ReadonlyArray<ClienteTab> =>
  cliente.permitir_credito === false ? CASH_ONLY_TABS : ALL_TABS

/** Lo que ClienteDetailPage le presta al agente. */
export type ClienteDetailAgentContext = {
  getCliente: () => Cliente
  getTab: () => ClienteTab
  setTab: (tab: ClienteTab) => void
  getResumen: () => ComprasData['resumen'] | undefined
  getVentas: () => Venta[]
  /** Alguno de los diálogos de la página (abono, ajuste, venta) está abierto. */
  isDialogOpen: () => boolean
  openAbono: (valores?: Partial<AbonoFormValues>) => void
  openAjuste: (valores?: Partial<AjusteFormValues>) => void
  openVenta: (valores?: Partial<VentaClienteFormValues>) => void
}

const ABONO_PARAMETERS = {
  type: 'object',
  properties: {
    id_venta: { type: 'integer', description: 'Venta del cliente con saldo pendiente.' },
    monto: { type: 'number', exclusiveMinimum: 0 },
    observacion: { type: 'string' },
  },
  additionalProperties: false,
} as const

const AJUSTE_PARAMETERS = {
  type: 'object',
  properties: {
    monto: { type: 'number', exclusiveMinimum: 0, description: 'Magnitud del ajuste; el signo lo da negativo.' },
    negativo: { type: 'boolean', description: 'true disminuye el balance; false (por defecto) lo aumenta.' },
    descripcion: { type: 'string' },
  },
  additionalProperties: false,
} as const

const VENTA_PARAMETERS = {
  type: 'object',
  properties: {
    forma_pago: { type: 'string', enum: [...FORMAS_PAGO_VENTA] },
    monto: { type: 'number', minimum: 0 },
    observacion: { type: 'string' },
    sucursal_id: { type: 'integer', description: 'Solo si el diálogo pide sucursal (administrador).' },
  },
  additionalProperties: false,
} as const

function describe<T>(sanitized: Sanitized<T>, mensaje: string) {
  const { values, ignorados, notas } = sanitized
  return {
    mensaje,
    precargado: values,
    ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
    ...(notas.length ? { notas } : {}),
  }
}

/** Tools de /clientes/listado/:id. Las que abren formularios solo existen si el cliente tiene crédito. */
export function buildClienteDetailTools(ctx: ClienteDetailAgentContext): AgentToolDef[] {
  const cliente = ctx.getCliente()
  const tabs = availableTabs(cliente)

  const tools: AgentToolDef[] = [
    {
      name: 'cambiar_pestana_cliente',
      description: `Cambia la pestana de la ficha del cliente. Disponibles: ${tabs.join(', ')}.`,
      parameters: {
        type: 'object',
        properties: { pestana: { type: 'string', enum: [...tabs] } },
        required: ['pestana'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) =>
        tabs.includes(args.pestana as ClienteTab) ? null : `pestana debe ser una de: ${tabs.join(', ')}.`,
      run: async (args) => {
        ctx.setTab(args.pestana as ClienteTab)
        return ok({ pestana: args.pestana })
      },
    },
    {
      name: 'leer_cliente',
      description: 'Devuelve los datos del cliente (nombre, telefono, direccion, credito, balance, estado), su resumen de compras y la pestana activa.',
      parameters: NO_PARAMS,
      run: async () => {
        const c = ctx.getCliente()
        const resumen = ctx.getResumen()
        return ok({
          id: c.id,
          nombre: c.nombre_completo,
          telefono: c.telefono,
          direccion: c.direccion,
          credito: c.permitir_credito,
          balance: Number(c.balance),
          activo: c.activo,
          pestana_activa: ctx.getTab(),
          pestanas: availableTabs(c),
          ...(resumen
            ? {
                resumen: {
                  total_ventas: resumen.total_ventas,
                  total_general: resumen.total_general,
                  total_pagado: resumen.total_pagado,
                  total_abonado: resumen.total_abonado,
                  balance: resumen.balance,
                },
              }
            : {}),
        })
      },
    },
  ]

  if (cliente.permitir_credito === false) return tools

  tools.push(
    {
      name: 'abrir_registrar_abono',
      description:
        'Abre el formulario de abono del cliente, opcionalmente precargado (id_venta con saldo, monto, observacion). No registra: el usuario presiona Registrar abono.',
      parameters: { type: 'object', properties: { valores: ABONO_PARAMETERS }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const { errores } = sanitizeAbonoValues(args.valores, ctx.getVentas())
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeAbonoValues(args.valores, ctx.getVentas())
        ctx.openAbono(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return ok(describe(sanitized, 'Formulario de abono abierto. El usuario debe revisarlo y presionar Registrar abono.'))
      },
    },
    {
      name: 'abrir_registrar_ajuste',
      description:
        'Abre el formulario de ajuste de balance del cliente, opcionalmente precargado (monto, negativo, descripcion). No registra: el usuario presiona Registrar ajuste.',
      parameters: { type: 'object', properties: { valores: AJUSTE_PARAMETERS }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const { errores } = sanitizeAjusteValues(args.valores)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeAjusteValues(args.valores)
        ctx.openAjuste(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return ok(describe(sanitized, 'Formulario de ajuste abierto. El usuario debe revisarlo y presionar Registrar ajuste.'))
      },
    },
    {
      name: 'abrir_registrar_venta_cliente',
      description:
        'Abre el formulario para registrar una venta al cliente, opcionalmente precargado (forma_pago, monto, observacion, sucursal_id). No registra: el usuario presiona Registrar venta.',
      parameters: { type: 'object', properties: { valores: VENTA_PARAMETERS }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const { errores } = sanitizeVentaClienteValues(args.valores)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeVentaClienteValues(args.valores)
        ctx.openVenta(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return ok(describe(sanitized, 'Formulario de venta abierto. El usuario debe revisarlo y presionar Registrar venta.'))
      },
    },
  )

  return tools
}

// -- Tools de los diálogos abiertos -----------------------------------------------------------

function fillResult<T>(
  sanitized: Sanitized<T>,
  apply: (values: Partial<T>) => void,
  current: () => unknown,
  mensaje: string,
): ToolResult {
  const { values, ignorados, errores, notas } = sanitized
  if (Object.keys(values).length === 0) {
    return fail(errores.length ? errores.join(' ') : 'No hay ningun campo valido para llenar.')
  }
  apply(values)
  return ok({
    aplicado: values,
    ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
    ...(errores.length ? { errores } : {}),
    ...(notas.length ? { notas } : {}),
    valores_actuales: current(),
    mensaje,
  })
}

export type AbonoDialogAgentContext = {
  getVentas: () => Venta[]
  getValues: () => AbonoFormValues
  setValues: (values: Partial<AbonoFormValues>) => void
}

export function buildAbonoDialogTools(ctx: AbonoDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_formulario_abono',
      description: 'Llena campos del formulario de abono abierto (id_venta con saldo, monto, observacion). No registra: el usuario presiona Registrar abono.',
      parameters: ABONO_PARAMETERS,
      run: async (args) =>
        fillResult(
          sanitizeAbonoValues(args, ctx.getVentas()),
          ctx.setValues,
          ctx.getValues,
          'Campos llenados. El usuario debe revisar y presionar Registrar abono.',
        ),
    },
  ]
}

export type AjusteDialogAgentContext = {
  getValues: () => AjusteFormValues
  setValues: (values: Partial<AjusteFormValues>) => void
}

export function buildAjusteDialogTools(ctx: AjusteDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_formulario_ajuste',
      description: 'Llena campos del formulario de ajuste abierto (monto, negativo, descripcion). No registra: el usuario presiona Registrar ajuste.',
      parameters: AJUSTE_PARAMETERS,
      run: async (args) =>
        fillResult(
          sanitizeAjusteValues(args),
          ctx.setValues,
          ctx.getValues,
          'Campos llenados. El usuario debe revisar y presionar Registrar ajuste.',
        ),
    },
  ]
}

export type VentaClienteDialogAgentContext = {
  /** Sucursales activas ya cargadas (undefined mientras cargan o si el diálogo no pide sucursal). */
  getSucursalIds: () => readonly number[] | undefined
  getValues: () => Partial<VentaClienteFormValues>
  setValues: (values: Partial<VentaClienteFormValues>) => void
}

export function buildVentaClienteDialogTools(ctx: VentaClienteDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_formulario_venta_cliente',
      description:
        'Llena campos del formulario de venta al cliente abierto (forma_pago, monto, observacion, sucursal_id). No registra: el usuario presiona Registrar venta.',
      parameters: VENTA_PARAMETERS,
      run: async (args) =>
        fillResult(
          sanitizeVentaClienteValues(args, { sucursalIds: ctx.getSucursalIds() }),
          ctx.setValues,
          ctx.getValues,
          'Campos llenados. El usuario debe revisar y presionar Registrar venta.',
        ),
    },
  ]
}
