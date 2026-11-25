import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type FilterFn,
} from '@tanstack/react-table'
import { describe, expect, it } from 'vitest'
import { formatCurrency } from '@/helpers/money'
import { formatDisplayDate } from '@/lib/dates'
import { crearFiltroTexto, normalizarTexto } from './table-filters'

type Fila = { id: number; nombre: string | null; monto: number; fecha: string | null; nota?: string | null }

const columnas: ColumnDef<Fila>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'nombre' },
  { accessorKey: 'monto' },
  { accessorKey: 'fecha' },
  { accessorKey: 'nota' },
]

const filtrar = (data: Fila[], filtro: FilterFn<Fila> | undefined, id: string, value: string) => {
  const table = createTable<Fila>({
    data,
    columns: columnas,
    state: { columnFilters: [{ id, value }] },
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(filtro ? { defaultColumn: { filterFn: filtro } } : {}),
  })
  return table.getFilteredRowModel().rows.map((r) => r.original.id)
}

const datos: Fila[] = [
  // La primera fila trae nulos: es lo que hace que TanStack elija un filtro que no sirve para texto.
  { id: 1, nombre: null, monto: 5, fecha: null, nota: null },
  { id: 12, nombre: 'María López', monto: 1500.5, fecha: '2026-11-10T15:30:00', nota: 'Entrega el viernes' },
  { id: 120, nombre: 'Juan', monto: 99, fecha: '2026-11-11T09:00:00', nota: 'Pago de mercadería' },
]

const filtro = crearFiltroTexto<Fila>({
  id: (f) => `#${f.id}`,
  monto: (f) => formatCurrency(f.monto),
  fecha: (f) => (f.fecha ? formatDisplayDate(f.fecha) : null),
})

describe('crearFiltroTexto', () => {
  it('sin el filtro propio, TanStack falla con la primera fila nula o numerica (el bug que corrige)', () => {
    expect(filtrar(datos, undefined, 'nota', 'viernes')).toEqual([])
    expect(filtrar(datos, undefined, 'id', '12')).not.toEqual([12, 120])
  })

  it('filtra texto aunque la primera fila sea nula, sin tildes ni mayusculas', () => {
    expect(filtrar(datos, filtro, 'nota', 'VIERNES')).toEqual([12])
    expect(filtrar(datos, filtro, 'nombre', 'maria lopez')).toEqual([12])
    expect(filtrar(datos, filtro, 'nota', 'mercaderia')).toEqual([120])
    expect(filtrar(datos, filtro, 'nota', 'zzz')).toEqual([])
  })

  it('las columnas numericas filtran por el numero escrito, no por rango', () => {
    expect(filtrar(datos, filtro, 'id', '12')).toEqual([12, 120])
    expect(filtrar(datos, filtro, 'id', '#120')).toEqual([120])
    expect(filtrar(datos, filtro, 'monto', '1500')).toEqual([12])
    expect(filtrar(datos, filtro, 'monto', '1,500')).toEqual([12])
    expect(filtrar(datos, filtro, 'monto', formatCurrency(99))).toEqual([120])
  })

  it('las fechas se filtran por lo que se ve en pantalla y por el valor crudo', () => {
    expect(filtrar(datos, filtro, 'fecha', formatDisplayDate('2026-11-10T15:30:00'))).toEqual([12])
    expect(filtrar(datos, filtro, 'fecha', '2026-11-11')).toEqual([120])
  })

  it('un filtro vacio no excluye nada', () => {
    expect(filtrar(datos, filtro, 'nota', '   ')).toEqual([1, 12, 120])
  })

  it('normaliza tildes, mayusculas y espacios repetidos', () => {
    expect(normalizarTexto('  Observación   Final ')).toBe('observacion final')
    expect(normalizarTexto(null)).toBe('')
  })
})
