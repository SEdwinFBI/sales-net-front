'use no memo';
import type { Table } from '@tanstack/react-table'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import Paginator from './Paginator'

type Props<TData> = {
  table: Table<TData>
}

export default function TablePagination<TData>({ table }: Props<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()

  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Field orientation="horizontal" className="w-full items-center justify-between sm:w-fit sm:justify-start">
        <FieldLabel htmlFor="table-rows-per-page">Filas por página</FieldLabel>
        <Select
          id="table-rows-per-page"
          className="w-20"
          value={String(pageSize)}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </Select>
      </Field>

      <Paginator
        page={pageIndex + 1}
        totalPages={pageCount}
        onPageChange={(page) => table.setPageIndex(page - 1)}
      />
    </div>
  )
}
