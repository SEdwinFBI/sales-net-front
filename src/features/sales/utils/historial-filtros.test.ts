import { createTable, getCoreRowModel, getFilteredRowModel, type ColumnDef } from '@tanstack/react-table'
import { describe, expect, it } from 'vitest'
import type { Venta } from '../types/sales'
import { coincideBusqueda, filtrarPorTexto, normalizarTexto } from './historial-filtros'

const venta = (id: number, extra: Partial<Venta> = {}): Venta => ({
  id,
  fecha: '2026-11-10T15:30:00',
  total: 250,
  total_neto: 240,
  total_descuento: 10,
  estado: 'PAGADA',
  forma_pago: 'Efectivo',
  abonado: 0,
  saldo: 0,
  observacion: null,
  foto_url: null,
  sucursal: { id: 1, nombre: 'Kiche' },
  vendedor: { id: 7, username: 'ana', full_name: 'Ana López' },
  cliente_info: { id: 3, nombre_completo: 'Irma', telefono: '1', balance: 0 },
  detalles: [],
  ...extra,
})

// Mismas columnas que la tabla del historial para los filtros que fallaban.
const columns: ColumnDef<Venta>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'saldo' },
  { id: 'total_sin_descuento', accessorFn: (row) => Number(row.total) },
  { accessorKey: 'estado' },
  { accessorKey: 'observacion' },
]

const filtrar = (data: Venta[], id: string, value: string) => {
  const table = createTable<Venta>({
    data,
    columns,
    state: { columnFilters: [{ id, value }] },
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    defaultColumn: { filterFn: filtrarPorTexto },
  })
  return table.getFilteredRowModel().rows.map((r) => r.original.id)
}

describe('filtro por columna del historial', () => {
  it('Observacion filtra por texto aunque la primera fila no tenga observacion', () => {
    const data = [
      venta(1, { observacion: null }),
      venta(2, { observacion: 'Entregar el viernes' }),
      venta(3, { observacion: 'Pago de mercadería' }),
    ]
    expect(filtrar(data, 'observacion', 'viernes')).toEqual([2])
    expect(filtrar(data, 'observacion', 'MERCADERIA')).toEqual([3])
    expect(filtrar(data, 'observacion', 'zzz')).toEqual([])
  })

  it('las columnas numericas filtran por el numero que se escribe, no por un rango', () => {
    const data = [venta(5), venta(12), venta(120), venta(7, { saldo: 1500.5 }), venta(8, { total: 99 })]
    expect(filtrar(data, 'id', '12')).toEqual([12, 120])
    expect(filtrar(data, 'id', '#5')).toEqual([5])
    expect(filtrar(data, 'saldo', '1500')).toEqual([7])
    expect(filtrar(data, 'saldo', '1,500')).toEqual([7])
    expect(filtrar(data, 'total_sin_descuento', '99')).toEqual([8])
  })

  it('las columnas de texto siguen filtrando sin importar mayusculas', () => {
    const data = [venta(1), venta(2, { estado: 'PENDIENTE' })]
    expect(filtrar(data, 'estado', 'pend')).toEqual([2])
  })
})

describe('buscador superior del historial', () => {
  it('busca por numero, cliente, sucursal, vendedor y observacion sin tildes', () => {
    const v = venta(44, { observacion: 'Entrega en Quiché' })
    expect(coincideBusqueda(v, '44')).toBe(true)
    expect(coincideBusqueda(v, 'irma')).toBe(true)
    expect(coincideBusqueda(v, 'kiche')).toBe(true)
    expect(coincideBusqueda(v, 'lopez')).toBe(true)
    expect(coincideBusqueda(v, 'quiche')).toBe(true)
    expect(coincideBusqueda(v, 'otra cosa')).toBe(false)
    expect(coincideBusqueda(venta(1), '')).toBe(true)
  })

  it('una venta sin observacion ni vendedor no rompe la busqueda', () => {
    expect(coincideBusqueda(venta(2, { vendedor: null, observacion: undefined }), 'irma')).toBe(true)
    expect(coincideBusqueda(venta(2, { vendedor: null, observacion: undefined }), 'ana')).toBe(false)
  })

  it('normaliza tildes y mayusculas', () => {
    expect(normalizarTexto('  Observación ')).toBe('observacion')
  })
})
