import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, fail, limitRows, ok, positiveInt } from '@/features/agent/tool-helpers'
import { motivoNoAnulableVenta } from '@/features/sales/utils/anulacion-rules'
import type { Venta } from '@/features/sales/types/sales'
import type { AuthUser } from '@/features/core/store/auth-store'
import type { Abono } from '../types/clientes'
import { motivoNoAnulableAbono } from '../utils/anulacion-rules'
import { getVentaTotal } from '../utils/venta-total'

type UserLike = Pick<AuthUser, 'role' | 'puede_anular'> | null

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
      description: `Lista las compras del cliente (maximo ${MAX_READ_ROWS}): id, fecha, total, abonado, saldo y estado.`,
      parameters: NO_PARAMS,
      run: async () => {
        const ventas = ctx.getVentas()
        return ok({
          total: ventas.length,
          mostrando: Math.min(ventas.length, MAX_READ_ROWS),
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
      description: 'Abre el detalle de una compra del cliente (articulos, totales, foto de entrega si hay).',
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
        return ok({ mensaje: `Detalle de la compra #${venta.id} abierto.` })
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
      description: `Lista los abonos del cliente (maximo ${MAX_READ_ROWS}): id, fecha, monto, venta, observacion y si fue revertido.`,
      parameters: NO_PARAMS,
      run: async () => {
        const abonos = ctx.getAbonos()
        return ok({
          total: abonos.length,
          mostrando: Math.min(abonos.length, MAX_READ_ROWS),
          abonos: limitRows(abonos).map((abono) => ({
            id: abono.id,
            fecha: abono.fecha_abono,
            monto: Number(abono.monto),
            id_venta: abono.id_venta,
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
