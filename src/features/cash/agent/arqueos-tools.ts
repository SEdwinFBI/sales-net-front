import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  MAX_READ_ROWS,
  NO_PARAMS,
  fail,
  limitRows,
  mergeDateRange,
  ok,
  positiveInt,
  type DateRange,
} from '@/features/agent/tool-helpers'
import type { Caja } from '../types/cash'

export type ArqueoLevel = 'general' | 'sucursal' | 'usuario'

export type ArqueoSucursal = { id: number; nombre: string; activo: boolean; usuarios_count?: number }
export type ArqueoUsuario = { id: number; username: string; full_name: string }

/** Lo que CashAuditsPage le presta al agente: su navegación general → sucursal → usuario. */
export type ArqueosAgentContext = {
  getFilters: () => DateRange
  setFilters: (range: DateRange) => void
  getLevel: () => ArqueoLevel
  isLoading: () => boolean
  getSucursales: () => ArqueoSucursal[]
  /** Sucursal seleccionada (nivel sucursal o usuario) con sus usuarios. */
  getBranch: () => { id: number; nombre: string; usuarios: ArqueoUsuario[] } | undefined
  getUser: () => ArqueoUsuario | undefined
  /** Cajas de hoy, ya acotadas al nivel actual (todas / de la sucursal / del usuario). */
  getTodayCajas: () => Caja[]
  /** Cajas del período filtrado del usuario seleccionado (vacío en otros niveles). */
  getPeriodCajas: () => Caja[]
  /** El diálogo de detalle de caja está abierto. */
  isDialogOpen: () => boolean
  selectBranch: (id: number) => void
  selectUser: (id: number) => void
  back: () => void
  openDetalle: (cajaId: number) => void
  isDownloading: () => boolean
  /** Descarga el reporte PDF; true si salió bien (el error ya lo muestra la página). */
  download: () => Promise<boolean>
}

type Totals = { entradas: number; gastos: number; resto: number; ventas_efectivo: number; saldo_esperado: number }

function sumCajas(cajas: Caja[]): Totals {
  const total = cajas.reduce(
    (acc, caja) => ({
      entradas: acc.entradas + Number(caja.entradas),
      gastos: acc.gastos + Number(caja.salidas),
      ventas_efectivo: acc.ventas_efectivo + Number(caja.ventas_efectivo),
      saldo_esperado: acc.saldo_esperado + Number(caja.efectivo_esperado),
    }),
    { entradas: 0, gastos: 0, ventas_efectivo: 0, saldo_esperado: 0 },
  )
  return { ...total, resto: total.entradas - total.gastos }
}

/** Tools de /caja/arqueos (solo admin: la ruta ya lo exige). */
export function buildArqueosTools(ctx: ArqueosAgentContext): AgentToolDef[] {
  return [
    {
      name: 'filtrar_arqueos',
      description: 'Cambia el rango de fechas del reporte de arqueos (AAAA-MM-DD). Las fechas siempre llevan valor.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        if (!('fecha_desde' in args) && !('fecha_hasta' in args)) return 'Indica fecha_desde y/o fecha_hasta.'
        const merged = mergeDateRange(args, ctx.getFilters())
        return 'error' in merged ? merged.error : null
      },
      run: async (args) => {
        const merged = mergeDateRange(args, ctx.getFilters())
        if ('error' in merged) return fail(merged.error)
        ctx.setFilters(merged.range)
        return ok({ filtros: merged.range, mensaje: 'Rango aplicado. Usa leer_arqueos para ver el resultado.' })
      },
    },
    {
      name: 'leer_arqueos',
      description: `Resume la pantalla actual de arqueos: sucursales, usuarios de una sucursal o cajas por dia de un usuario (maximo ${MAX_READ_ROWS} filas).`,
      parameters: NO_PARAMS,
      run: async () => {
        const level = ctx.getLevel()
        const base = { nivel: level, filtros: ctx.getFilters(), cargando: ctx.isLoading() }
        const today = ctx.getTodayCajas()

        if (level === 'general') {
          const sucursales = ctx.getSucursales()
          return ok({
            ...base,
            total: sucursales.length,
            sucursales: limitRows(sucursales).map((s) => ({
              id: s.id,
              nombre: s.nombre,
              activa: s.activo,
              usuarios: s.usuarios_count ?? 0,
              saldo_esperado_hoy: sumCajas(today.filter((c) => c.sucursal.id === s.id)).saldo_esperado,
            })),
          })
        }

        const branch = ctx.getBranch()
        if (level === 'sucursal') {
          return ok({
            ...base,
            sucursal: branch?.nombre ?? null,
            hoy: sumCajas(today),
            usuarios: limitRows(branch?.usuarios ?? []).map((u) => {
              const cajas = today.filter((c) => c.usuario.id === u.id)
              return {
                id: u.id,
                nombre: u.full_name || u.username,
                tiene_caja_hoy: cajas.length > 0,
                saldo_esperado_hoy: sumCajas(cajas).saldo_esperado,
              }
            }),
          })
        }

        const periodo = ctx.getPeriodCajas()
        const user = ctx.getUser()
        return ok({
          ...base,
          sucursal: branch?.nombre ?? null,
          usuario: user ? user.full_name || user.username : null,
          hoy: sumCajas(today),
          total_cajas: periodo.length,
          mostrando: Math.min(periodo.length, MAX_READ_ROWS),
          cajas: limitRows(periodo).map((c) => ({
            caja_id: c.id,
            fecha: c.fecha,
            entradas: Number(c.entradas),
            gastos: Number(c.salidas),
            resto: Number(c.entradas) - Number(c.salidas),
            ventas_efectivo: Number(c.ventas_efectivo),
            saldo_esperado: Number(c.efectivo_esperado),
          })),
        })
      },
    },
    {
      name: 'abrir_arqueo_sucursal',
      description: 'Abre el arqueo de una sucursal (ver sus usuarios y el saldo esperado de hoy). Usa el id de leer_arqueos.',
      parameters: {
        type: 'object',
        properties: { sucursal_id: { type: 'integer' } },
        required: ['sucursal_id'],
        additionalProperties: false,
      },
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const id = positiveInt(args.sucursal_id)
        return id !== null && ctx.getSucursales().some((s) => s.id === id)
          ? null
          : 'No encontre esa sucursal (ver leer_arqueos en la lista de sucursales).'
      },
      run: async (args) => {
        const id = positiveInt(args.sucursal_id)
        const sucursal = ctx.getSucursales().find((s) => s.id === id)
        if (!sucursal) return fail('No encontre esa sucursal.')
        ctx.selectBranch(sucursal.id)
        return ok({ mensaje: `Arqueo de ${sucursal.nombre} abierto. Usa leer_arqueos para ver sus usuarios.` })
      },
    },
    {
      name: 'abrir_arqueo_usuario',
      description: 'Abre el arqueo de un usuario de la sucursal seleccionada (sus cajas por dia). Usa el id de leer_arqueos.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer' } },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const branch = ctx.getBranch()
        if (!branch) return 'Primero abre el arqueo de una sucursal (abrir_arqueo_sucursal).'
        const id = positiveInt(args.usuario_id)
        return id !== null && branch.usuarios.some((u) => u.id === id)
          ? null
          : 'No encontre ese usuario en la sucursal seleccionada (ver leer_arqueos).'
      },
      run: async (args) => {
        const user = ctx.getBranch()?.usuarios.find((u) => u.id === positiveInt(args.usuario_id))
        if (!user) return fail('No encontre ese usuario.')
        ctx.selectUser(user.id)
        return ok({ mensaje: `Arqueo de ${user.full_name || user.username} abierto. Usa leer_arqueos para ver sus cajas.` })
      },
    },
    {
      name: 'volver_arqueos',
      description: 'Vuelve un nivel atras en los arqueos: de usuario a sucursal, o de sucursal a la lista de sucursales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.getLevel() === 'general' ? 'Ya estas en la lista de sucursales.' : null),
      run: async () => {
        ctx.back()
        return ok({ mensaje: 'Volviste un nivel atras.' })
      },
    },
    {
      name: 'ver_detalle_caja',
      description: 'Abre el detalle de una caja diaria del usuario seleccionado (resumen y movimientos). Usa el caja_id de leer_arqueos.',
      parameters: {
        type: 'object',
        properties: { caja_id: { type: 'integer' } },
        required: ['caja_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        if (ctx.getLevel() !== 'usuario') return 'Primero abre el arqueo de un usuario (abrir_arqueo_usuario).'
        const id = positiveInt(args.caja_id)
        return id !== null && ctx.getPeriodCajas().some((c) => c.id === id)
          ? null
          : 'No encontre esa caja entre las del usuario en el periodo (ver leer_arqueos).'
      },
      run: async (args) => {
        const id = positiveInt(args.caja_id)
        if (id === null) return fail('caja_id invalido.')
        ctx.openDetalle(id)
        return ok({ mensaje: `Detalle de la caja #${id} abierto.` })
      },
    },
    {
      name: 'descargar_reporte_caja',
      description: 'Descarga el reporte PDF de arqueos con el rango de fechas y el nivel (general, sucursal o usuario) actuales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando el reporte.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'Reporte descargado.' }) : fail('No se pudo descargar el reporte.')),
    },
  ]
}
