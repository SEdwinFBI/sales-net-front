import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, cleanText, fail, limitRows, ok, positiveNumber } from '@/features/agent/tool-helpers'
import type { ToolResult } from '@/features/agent/types'
import type { Caja, TipoMovimientoCaja } from '../types/cash'

export type MovimientoFormValues = { tipo: TipoMovimientoCaja; monto: number; observacion: string }

export type SanitizedMovimiento = {
  values: Partial<MovimientoFormValues>
  ignorados: string[]
  errores: string[]
}

const TIPOS: ReadonlyArray<TipoMovimientoCaja> = ['ENTRADA', 'SALIDA']
/** Tope de un movimiento: evita errores de dictado ("veinticinco mil" en vez de "veinticinco"). */
const MAX_MONTO = 1_000_000

/** Valida los valores que propone el modelo para el formulario de movimiento de caja. */
export function sanitizeMovimientoValues(raw: unknown): SanitizedMovimiento {
  const result: SanitizedMovimiento = { values: {}, ignorados: [], errores: [] }
  if (raw === undefined || raw === null) return result
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del movimiento.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'tipo': {
        const tipo = typeof value === 'string' ? value.trim().toUpperCase() : ''
        if (!TIPOS.includes(tipo as TipoMovimientoCaja)) result.errores.push("tipo debe ser 'ENTRADA' o 'SALIDA'.")
        else values.tipo = tipo as TipoMovimientoCaja
        break
      }
      case 'monto': {
        const monto = positiveNumber(value)
        if (monto === null || monto > MAX_MONTO) result.errores.push(`monto debe ser un numero mayor a 0 y menor o igual a ${MAX_MONTO}.`)
        else values.monto = monto
        break
      }
      case 'observacion': {
        const text = cleanText(value, 200)
        if (text === null) result.errores.push('observacion debe ser un texto no vacio (el formulario la exige).')
        else values.observacion = text
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

const MOVIMIENTO_PARAMETERS = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: [...TIPOS], description: 'ENTRADA de efectivo o SALIDA (gasto).' },
    monto: { type: 'number', exclusiveMinimum: 0, description: 'En quetzales.' },
    observacion: { type: 'string', description: 'Motivo (ej. almuerzo, pasaje, efectivo inicial).' },
  },
  additionalProperties: false,
} as const

/** Lo que MyCashPage le presta al agente. */
export type MiCajaAgentContext = {
  getCaja: () => Caja | undefined
  isLoading: () => boolean
  /** El diálogo de nuevo movimiento está abierto. */
  isDialogOpen: () => boolean
  openMovimiento: (valores?: Partial<MovimientoFormValues>) => void
}

/** Lo que el diálogo de movimiento le presta al agente mientras está abierto. */
export type MovimientoDialogAgentContext = {
  getValues: () => MovimientoFormValues
  setValues: (values: Partial<MovimientoFormValues>) => void
}

/** Tools de /caja/mi-caja. Ninguna guarda: abren el formulario y el usuario presiona Guardar. */
export function buildMiCajaTools(ctx: MiCajaAgentContext): AgentToolDef[] {
  return [
    {
      name: 'leer_mi_caja',
      description: `Devuelve la caja de hoy: sucursal, entradas, gastos, ventas en efectivo, saldo esperado y los movimientos (maximo ${MAX_READ_ROWS}).`,
      parameters: NO_PARAMS,
      run: async () => {
        const caja = ctx.getCaja()
        if (!caja) return fail(ctx.isLoading() ? 'La caja aun esta cargando; intenta de nuevo.' : 'No hay caja disponible.')
        const movimientos = caja.movimientos ?? []
        return ok({
          fecha: caja.fecha,
          sucursal: caja.sucursal.nombre,
          entradas: Number(caja.entradas),
          gastos: Number(caja.salidas),
          ventas_efectivo: Number(caja.ventas_efectivo),
          saldo_esperado: Number(caja.efectivo_esperado),
          total_movimientos: movimientos.length,
          mostrando: Math.min(movimientos.length, MAX_READ_ROWS),
          movimientos: limitRows(movimientos).map((m) => ({
            id: m.id,
            fecha: m.fecha,
            tipo: m.tipo,
            monto: Number(m.monto),
            observacion: m.observacion,
            usuario: m.usuario.nombre,
          })),
        })
      },
    },
    {
      name: 'abrir_movimiento_caja',
      description:
        'Abre el formulario de nuevo movimiento de caja (entrada o gasto), opcionalmente precargado con tipo, monto y observacion. No guarda: el usuario presiona Guardar.',
      parameters: { type: 'object', properties: { valores: MOVIMIENTO_PARAMETERS }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError('llenar_formulario_movimiento_caja')
        if (ctx.isLoading()) return 'La caja aun esta cargando; intenta de nuevo.'
        const { errores } = sanitizeMovimientoValues(args.valores)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const { values, ignorados } = sanitizeMovimientoValues(args.valores)
        ctx.openMovimiento(Object.keys(values).length ? values : undefined)
        return ok({
          mensaje: 'Formulario de movimiento abierto. El usuario debe revisarlo y presionar Guardar.',
          precargado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
        })
      },
    },
  ]
}

/** Tool que existe mientras el diálogo de movimiento está abierto. */
export function buildMovimientoDialogTools(ctx: MovimientoDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_formulario_movimiento_caja',
      description: 'Llena campos del formulario de movimiento de caja abierto (tipo, monto, observacion). No guarda: el usuario presiona Guardar.',
      parameters: MOVIMIENTO_PARAMETERS,
      run: async (args): Promise<ToolResult> => {
        const { values, ignorados, errores } = sanitizeMovimientoValues(args)
        if (Object.keys(values).length === 0) {
          return fail(errores.length ? errores.join(' ') : 'No hay ningun campo valido para llenar.')
        }
        ctx.setValues(values)
        return ok({
          aplicado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
          ...(errores.length ? { errores } : {}),
          valores_actuales: ctx.getValues(),
          mensaje: 'Campos llenados. El usuario debe revisar y presionar Guardar.',
        })
      },
    },
  ]
}
