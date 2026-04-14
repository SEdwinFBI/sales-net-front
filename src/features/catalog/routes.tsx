import { Package, Tags } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const catalogRoutes: AppRoute[] = [
  {
    path: 'catalogo',
    meta: {
      name: 'Catálogo',
      description: 'Opciones de catálogo',
      icon: Package,
    },
    children: [
      {
        path: 'productos',
        meta: {
          name: 'Productos',
          description: 'Configuración de productos',
          icon: Package,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsList'),
        },
      },
      {
        path: 'categorias',
        meta: {
          name: 'Categorías',
          description: 'Clasificación de productos',
          icon: Tags,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsCategories'),
        },
      },
    ],
  },
]
