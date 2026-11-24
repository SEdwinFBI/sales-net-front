import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, fail, inDateRange, limitRows, localIsoDate, ok, optionalDateRange, positiveInt } from '@/features/agent/tool-helpers'
import { describeVentaDetalle } from '@/features/sales/agent/venta-detalle'
import { motivoNoAnulableVenta } from '@/features/sales/utils/anulacion-rules'
import type { Venta } from '@/features/sales/types/sales'
import type { AuthUser } from '@/features/core/store/auth-store'
import type { Abono } from '../types/clientes'
import { motivoNoAnulableAbono } from '../utils/anulacion-rules'
import { getVentaTotal } from '../utils/venta-total'

type UserLike = Pick<AuthUser, 'role' | 'puede_anular'> | null

/** Rango opcional de fechas de los `leer_*` de la ficha: así "cuanto abono ayer" es una sola llamada. */
const RANGO_FECHAS = {
  type: 'object',
  properties: {
    fecha_desde: { type: 'string', description: 'Opcional, AAAA-MM-DD: solo desde ese dia (inclusive).' },
    fecha_hasta: { type: 'string', description: 'Opcional, AAAA-MM-DD: solo hasta ese dia (inclusive).' },
  },
  additionalProperties: false,
} as const

const errorDeRango = (args: Record<string, unknown>) => {
  const parsed = optionalDateRange(args)
  return 'error' in parsed ? parsed.error : null
}

/** Estados de venta que ya no cuentan para los totales de compras. */
const ESTADOS_SIN_VALOR = new Set(['CANCELADA', 'REVERTIDA', 'REVERSION'])

const VENTA_ID = {
  type: 'object',
  properties: { venta_id: { type: 'integer', description: 'ID de una venta de leer_compras_cliente.' } },
  required: ['venta_id'],
  additionalProperties: false,
} as const

/** Lo que ComprasTable le presta al agente. */
export type ComprasAgentContext = {
  getVentas: () => Venta[]
  getUser: () => UserLike
  /** El detalle de compra o la anulación están abiertos. */
  isDialogOpen: () => boolean
  openDetalle: (venta: Venta) => void
  openAnular: (venta: Venta) => void
}

/** Tools de la pestaña Compras (existen mientras la tabla está montada). */
export function buildComprasTools(ctx: ComprasAgentContext): AgentToolDef[] {
  const findVenta = (args: Record<string, unknown>) => {
    const id = positiveInt(args.venta_id)
    return id === null ? undefined : ctx.getVentas().find((venta) => venta.id === id)
  }

  return [
    {
      name: 'leer_compras_cliente',
      description: `Compras del cliente (maximo ${MAX_READ_ROWS}): id, fecha, total, abonado, saldo y estado. Acepta fecha_desde/fecha_hasta y calcula los totales del rango (sin anuladas ni revertidas).`,
      parameters: RANGO_FECHAS,
      validar: errorDeRango,
      run: async (args) => {
        const parsed = optionalDateRange(args)
        if ('error' in parsed) return fail(parsed.error)
        const todas = ctx.getVentas()
        const ventas = todas.filter((venta) => inDateRange(localIsoDate(venta.fecha), parsed.range))
        const vigentes = ventas.filter((venta) => !ESTADOS_SIN_VALOR.has(venta.estado))
        const sum = (get: (venta: Venta) => number) => vigentes.reduce((acc, venta) => acc + get(venta), 0)
        const filtrado = Boolean(parsed.range.fecha_desde || parsed.range.fecha_hasta)
        return ok({
          rango: parsed.range,
          total: ventas.length,
          mostrando: Math.min(ventas.length, MAX_READ_ROWS),
          total_comprado: sum(getVentaTotal),
          total_abonado: sum((venta) => Number(venta.abonado)),
          saldo_pendiente: sum((venta) => Number(venta.saldo)),
          ...(ventas.length === 0
            ? {
                sugerencia: filtrado
                  ? `El cliente no tiene compras en ese rango (tiene ${todas.length} en total). Amplia o quita fecha_desde/fecha_hasta.`
                  : 'El cliente no tiene compras registradas.',
              }
            : {}),
          compras: limitRows(ventas).map((venta) => ({
            id: venta.id,
            fecha: venta.fecha,
            total: getVentaTotal(venta),
            abonado: Number(venta.abonado),
            saldo: Number(venta.saldo),
            estado: venta.estado,
          })),
        })
      },
    },
    {
      name: 'abrir_detalle_compra',
      description: 'Abre el detalle de una compra del cliente y lo devuelve: articulos con talla, cantidad y precio, totales y saldo (la foto de entrega solo se ve en pantalla).',
      parameters: VENTA_ID,
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        return findVenta(args) ? null : 'No encontre esa compra entre las del cliente (ver leer_compras_cliente).'
      },
      run: async (args) => {
        const venta = findVenta(args)
        if (!venta) return fail('No encontre esa compra.')
        ctx.openDetalle(venta)
        return ok({ mensaje: `Detalle de la compra #${venta.id} abierto.`, detalle: describeVentaDetalle(venta) })
      },
    },
    {
      name: 'abrir_anular_venta',
      description:
        'Abre la confirmacion existente para anular una compra del cliente (si el rol y el estado lo permiten). No anula: el usuario presiona Confirmar anulacion.',
      parameters: VENTA_ID,
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const venta = findVenta(args)
        if (!venta) return 'No encontre esa compra entre las del cliente (ver leer_compras_cliente).'
        return motivoNoAnulableVenta(ctx.getUser(), venta)
      },
      run: async (args) => {
        const venta = findVenta(args)
        if (!venta) return fail('No encontre esa compra.')
        ctx.openAnular(venta)
        return ok({ mensaje: `Confirmacion para anular la venta #${venta.id} abierta. El usuario debe presionar Confirmar anulacion.` })
      },
    },
  ]
}

/** Lo que AbonosTable le presta al agente. */
export type AbonosAgentContext = {
  getAbonos: () => Abono[]
  getUser: () => UserLike
  isDialogOpen: () => boolean
  openAnular: (abono: Abono) => void
}

/** Tools de la pestaña Abonos (existen mientras la tabla está montada). */
export function buildAbonosTools(ctx: AbonosAgentContext): AgentToolDef[] {
  const findAbono = (args: Record<string, unknown>) => {
    const id = positiveInt(args.abono_id)
    return id === null ? undefined : ctx.getAbonos().find((abono) => abono.id === id)
  }

  return [
    {
      name: 'leer_abonos_cliente',
      description: `Abonos (pagos) del cliente (maximo ${MAX_READ_ROWS}): id, fecha, monto, venta, quien lo cobro y si fue revertido. Acepta fecha_desde/fecha_hasta y da total_monto del rango sin revertidos: sirve para "cuanto abono ayer".`,
      parameters: RANGO_FECHAS,
      validar: errorDeRango,
      run: async (args) => {
        const parsed = optionalDateRange(args)
        if ('error' in parsed) return fail(parsed.error)
        const todos = ctx.getAbonos()
        const abonos = todos.filter((abono) => inDateRange(localIsoDate(abono.fecha_abono), parsed.range))
        // Cuentan solo los pagos reales y vigentes: ni las reversiones (monto <= 0) ni los ya revertidos.
        const vigentes = abonos.filter((abono) => Number(abono.monto) > 0 && !abono.revertido)
        const filtrado = Boolean(parsed.range.fecha_desde || parsed.range.fecha_hasta)
        return ok({
          rango: parsed.range,
          total: abonos.length,
          mostrando: Math.min(abonos.length, MAX_READ_ROWS),
          total_monto: vigentes.reduce((acc, abono) => acc + Number(abono.monto), 0),
          cantidad_vigentes: vigentes.length,
          excluidos_revertidos_o_reversiones: abonos.length - vigentes.length,
          ...(abonos.length === 0
            ? {
                sugerencia: filtrado
                  ? `El cliente no abono en ese rango (tiene ${todos.length} abonos en total). Amplia o quita fecha_desde/fecha_hasta.`
                  : 'El cliente no tiene abonos registrados.',
              }
            : {}),
          abonos: limitRows(abonos).map((abono) => ({
            id: abono.id,
            fecha: abono.fecha_abono,
            monto: Number(abono.monto),
            id_venta: abono.id_venta,
            cobrado_por: abono.usuario ? abono.usuario.full_name || abono.usuario.username : null,
            observacion: abono.observacion ?? '',
            revertido: Boolean(abono.revertido),
          })),
        })
      },
    },
    {
      name: 'abrir_anular_abono',
      description:
        'Abre la confirmacion existente para anular un abono del cliente (si el rol lo permite y no esta revertido). No anula: el usuario presiona Confirmar anulacion.',
      parameters: {
        type: 'object',
        properties: { abono_id: { type: 'integer', description: 'ID de un abono de leer_abonos_cliente.' } },
        required: ['abono_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const abono = findAbono(args)
        if (!abono) return 'No encontre ese abono entre los del cliente (ver leer_abonos_cliente).'
        return motivoNoAnulableAbono(ctx.getUser(), abono)
      },
      run: async (args) => {
        const abono = findAbono(args)
        if (!abono) return fail('No encontre ese abono.')
        ctx.openAnular(abono)
        return ok({ mensaje: `Confirmacion para anular el abono #${abono.id} abierta. El usuario debe presionar Confirmar anulacion.` })
      },
    },
  ]
}
