import image from '@/assets/test.png'


import { useSalesStore } from '../hooks/useSalesStore'
import type { SaleProduct } from '../types/sales'
import ProductItem from '@/components/shared/product/ProductItem'

const products: SaleProduct[] = [
  {
    id: 'faja-seda',
    name: 'Faja seda',
    category: 'Fajas',
    price: 120,
    stock: 20,
    image,
  },
  {
    id: 'faja-colombiana',
    name: 'Faja colombiana',
    category: 'Fajas',
    price: 185,
    stock: 12,
    image,
  },
  {
    id: 'blusa-manga-corta',
    name: 'Blusa manga corta',
    category: 'Blusas',
    price: 95,
    stock: 18,
    image,
  },
  {
    id: 'legging-control',
    name: 'Legging control',
    category: 'Leggings',
    price: 140,
    stock: 10,
    image,
  },
  {
    id: 'top-deportivo',
    name: 'Top deportivo',
    category: 'Ropa deportiva',
    price: 88,
    stock: 14,
    image,
  },
  {
    id: 'body-moldeador',
    name: 'Body moldeador',
    category: 'Bodies',
    price: 210,
    stock: 8,
    image,
  },
]



const ListProduct = () => {
  const addItem = useSalesStore((state) => state.addItem)

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductItem key={product.id} item={product} onClick={addItem} />
      ))}
    </div>
  )
}

export default ListProduct
