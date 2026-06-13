import type { Table } from '@tanstack/react-table'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  Pagination as PaginationNav,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'

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

      <PaginationNav className="mx-0 w-full sm:w-auto">
        <PaginationContent className="flex-wrap justify-center sm:justify-end">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (table.getCanPreviousPage()) table.previousPage()
              }}
              className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
            const start = Math.max(0, pageIndex - 2)
            const p = start + i
            if (p >= pageCount) return null
            return (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === pageIndex}
                  href="#"
                  onClick={(e) => { e.preventDefault(); table.setPageIndex(p) }}
                  size="default"
                >
                  {p + 1}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (table.getCanNextPage()) table.nextPage()
              }}
              className={!table.getCanNextPage() ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationNav>
    </div>
  )
}
