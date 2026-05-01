import image from '@/assets/img.jpg'
import image2 from '@/assets/test.png'

import { useSalesStore } from '../hooks/useSalesStore'
import type { Product } from '../types/sales'
import ProductItem from '@/components/shared/product/ProductItem'

const products: Product[] = [
  {
    id: 'faja-seda',
    name: 'Faja seda',
    category: 'Fajas',
    variants: [
      { id: '233', size: '20', stock: 3, price: 120 },
      { id: '2321', size: '40', stock: 8, price: 120 },
      { id: '232234', size: '40', stock: 8, price: 120 },
      { id: '232245', size: '40', stock: 8, price: 120 },
      { id: '232365', size: '50', stock: 5, price: 120 },
      { id: '2324', size: '20', stock: 4, price: 130 },
      { id: '23236', size: '50', stock: 5, price: 120 },
    ],
    image,
  },
  {
    id: 'faja-colombiana',
    name: 'Faja xela',
    category: 'Fajas',
    variants: [
      { id: 's', size: 'S', stock: 4, price: 186 },
      { id: 'm', size: 'M', stock: 6, price: 185 },
      { id: 'l', size: 'L', stock: 2, price: 190 },
    ],
    image: image2,
  },
  {
    id: 'blusa-manga-corta',
    name: 'Blusa manga corta',
    category: 'Blusas',
    variants: [
      { id: 's', size: 'S', stock: 10, price: 95 },
      { id: 'm', size: 'M', stock: 8, price: 95 },
    ],
    image,
  },
  {
    id: 'legging-control',
    name: 'corte ',
    category: 'cortes',
    variants: [
      { id: 's', size: 'S', stock: 5, price: 140 },
      { id: 'm', size: 'M', stock: 0, price: 140 },
      { id: 'l', size: 'L', stock: 5, price: 145 },
    ],
    image,
  },
  {
    id: 'top-deportivo',
    name: 'corte de xela',
    category: 'cortes',
    variants: [
      { id: 's', size: 'S', stock: 6, price: 88 },
      { id: 'm', size: 'M', stock: 8, price: 88 },
    ],
    image: image2,
  },
  {
    id: 'body-moldeador',
    name: 'blusa marca',
    category: 'blusas',
    variants: [
      { id: 'xs', size: 'XS', stock: 3, price: 210 },
      { id: 's', size: 'S', stock: 5, price: 210 },
    ],
    image,
  },
]

const ListProduct = () => {
  const addItem = useSalesStore((state) => state.addItem)

  return (
    <div className="gap-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((product) => (
        <ProductItem key={product.id} item={product} onClick={addItem} />
      ))}
    </div>
  )
}

export default ListProduct
