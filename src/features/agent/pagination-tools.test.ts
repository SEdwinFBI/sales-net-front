import { describe, expect, it, vi } from 'vitest'
import type { Table } from '@tanstack/react-table'
import { validateToolDef } from './registry/agent-tool-registry'
import { paginationTool, slicePagination, tablePagination, type PaginationCtx } from './pagination-tools'

const context = (over: Partial<PaginationCtx> = {}) => {
  const ctx = {
    get: () => ({ pagina: 2, paginas: 5, tamano: 10, total: 47 }),
    setPagina: vi.fn(),
    setTamano: vi.fn(),
    ...over,
  } satisfies PaginationCtx
  return ctx
}
const ejecutar = async (def: ReturnType<typeof paginationTool>, args: Record<string, unknown>) => {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}

describe('paginationTool', () => {
  it('es una tool válida con nombre paginar_<sufijo>', () => {
    const def = paginationTool('usuarios', 'la tabla de usuarios', context())
    expect(def.name).toBe('paginar_usuarios')
    expect(validateToolDef(def)).toBeNull()
    expect(def.requiere_confirmacion).toBeUndefined()
  })

  it('sin argumentos devuelve la paginación y las filas visibles (máximo 50)', async () => {
    const filas = Array.from({ length: 80 }, (_, i) => ({ id: i }))
    const result = await ejecutar(paginationTool('x', 'x', context({ getFilas: () => filas })), {})
    expect(result.ok && result.data).toMatchObject({ pagina: 2, paginas: 5, tamano: 10, total: 47 })
    expect(result.ok && (result.data as { filas: unknown[] }).filas).toHaveLength(50)
  })

  it('cambia de página solo dentro del rango', async () => {
    const ctx = context()
    const def = paginationTool('x', 'x', ctx)
    expect((await ejecutar(def, { pagina: 5 })).ok).toBe(true)
    expect(ctx.setPagina).toHaveBeenCalledWith(5)
    for (const pagina of [0, 6, 1.5, '2', null]) expect((await ejecutar(def, { pagina })).ok, String(pagina)).toBe(false)
    expect(ctx.setPagina).toHaveBeenCalledTimes(1)
  })

  it('cambia el tamaño solo a un valor ofrecido y entonces vuelve a la página 1', async () => {
    const ctx = context()
    const def = paginationTool('x', 'x', ctx)
    const result = await ejecutar(def, { tamano: 25 })
    expect(ctx.setTamano).toHaveBeenCalledWith(25)
    expect(result.ok && result.data).toMatchObject({ pagina: 1, tamano: 25 })
    expect((await ejecutar(def, { tamano: 7 })).ok).toBe(false)
    expect((await ejecutar(def, { tamano: 25, pagina: 3 })).ok).toBe(false)
  })

  it('una tabla de tamaño fijo no ofrece ni acepta tamano', async () => {
    const def = paginationTool('x', 'x', context({ setTamano: undefined }))
    expect(JSON.stringify(def.parameters)).not.toContain('tamano')
    expect((await ejecutar(def, { tamano: 10 })).ok).toBe(false)
  })

  it('respeta el bloqueo para cambiar, pero siempre deja leer', async () => {
    const ctx = context({ bloqueo: () => 'Hay cambios sin guardar.' })
    const def = paginationTool('x', 'x', ctx)
    expect(await ejecutar(def, { pagina: 3 })).toEqual({ ok: false, error: 'Hay cambios sin guardar.' })
    expect(ctx.setPagina).not.toHaveBeenCalled()
    expect((await ejecutar(def, {})).ok).toBe(true)
  })

  it('con una sola página vacía informa paginas = 1', async () => {
    const result = await ejecutar(paginationTool('x', 'x', context({ get: () => ({ pagina: 1, paginas: 0, tamano: 10, total: 0 }) })), {})
    expect(result.ok && result.data).toMatchObject({ paginas: 1, total: 0 })
  })
})

describe('slicePagination', () => {
  it('calcula las páginas de una lista cortada a mano', () => {
    const setPagina = vi.fn()
    const ctx = slicePagination(25, 12, 2, setPagina)
    expect(ctx.get()).toEqual({ pagina: 2, paginas: 3, tamano: 12, total: 25 })
    expect(ctx.setTamano).toBeUndefined()
    expect(slicePagination(0, 12, 1, setPagina).get().paginas).toBe(1)
  })
})

describe('tablePagination', () => {
  const cell = (id: string, value: unknown) => ({ column: { id }, getValue: () => value })
  const table = {
    getState: () => ({ pagination: { pageIndex: 1, pageSize: 10 } }),
    getPageCount: () => 3,
    getFilteredRowModel: () => ({ rows: new Array(27) }),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    getRowModel: () => ({
      rows: [
        {
          original: { id: 7, email: 'ana@correo.com' },
          getVisibleCells: () => [cell('nombre', 'Ana'), cell('total', 12.5), cell('activo', true), cell('acciones', undefined), cell('detalle', { a: 1 }), cell('nota', 'x'.repeat(200))],
        },
      ],
    }),
  } as unknown as Table<unknown>

  it('lee el estado y traduce página (base 1) y tamaño', () => {
    const ctx = tablePagination(table)
    expect(ctx.get()).toEqual({ pagina: 2, paginas: 3, tamano: 10, total: 27 })
    ctx.setPagina(3)
    expect(table.setPageIndex).toHaveBeenCalledWith(2)
    ctx.setTamano?.(25)
    expect(table.setPageSize).toHaveBeenCalledWith(25)
  })

  it('las filas solo llevan valores simples de las columnas visibles (nada que la tabla no muestre)', () => {
    const [fila] = tablePagination(table).getFilas?.() as Record<string, unknown>[]
    expect(fila).toMatchObject({ id: 7, nombre: 'Ana', total: 12.5, activo: true })
    expect(fila).not.toHaveProperty('acciones')
    expect(fila).not.toHaveProperty('detalle')
    expect(fila).not.toHaveProperty('email')
    expect(String(fila.nota).length).toBeLessThanOrEqual(81)
  })
})
