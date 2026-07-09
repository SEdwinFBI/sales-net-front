

import { useSalesStore } from '../store/useSalesStore'
import type { Product } from '../types/sales'
import ProductItem from '@/features/sales/components/ProductItem'
import SkeletonProductCard from '@/components/shared/product/SkeletonProductCard'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import Paginator from '@/components/shared/table/Paginator'


type ListProductProps = {
  data: Product[],
  isLoading?: boolean,
  page?: number,
  totalPages?: number,
  pageSize?: number,
  onPageChange?: (page: number) => void,
  onPageSizeChange?: (size: number) => void,
}

const ListProduct = ({ data, isLoading, page, totalPages, pageSize, onPageChange, onPageSizeChange }: ListProductProps) => {
  const addItem = useSalesStore((state) => state.addItem)

  if (isLoading) {
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(9.25rem,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-5">
      {
        Array.from({ length: 12 }).map((_, index) => (
          <SkeletonProductCard key={index} />
        ))
      }
    </div>
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9.25rem,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-5">
        {data.map((product) => (
          <ProductItem key={product.id} item={product} onClick={addItem} />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl  p-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
        <Field orientation="horizontal" className="w-full items-center justify-between sm:w-fit sm:justify-start">
          <FieldLabel htmlFor="select-rows-per-page">Filas por página</FieldLabel>
          <Select
            id="select-rows-per-page"
            className="w-20"
            value={String(pageSize ?? 10)}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </Field>

        <Paginator
          page={page ?? 1}
          totalPages={totalPages ?? 1}
          onPageChange={(p) => onPageChange?.(p)}
        />
      </div>
    </>
  )
}

export default ListProduct
