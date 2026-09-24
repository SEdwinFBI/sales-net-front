import { describe, expect, it } from 'vitest'
import { createTable, getCoreRowModel, getFilteredRowModel, type ColumnFiltersState } from '@tanstack/react-table'
import { amountFilter, dateFilter, idFilter, textFilter } from './table-filters'

function filterValues(values: unknown[], filterFn: typeof textFilter, query: string) {
  const table = createTable({
    data: values.map((value) => ({ value })),
    columns: [{ accessorKey: 'value', filterFn }],
    state: { columnFilters: [{ id: 'value', value: query }] },
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    onStateChange: () => {}, renderFallbackValue: null,
  })
  return table.getFilteredRowModel().rows.map((row) => row.original.value)
}

describe('filtros del detalle de cliente', () => {
  it('busca coincidencias parciales de ID sin interpretarlas como rangos', () => {
    expect(filterValues([1, 2, 5, 92, 112, 157, 1570], idFilter, '157')).toEqual([157, 1570])
    expect(filterValues([1, 92, 112, 157], idFilter, '1')).toEqual([1, 112, 157])
    expect(filterValues([null, '157', 1570], idFilter, ' 157 ')).toEqual(['157', 1570])
    expect(filterValues([1, 5, 15, 157, 215, 92], idFilter, '15')).toEqual([15, 157, 215])
  })

  it('compara importes completos, tanto números como cadenas, sin confundir nulos con cero', () => {
    expect(filterValues([1, 5, 100, '100.00', 1000], amountFilter, '100')).toEqual([100, '100.00'])
    expect(filterValues([null, 0, '0.00', -25, 1250], amountFilter, '0')).toEqual([0, '0.00'])
    expect(filterValues([-25, 25], amountFilter, '-25.00')).toEqual([-25])
    expect(filterValues([1250, 12], amountFilter, 'Q1,250.00')).toEqual([1250])
    expect(filterValues([1, 100], amountFilter, 'abc')).toEqual([])
  })

  it('acepta fechas visibles y originales', () => {
    const date = '2026-09-23T12:00:00'
    expect(filterValues([null, date], dateFilter, '23/09/2026')).toEqual([date])
    expect(filterValues([date], dateFilter, '2026-09-23')).toEqual([date])
  })

  it('busca textos con tildes, espacios y usuarios visibles aunque la primera fila sea nula', () => {
    expect(filterValues([null, 'Crédito'], textFilter, ' CREDITO ')).toEqual(['Crédito'])
    expect(filterValues([null, 'Ana Pérez @aperez'], textFilter, '@aperez')).toEqual(['Ana Pérez @aperez'])
    expect(filterValues([null, 'Ana Pérez @aperez'], textFilter, 'ana   perez')).toEqual(['Ana Pérez @aperez'])
  })

  it('combina filtros y permite limpiarlos sin perder registros', () => {
    let columnFilters: ColumnFiltersState = []
    const data = [{ id: 157, estado: 'PENDIENTE' }, { id: 1, estado: 'PAGADA' }]
    const table = createTable({
      data, columns: [{ accessorKey: 'id', filterFn: idFilter }, { accessorKey: 'estado', filterFn: textFilter }],
      state: { columnFilters },
      onColumnFiltersChange: (updater) => {
        columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater
        table.setOptions((options) => ({ ...options, state: { columnFilters } }))
      },
      getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
      onStateChange: () => {}, renderFallbackValue: null,
    })
    table.getColumn('id')!.setFilterValue('157')
    expect(table.getFilteredRowModel().rows.map((row) => row.original.id)).toEqual([157])
    table.getColumn('estado')!.setFilterValue('pagada')
    expect(table.getFilteredRowModel().rows).toHaveLength(0)
    table.getColumn('estado')!.setFilterValue(' ')
    expect(table.getFilteredRowModel().rows).toHaveLength(1)
    table.getColumn('id')!.setFilterValue('')
    expect(table.getFilteredRowModel().rows).toHaveLength(2)
  })
})
