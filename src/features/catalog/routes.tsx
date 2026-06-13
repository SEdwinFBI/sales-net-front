import { Boxes, Package } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const catalogRoutes: AppRoute[] = [
  {
    path: 'catalogo',
    meta: {
      name: 'Catalogo',
      description: 'Opciones de catalogo',
      icon: Package,
    },
    children: [
      {
        path: 'productos',
        meta: {
          name: 'Articulos',
          description: 'Configuracion de articulos',
          icon: Package,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsList'),
        },
      },
      {
        path: 'stock',
        meta: {
          name: 'Stock',
          description: 'Gestion de stock por vendedor',
          icon: Boxes,
          permissions: ['admin'],
          lazy: () => import('./pages/StockPage'),
        },
      },
    ],
  },
]
