import type { Table } from '@tanstack/react-table'
import type { AgentToolDef } from './registry/agent-tool-registry'
import { fail, ok } from './tool-helpers'

export type PaginationState = { pagina: number; paginas: number; tamano: number; total: number }

export type PaginationCtx = {
  get: () => PaginationState
  setPagina: (pagina: number) => void
  /** Solo si la tabla deja elegir el tamaño de página. */
  setTamano?: (tamano: number) => void
  tamanos?: readonly number[]
  /** Filas de la página visible, tal como las muestra la tabla. */
  getFilas?: () => unknown[]
  /** Motivo por el que ahora no se puede cambiar de página (p. ej. hay un borrador sin guardar). */
  bloqueo?: () => string | null
}

export const TABLE_PAGE_SIZES = [10, 25, 50, 100] as const
const MAX_ROWS = 50
const MAX_TEXT = 80

/**
 * Tool `paginar_<sufijo>`: sin argumentos devuelve la paginación (y las filas visibles si la tabla
 * las presta); con `pagina` y/o `tamano` cambia lo mismo que el paginador de la pantalla.
 */
export function paginationTool(sufijo: string, etiqueta: string, ctx: PaginationCtx): AgentToolDef {
  const tamanos = ctx.setTamano ? (ctx.tamanos ?? TABLE_PAGE_SIZES) : []
  const describe = () => {
    const state = ctx.get()
    return { ...state, paginas: Math.max(state.paginas, 1) }
  }
  const check = (args: Record<string, unknown>): string | null => {
    const cambia = 'pagina' in args || 'tamano' in args
    if (cambia) {
      const bloqueo = ctx.bloqueo?.()
      if (bloqueo) return bloqueo
    }
    if ('tamano' in args && !tamanos.includes(args.tamano as number)) {
      return tamanos.length ? `tamano debe ser uno de: ${tamanos.join(', ')}.` : 'Esta tabla no permite cambiar el tamano de pagina.'
    }
    if ('pagina' in args) {
      const { paginas } = describe()
      const pagina = args.pagina
      // Al cambiar el tamaño la cantidad de páginas cambia: ahí solo se acepta volver a la primera.
      const max = 'tamano' in args ? 1 : paginas
      if (typeof pagina !== 'number' || !Number.isInteger(pagina) || pagina < 1 || pagina > max) {
        return 'tamano' in args ? 'Al cambiar el tamano la tabla vuelve a la pagina 1: pide la pagina despues.' : `pagina debe ser un entero entre 1 y ${paginas}.`
      }
    }
    return null
  }

  return {
    name: `paginar_${sufijo}`,
    description:
      `Paginacion de ${etiqueta}. Sin argumentos devuelve pagina, paginas, tamano y total${ctx.getFilas ? ' y las filas visibles' : ''}. Con pagina${tamanos.length ? ' o tamano' : ''} cambia la pagina mostrada.`.slice(0, 300),
    parameters: {
      type: 'object',
      properties: {
        pagina: { type: 'integer', minimum: 1 },
        ...(tamanos.length ? { tamano: { type: 'integer', enum: [...tamanos] } } : {}),
      },
      additionalProperties: false,
    },
    validar: check,
    run: async (args) => {
      const invalid = check(args)
      if (invalid) return fail(invalid)
      const before = describe()
      if (!('pagina' in args) && !('tamano' in args)) {
        return ok({ ...before, ...(ctx.getFilas ? { filas: ctx.getFilas().slice(0, MAX_ROWS) } : {}) })
      }
      if ('tamano' in args) ctx.setTamano?.(args.tamano as number)
      if ('pagina' in args) ctx.setPagina(args.pagina as number)
      return ok({
        pagina: (args.pagina as number | undefined) ?? ('tamano' in args ? 1 : before.pagina),
        tamano: (args.tamano as number | undefined) ?? before.tamano,
        total: before.total,
        mensaje: `Pagina cambiada. Llama de nuevo a paginar_${sufijo} sin argumentos (o a la herramienta de lectura de la pantalla) para ver las filas.`,
      })
    },
  }
}

const primitive = (value: unknown): string | number | boolean | null | undefined => {
  if (value === null) return null
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') return value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value
  return undefined
}

/** Paginación de una tabla de @tanstack/react-table paginada en el cliente. */
export function tablePagination<T>(table: Table<T>): PaginationCtx {
  return {
    get: () => ({
      pagina: table.getState().pagination.pageIndex + 1,
      paginas: table.getPageCount(),
      tamano: table.getState().pagination.pageSize,
      total: table.getFilteredRowModel().rows.length,
    }),
    setPagina: (pagina) => table.setPageIndex(pagina - 1),
    setTamano: (tamano) => table.setPageSize(tamano),
    tamanos: TABLE_PAGE_SIZES,
    // Solo los valores simples de las columnas visibles: lo mismo que el usuario lee en la tabla.
    getFilas: () =>
      table.getRowModel().rows.map((row) => {
        const fila: Record<string, unknown> = {}
        const id = (row.original as { id?: unknown } | null)?.id
        if (typeof id === 'number' || typeof id === 'string') fila.id = id
        for (const cell of row.getVisibleCells()) {
          const value = primitive(cell.getValue())
          if (value !== undefined) fila[cell.column.id] = value
        }
        return fila
      }),
  }
}

/** Paginación de una lista que la pantalla corta a mano (`slice`) con tamaño fijo. */
export function slicePagination(total: number, tamano: number, pagina: number, setPagina: (pagina: number) => void): PaginationCtx {
  return {
    get: () => ({ pagina, paginas: Math.max(Math.ceil(total / tamano), 1), tamano, total }),
    setPagina,
  }
}
