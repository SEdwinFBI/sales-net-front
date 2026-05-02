

import { useSalesStore } from '../store/useSalesStore'
import type { Product } from '../types/sales'
import ProductItem from '@/features/sales/components/ProductItem'
import SkeletonProductCard from '@/components/shared/product/SkeletonProductCard'


type ListProductProps = {
  data: Product[],
  isLoading?: boolean,
}

const ListProduct = ({ data, isLoading }: ListProductProps) => {
  const addItem = useSalesStore((state) => state.addItem)

  if (isLoading) {
    return <div className="gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {
        Array.from({ length: 12 }).map((_, index) => (
          <SkeletonProductCard key={index} />
        ))
      }
    </div>
  }

  return (
    <div className="gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {data.map((product) => (
        <ProductItem key={product.id} item={product} onClick={addItem} />
      ))}
    </div>
  )
}

export default ListProduct
